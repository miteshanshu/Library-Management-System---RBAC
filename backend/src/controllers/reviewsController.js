const db = require('../config/db');
const env = require('../config/env');
const { sendSuccess } = require('../utils/response');
const { ValidationError } = require('../utils/error');

const reviewsFeatureAvailable = async () => db.relationExists('reviews');
const ratingFunctionAvailable = async () => db.routineExists('fn_calculate_book_rating', 'FUNCTION');

const addReview = async (req, res, next) => {
  try {
    const { book_id, rating, comment } = req.body;
    const user_id = req.user.user_id;

    if (!book_id || !rating) {
      return next(new ValidationError('book_id and rating are required'));
    }

    if (!(await reviewsFeatureAvailable())) {
      return next(new ValidationError('Reviews feature is not available in this database'));
    }

    const result = await db.query(
      `INSERT INTO ${env.DB_SCHEMA}.reviews (book_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (book_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [book_id, user_id, rating, comment || null],
      { operationName: 'add review' }
    );

    sendSuccess(res, result.rows[0], 'Review saved successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getBookReviews = async (req, res, next) => {
  try {
    const { bookId } = req.params;

    if (!(await reviewsFeatureAvailable())) {
      return sendSuccess(
        res,
        { reviews: [], stats: { avg_rating: 0, review_count: 0 } },
        'Reviews feature is not available in this database',
        200
      );
    }

    const reviews = await db.query(
      `SELECT r.*, u.full_name
       FROM ${env.DB_SCHEMA}.reviews r
       JOIN ${env.DB_SCHEMA}.users u ON r.user_id = u.user_id
       WHERE r.book_id = $1
       ORDER BY r.created_at DESC`,
      [bookId],
      { operationName: 'get book reviews' }
    );

    let statsRow = null;

    if (await ratingFunctionAvailable()) {
      const stats = await db.selectFunction('fn_calculate_book_rating', [bookId], {
        operationName: 'calculate book rating',
      });
      statsRow = stats.rows[0] || null;
    }

    if (!statsRow) {
      const numericRatings = reviews.rows.map((review) => Number(review.rating) || 0);
      const reviewCount = numericRatings.length;
      const avgRating = reviewCount
        ? Number((numericRatings.reduce((sum, value) => sum + value, 0) / reviewCount).toFixed(1))
        : 0;

      statsRow = {
        avg_rating: avgRating,
        review_count: reviewCount,
      };
    }

    sendSuccess(
      res,
      {
        reviews: reviews.rows,
        stats: statsRow,
      },
      'Book reviews retrieved',
      200
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addReview,
  getBookReviews,
};
