const searchService = require('../services/globalSearch.service');
const { sendSuccess } = require('../utils/response');
const { ValidationError } = require('../utils/error');

const globalSearch = async (req, res, next) => {
  try {
    if (req.query.q !== undefined && typeof req.query.q !== 'string') {
      throw new ValidationError('Query parameter "q" must be a string');
    }
    const q = (req.query.q || '').trim();
    if (!q) {
      throw new ValidationError('Query parameter "q" is required');
    }

    // optional pagination per-entity
    const pagination = (name, fallback, minimum) => {
      const value = req.query[name];
      if (value === undefined) return fallback;
      if (typeof value !== 'string' || !/^\d+$/.test(value) ||
          !Number.isSafeInteger(Number(value)) || Number(value) < minimum) {
        throw new ValidationError(`Query parameter "${name}" must be an integer >= ${minimum}`);
      }
      return Number(value);
    };
    const limit = pagination('limit', 10, 1);
    const offset = pagination('offset', 0, 0);

    // req.user provided by authenticate middleware (JWT)
    const viewer = req.user || { role: 'student' };

    const results = await searchService.searchAll(q, { limit, offset, role: viewer.role });

    sendSuccess(res, results, 'Search results retrieved', 200);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  globalSearch,
};
