class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = null) {
    super(message, 400, errors);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

const isDatabaseError = (err) =>
  Boolean(
    err &&
      (err.code ||
        err.severity ||
        err.detail ||
        err.table ||
        err.schema ||
        err.constraint)
  );

const globalErrorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message =
    statusCode >= 500 && isDatabaseError(err)
      ? 'A database error occurred while processing the request'
      : err.message || 'Internal Server Error';
  const errors = err.errors || null;

  console.error(`[${new Date().toISOString()}] Error:`, {
    message,
    statusCode,
    errors,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  globalErrorHandler,
};
