const db = require('../config/db');
const env = require('../config/env');
const { sendSuccess } = require('../utils/response');
const { ValidationError } = require('../utils/error');

const wishlistFeatureAvailable = async () => db.relationExists('wishlist');
const reviewsAvailable = async () => db.relationExists('reviews');

const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    if (!(await wishlistFeatureAvailable())) {
      return sendSuccess(res, [], 'Wishlist feature is not available in this database', 200);
    }

    const includeReviews = await reviewsAvailable();
    const avgRatingSql = includeReviews
      ? `(SELECT COALESCE(AVG(r.rating), 0) FROM ${env.DB_SCHEMA}.reviews r WHERE r.book_id = b.book_id) as avg_rating`
      : '0::numeric as avg_rating';
    const reviewCountSql = includeReviews
      ? `(SELECT COUNT(*) FROM ${env.DB_SCHEMA}.reviews r WHERE r.book_id = b.book_id) as review_count`
      : '0::bigint as review_count';

    const result = await db.query(
      `SELECT w.wishlist_id, w.added_at, b.book_id, b.title, b.isbn, b.publication_year,
              p.publisher_name,
              ${avgRatingSql},
              ${reviewCountSql}
       FROM ${env.DB_SCHEMA}.wishlist w
       JOIN ${env.DB_SCHEMA}.books b ON w.book_id = b.book_id
       LEFT JOIN ${env.DB_SCHEMA}.publishers p ON b.publisher_id = p.publisher_id
       WHERE w.user_id = $1
       ORDER BY w.added_at DESC`,
      [userId],
      { operationName: 'get wishlist' }
    );

    sendSuccess(res, result.rows, 'Wishlist retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const addToWishlist = async (req, res, next) => {
  const { book_id } = req.body;
  const userId = req.user.user_id;

  if (!book_id) {
    return next(new ValidationError('Book ID is required'));
  }

  try {
    if (!(await wishlistFeatureAvailable())) {
      return next(new ValidationError('Wishlist feature is not available in this database'));
    }

    const result = await db.query(
      `INSERT INTO ${env.DB_SCHEMA}.wishlist (user_id, book_id) VALUES ($1, $2) RETURNING *`,
      [userId, book_id],
      { operationName: 'add to wishlist' }
    );

    sendSuccess(res, result.rows[0], 'Added to wishlist', 201);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Book already in wishlist' });
    }
    next(err);
  }
};

const removeFromWishlist = async (req, res, next) => {
  const { bookId } = req.params;
  const userId = req.user.user_id;

  try {
    if (!(await wishlistFeatureAvailable())) {
      return sendSuccess(res, null, 'Wishlist feature is not available in this database', 200);
    }

    const result = await db.query(
      `DELETE FROM ${env.DB_SCHEMA}.wishlist WHERE user_id = $1 AND book_id = $2 RETURNING *`,
      [userId, bookId],
      { operationName: 'remove from wishlist' }
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Item not found in wishlist' });
    }

    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
