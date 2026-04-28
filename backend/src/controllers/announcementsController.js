const db = require('../config/db');
const env = require('../config/env');
const { sendSuccess } = require('../utils/response');

const getAnnouncements = async (req, res, next) => {
  try {
    if (!(await db.relationExists('announcements'))) {
      return sendSuccess(res, [], 'Announcements feature is not available in this database', 200);
    }

    const result = await db.query(
      `SELECT a.*, u.full_name as author
       FROM ${env.DB_SCHEMA}.announcements a
       LEFT JOIN ${env.DB_SCHEMA}.users u ON a.created_by = u.user_id
       WHERE a.is_active = TRUE
       ORDER BY CASE WHEN priority = 'HIGH' THEN 1 WHEN priority = 'NORMAL' THEN 2 ELSE 3 END,
                created_at DESC`,
      [],
      { operationName: 'get announcements' }
    );

    sendSuccess(res, result.rows, 'Announcements retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, priority } = req.body;
    const created_by = req.user.user_id;

    if (!(await db.relationExists('announcements'))) {
      return res.status(400).json({
        success: false,
        message: 'Announcements feature is not available in this database',
      });
    }

    const result = await db.query(
      `INSERT INTO ${env.DB_SCHEMA}.announcements (title, content, priority, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, content, priority, created_by],
      { operationName: 'create announcement' }
    );

    sendSuccess(res, result.rows[0], 'Announcement created successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
};
