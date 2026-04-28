const pool = require('../config/db');
const env = require('../config/env');
const { sendSuccess } = require('../utils/response');

const getOverdueReport = async (req, res, next) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT l.*, b.title, m.card_number, m.first_name, m.last_name, m.email, GREATEST(CURRENT_DATE - l.due_date, 0) AS days_overdue FROM ${env.DB_SCHEMA}.loans l JOIN ${env.DB_SCHEMA}.book_copies bc ON l.copy_id = bc.copy_id JOIN ${env.DB_SCHEMA}.books b ON bc.book_id = b.book_id JOIN ${env.DB_SCHEMA}.members m ON l.member_id = m.member_id WHERE l.status = $1 ORDER BY l.due_date ASC LIMIT $2 OFFSET $3`,
      ['OVERDUE', limit, offset]
    );

    sendSuccess(res, result.rows, 'Overdue report retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const getCirculationReport = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    let query = `SELECT b.title, COUNT(l.loan_id) as total_checkouts, COUNT(CASE WHEN l.status = $1 THEN 1 END) as returned, COUNT(CASE WHEN l.status IN ($2, $3) THEN 1 END) as outstanding FROM ${env.DB_SCHEMA}.loans l JOIN ${env.DB_SCHEMA}.book_copies bc ON l.copy_id = bc.copy_id JOIN ${env.DB_SCHEMA}.books b ON bc.book_id = b.book_id WHERE 1=1`;
    const params = ['RETURNED', 'ACTIVE', 'OVERDUE'];
    let paramIndex = 4;

    if (start_date) {
      query += ` AND l.checkout_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND l.checkout_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ' GROUP BY b.title ORDER BY total_checkouts DESC';

    const result = await pool.query(query, params);

    sendSuccess(res, result.rows, 'Circulation report retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const getInventorySummary = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT b.title, COUNT(bc.copy_id) as total_copies, COUNT(CASE WHEN bc.status = $1 THEN 1 END) as available, COUNT(CASE WHEN bc.status = $2 THEN 1 END) as loaned, COUNT(CASE WHEN bc.status = $3 THEN 1 END) as maintenance, COUNT(CASE WHEN bc.status = $4 THEN 1 END) as lost FROM ${env.DB_SCHEMA}.book_copies bc JOIN ${env.DB_SCHEMA}.books b ON bc.book_id = b.book_id GROUP BY b.title ORDER BY total_copies DESC`,
      ['AVAILABLE', 'LOANED', 'MAINTENANCE', 'LOST']
    );

    sendSuccess(res, result.rows, 'Inventory summary retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const getMemberActivityReport = async (req, res, next) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT m.member_id, m.card_number, m.first_name, m.last_name, m.email, COUNT(l.loan_id) as total_loans, COUNT(CASE WHEN l.status = $1 THEN 1 END) as returned_loans, COUNT(CASE WHEN l.status IN ($2, $3) THEN 1 END) as outstanding_loans FROM ${env.DB_SCHEMA}.members m LEFT JOIN ${env.DB_SCHEMA}.loans l ON m.member_id = l.member_id GROUP BY m.member_id ORDER BY total_loans DESC LIMIT $4 OFFSET $5`,
      ['RETURNED', 'ACTIVE', 'OVERDUE', limit, offset]
    );

    sendSuccess(res, result.rows, 'Member activity report retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const getDebtAgingReport = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT m.member_id, m.card_number, m.first_name, m.last_name, m.email,
              COALESCE(SUM(CASE WHEN lf.status = $1 THEN GREATEST(lf.amount - COALESCE(fp.total_paid, 0), 0) ELSE 0 END), 0) AS unpaid_fees,
              COALESCE(SUM(CASE WHEN lf.status = $2 THEN GREATEST(lf.amount - COALESCE(fp.total_paid, 0), 0) ELSE 0 END), 0) AS partial_fees
       FROM ${env.DB_SCHEMA}.members m
       LEFT JOIN ${env.DB_SCHEMA}.loan_fees lf ON m.member_id = lf.member_id
       LEFT JOIN (
         SELECT fee_id, SUM(payment_amount) AS total_paid
         FROM ${env.DB_SCHEMA}.fee_payments
         GROUP BY fee_id
       ) fp ON fp.fee_id = lf.fee_id
       GROUP BY m.member_id
       HAVING COALESCE(SUM(CASE WHEN lf.status IN ($1, $2) THEN GREATEST(lf.amount - COALESCE(fp.total_paid, 0), 0) ELSE 0 END), 0) > 0
       ORDER BY unpaid_fees DESC, partial_fees DESC`,
      ['UNPAID', 'PARTIAL']
    );

    sendSuccess(res, result.rows, 'Debt aging report retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const getTurnaroundMetrics = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT EXTRACT(YEAR FROM l.checkout_date) as year, EXTRACT(MONTH FROM l.checkout_date) as month, AVG(l.returned_date - l.checkout_date) as avg_loan_days, COUNT(l.loan_id) as total_loans FROM ${env.DB_SCHEMA}.loans l WHERE l.returned_date IS NOT NULL GROUP BY year, month ORDER BY year DESC, month DESC`
    );

    sendSuccess(res, result.rows, 'Turnaround metrics retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const summaries = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM ${env.DB_SCHEMA}.members`),
      pool.query(`SELECT COUNT(*) as count FROM ${env.DB_SCHEMA}.books`),
      pool.query(`SELECT COUNT(*) as count FROM ${env.DB_SCHEMA}.book_copies WHERE status = $1`, ['AVAILABLE']),
      pool.query(`SELECT COUNT(*) as count FROM ${env.DB_SCHEMA}.loans WHERE status IN ($1, $2)`, ['ACTIVE', 'OVERDUE']),
      pool.query(
        `SELECT COALESCE(SUM(GREATEST(lf.amount - COALESCE(fp.total_paid, 0), 0)), 0) AS total
         FROM ${env.DB_SCHEMA}.loan_fees lf
         LEFT JOIN (
           SELECT fee_id, SUM(payment_amount) AS total_paid
           FROM ${env.DB_SCHEMA}.fee_payments
           GROUP BY fee_id
         ) fp ON fp.fee_id = lf.fee_id
         WHERE lf.status IN ($1, $2)`,
        ['UNPAID', 'PARTIAL']
      ),
    ]);

    const dashboard = {
      total_members: parseInt(summaries[0].rows[0].count),
      total_books: parseInt(summaries[1].rows[0].count),
      available_copies: parseInt(summaries[2].rows[0].count),
      active_loans: parseInt(summaries[3].rows[0].count),
      outstanding_fees: summaries[4].rows[0].total || 0,
    };

    sendSuccess(res, dashboard, 'Dashboard summary retrieved', 200);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverdueReport,
  getCirculationReport,
  getInventorySummary,
  getMemberActivityReport,
  getDebtAgingReport,
  getTurnaroundMetrics,
  getDashboardSummary,
};
