const { Pool } = require('pg');
const env = require('./env');

const TRANSIENT_ERROR_CODES = new Set([
  '40001',
  '40P01',
  '53300',
  '57P01',
  '57P02',
  '57P03',
  '08000',
  '08001',
  '08003',
  '08004',
  '08006',
  '08007',
  '08P01',
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
]);

const DEFAULT_RETRY_ATTEMPTS = Number(process.env.DB_RETRY_ATTEMPTS || 3);
const DEFAULT_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 250);

const validateSchemaName = (schemaName) => {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schemaName)) {
    throw new Error(`Invalid DB_SCHEMA value "${schemaName}"`);
  }

  return schemaName;
};

const schema = validateSchemaName(env.DB_SCHEMA);
const relationExistsCache = new Map();
const routineExistsCache = new Map();

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000),
  maxUses: Number(process.env.DB_MAX_USES || 7500),
  allowExitOnIdle: false,
});

pool.on('error', (err) => {
  console.error('Database pool error:', err.message);
});

pool.on('connect', (client) => {
  client
    .query(`SET search_path TO ${schema}, public`)
    .catch((err) => console.error('Failed to set schema search_path:', err.message));
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientError = (err) => {
  if (!err) {
    return false;
  }

  if (TRANSIENT_ERROR_CODES.has(err.code)) {
    return true;
  }

  const message = String(err.message || '').toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('connection terminated unexpectedly') ||
    message.includes('server closed the connection unexpectedly') ||
    message.includes('terminating connection due to administrator command')
  );
};

const withRetry = async (operation, options = {}) => {
  const {
    retryAttempts = DEFAULT_RETRY_ATTEMPTS,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    operationName = 'database operation',
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= retryAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;

      if (!isTransientError(err) || attempt === retryAttempts) {
        throw err;
      }

      console.warn(
        `${operationName} failed with a transient error (attempt ${attempt}/${retryAttempts}). Retrying...`
      );

      await sleep(retryDelayMs * attempt);
    }
  }

  throw lastError;
};

const query = async (text, params = [], options = {}) =>
  withRetry(() => pool.query(text, params), {
    operationName: options.operationName || 'query',
    retryAttempts: options.retryAttempts,
    retryDelayMs: options.retryDelayMs,
  });

const connect = () => pool.connect();

const end = () => pool.end();

const withTransaction = async (callback, options = {}) =>
  withRetry(async () => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Transaction rollback failed:', rollbackErr.message);
      }
      throw err;
    } finally {
      client.release();
    }
  }, {
    operationName: options.operationName || 'transaction',
    retryAttempts: options.retryAttempts,
    retryDelayMs: options.retryDelayMs,
  });

const buildPlaceholders = (count) => Array.from({ length: count }, (_, index) => `$${index + 1}`).join(', ');

const selectFunction = (functionName, params = [], options = {}) =>
  query(
    `SELECT * FROM ${schema}.${functionName}(${buildPlaceholders(params.length)})`,
    params,
    {
      operationName: options.operationName || `${functionName} function call`,
      retryAttempts: options.retryAttempts,
      retryDelayMs: options.retryDelayMs,
    }
  );

const callProcedure = (procedureName, params = [], options = {}) =>
  query(
    `CALL ${schema}.${procedureName}(${buildPlaceholders(params.length)})`,
    params,
    {
      operationName: options.operationName || `${procedureName} procedure call`,
      retryAttempts: options.retryAttempts,
      retryDelayMs: options.retryDelayMs,
    }
  );

const relationExists = async (relationName, options = {}) => {
  const cacheKey = `${schema}.${relationName}`;

  if (relationExistsCache.has(cacheKey)) {
    return relationExistsCache.get(cacheKey);
  }

  const result = await query(
    'SELECT to_regclass($1) AS relation_name',
    [cacheKey],
    {
      operationName: options.operationName || `check relation ${cacheKey}`,
      retryAttempts: options.retryAttempts,
      retryDelayMs: options.retryDelayMs,
    }
  );

  const exists = Boolean(result.rows[0]?.relation_name);
  relationExistsCache.set(cacheKey, exists);
  return exists;
};

const routineExists = async (routineName, routineType = 'FUNCTION', options = {}) => {
  const normalizedType = String(routineType || 'FUNCTION').toUpperCase();
  const cacheKey = `${schema}.${routineName}.${normalizedType}`;

  if (routineExistsCache.has(cacheKey)) {
    return routineExistsCache.get(cacheKey);
  }

  const result = await query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.routines
       WHERE specific_schema = $1
         AND routine_name = $2
         AND routine_type = $3
     ) AS routine_exists`,
    [schema, routineName, normalizedType],
    {
      operationName: options.operationName || `check routine ${schema}.${routineName}`,
      retryAttempts: options.retryAttempts,
      retryDelayMs: options.retryDelayMs,
    }
  );

  const exists = Boolean(result.rows[0]?.routine_exists);
  routineExistsCache.set(cacheKey, exists);
  return exists;
};

module.exports = {
  pool,
  schema,
  query,
  connect,
  end,
  withRetry,
  withTransaction,
  selectFunction,
  callProcedure,
  relationExists,
  routineExists,
};
