const pool = require('../config/db');
const env = require('../config/env');
const { sendSuccess } = require('../utils/response');
const { ValidationError, NotFoundError } = require('../utils/error');

const searchStudent = async (req, res, next) => {
  try {
    const card_number = req.query.card_number?.trim();
    const email = req.query.email?.trim();

    if (!card_number && !email) {
      return next(new ValidationError('Card number or email is required'));
    }

    let query = `SELECT * FROM ${env.DB_SCHEMA}.members WHERE `;
    const params = [];

    if (email && card_number) {
      query += '(card_number = $1 OR LOWER(email) = LOWER($2))';
      params.push(card_number, email);
    } else if (card_number) {
      query += 'card_number = $1';
      params.push(card_number);
    } else if (email) {
      query += 'LOWER(email) = LOWER($1)';
      params.push(email);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return next(new NotFoundError('Student not found'));
    }

    sendSuccess(res, result.rows[0], 'Student found', 200);
  } catch (err) {
    next(err);
  }
};

const getStudentLoans = async (req, res, next) => {
  try {
    const { member_id } = req.params;

    const result = await pool.query(
      `SELECT l.*, b.title, bc.barcode, bc.status AS copy_status FROM ${env.DB_SCHEMA}.loans l JOIN ${env.DB_SCHEMA}.book_copies bc ON l.copy_id = bc.copy_id JOIN ${env.DB_SCHEMA}.books b ON bc.book_id = b.book_id WHERE l.member_id = $1 ORDER BY l.checkout_date DESC`,
      [member_id]
    );

    sendSuccess(res, result.rows, 'Student loans retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const getStudentOverdueLoans = async (req, res, next) => {
  try {
    const { member_id } = req.params;

    const result = await pool.query(
      `SELECT l.*, b.title, bc.barcode, GREATEST(CURRENT_DATE - l.due_date, 0) AS days_overdue FROM ${env.DB_SCHEMA}.loans l JOIN ${env.DB_SCHEMA}.book_copies bc ON l.copy_id = bc.copy_id JOIN ${env.DB_SCHEMA}.books b ON bc.book_id = b.book_id WHERE l.member_id = $1 AND l.status = $2 ORDER BY l.due_date ASC`,
      [member_id, 'OVERDUE']
    );

    sendSuccess(res, result.rows, 'Student overdue loans retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const getStudentFees = async (req, res, next) => {
  try {
    const { member_id } = req.params;

    const result = await pool.query(
      `SELECT lf.*, COALESCE(fp.total_paid, 0) AS amount_paid, GREATEST(lf.amount - COALESCE(fp.total_paid, 0), 0) AS outstanding_amount
       FROM ${env.DB_SCHEMA}.loan_fees lf
       LEFT JOIN (
         SELECT fee_id, SUM(payment_amount) AS total_paid
         FROM ${env.DB_SCHEMA}.fee_payments
         GROUP BY fee_id
       ) fp ON fp.fee_id = lf.fee_id
       WHERE lf.member_id = $1
       ORDER BY lf.assessed_date DESC`,
      [member_id]
    );

    sendSuccess(res, result.rows, 'Student fees retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const getStudentAlerts = async (req, res, next) => {
  try {
    const { member_id } = req.params;

    const result = await pool.query(
      `SELECT * FROM ${env.DB_SCHEMA}.member_alerts WHERE member_id = $1 AND resolved_at IS NULL ORDER BY alert_date DESC`,
      [member_id]
    );

    sendSuccess(res, result.rows, 'Student alerts retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const viewBookCopyStatus = async (req, res, next) => {
  try {
    const { copy_id } = req.params;

    const result = await pool.query(
      `SELECT bc.*, b.title, b.isbn, l.location_name FROM ${env.DB_SCHEMA}.book_copies bc JOIN ${env.DB_SCHEMA}.books b ON bc.book_id = b.book_id LEFT JOIN ${env.DB_SCHEMA}.library_locations l ON bc.location_id = l.location_id WHERE bc.copy_id = $1`,
      [copy_id]
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError('Book copy not found'));
    }

    sendSuccess(res, result.rows[0], 'Book copy status retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const markCopyAvailable = async (req, res, next) => {
  try {
    const { copy_id } = req.params;

    const result = await pool.query(
      `UPDATE ${env.DB_SCHEMA}.book_copies SET status = $1 WHERE copy_id = $2 RETURNING *`,
      ['AVAILABLE', copy_id]
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError('Book copy not found'));
    }

    sendSuccess(res, result.rows[0], 'Copy marked as available', 200);
  } catch (err) {
    next(err);
  }
};

const generateOverdueAlerts = async (req, res, next) => {
  try {
    await pool.query(
      `CALL ${env.DB_SCHEMA}.sp_generate_overdue_alerts()`
    );

    sendSuccess(res, { message: 'Overdue alerts generated' }, 'Alerts generated successfully', 200);
  } catch (err) {
    next(err);
  }
};

const markAlertResolved = async (req, res, next) => {
  try {
    const { alert_id } = req.params;

    const result = await pool.query(
      `UPDATE ${env.DB_SCHEMA}.member_alerts SET resolved_at = $1 WHERE alert_id = $2 RETURNING *`,
      [new Date(), alert_id]
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError('Alert not found'));
    }

    sendSuccess(res, result.rows[0], 'Alert marked as resolved', 200);
  } catch (err) {
    next(err);
  }
};

const viewBooks = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;

    let query = `
      SELECT b.*, 
             p.publisher_name,
             COALESCE(
               (SELECT array_agg(bc.barcode ORDER BY bc.barcode) 
                FROM ${env.DB_SCHEMA}.book_copies bc 
                WHERE bc.book_id = b.book_id), 
               ARRAY[]::text[]
             ) as barcodes,
             (SELECT COUNT(*) FROM ${env.DB_SCHEMA}.book_copies bc WHERE bc.book_id = b.book_id) as total_copies,
             (SELECT COUNT(*) FROM ${env.DB_SCHEMA}.book_copies bc WHERE bc.book_id = b.book_id AND bc.status = 'AVAILABLE') as available_copies
      FROM ${env.DB_SCHEMA}.books b 
      LEFT JOIN ${env.DB_SCHEMA}.publishers p ON b.publisher_id = p.publisher_id`;
    const params = [];

    if (search) {
      query += ' WHERE b.title ILIKE $1 OR b.isbn ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY b.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit);
    params.push(offset);

    const result = await pool.query(query, params);

    sendSuccess(res, result.rows, 'Books retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const viewBookCopies = async (req, res, next) => {
  try {
    const { book_id } = req.params;

    const result = await pool.query(
      `SELECT bc.*, l.location_name FROM ${env.DB_SCHEMA}.book_copies bc LEFT JOIN ${env.DB_SCHEMA}.library_locations l ON bc.location_id = l.location_id WHERE bc.book_id = $1 ORDER BY bc.barcode`,
      [book_id]
    );

    sendSuccess(res, result.rows, 'Book copies retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const scanBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return next(new ValidationError('Barcode is required'));
    }

    const cleanBarcode = barcode.trim();

    // Simple direct query
    const result = await pool.query(
      `SELECT bc.copy_id, bc.book_id, bc.barcode, bc.status, bc.location_id,
              b.title, b.isbn, b.subtitle,
              l.location_name
       FROM ${env.DB_SCHEMA}.book_copies bc 
       JOIN ${env.DB_SCHEMA}.books b ON bc.book_id = b.book_id 
       LEFT JOIN ${env.DB_SCHEMA}.library_locations l ON bc.location_id = l.location_id 
       WHERE bc.barcode = $1`,
      [cleanBarcode]
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError(`Barcode "${cleanBarcode}" not found`));
    }

    sendSuccess(res, result.rows[0], 'Barcode scanned successfully', 200);
  } catch (err) {
    console.error('Scan barcode error:', err.message);
    next(err);
  }
};

const getBookStockStatus = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, search, out_of_stock_only } = req.query;

    // FIXED: schema must be written directly in SQL
    let query = `SELECT * FROM ${env.DB_SCHEMA}.vw_book_stock_status`;
    const params = [];
    let conditions = [];
    let index = 1;

    if (search) {
      conditions.push(`(title ILIKE $${index} OR isbn ILIKE $${index})`);
      params.push(`%${search}%`);
      index++;
    }

    if (out_of_stock_only === 'true') {
      conditions.push(`is_out_of_stock = true`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY title ASC LIMIT $${index} OFFSET $${index + 1}`;
    params.push(limit);
    params.push(offset);

    const result = await pool.query(query, params);

    sendSuccess(res, result.rows, 'Book stock status retrieved', 200);
  } catch (err) {
    next(err);
  }
};

// Create alert manually for a student
const createAlert = async (req, res, next) => {
  try {
    const { member_id, alert_type, message } = req.body;

    if (!member_id || !alert_type || !message) {
      return next(new ValidationError('member_id, alert_type, and message are required'));
    }

    if (!['OVERDUE', 'FEE'].includes(alert_type)) {
      return next(new ValidationError('alert_type must be OVERDUE or FEE'));
    }

    // Check if member exists
    const memberCheck = await pool.query(
      `SELECT member_id, first_name, last_name FROM ${env.DB_SCHEMA}.members WHERE member_id = $1`,
      [member_id]
    );

    if (memberCheck.rows.length === 0) {
      return next(new NotFoundError('Member not found'));
    }

    // For manual alerts, we set loan_id to a placeholder (first active loan or null)
    const loanResult = await pool.query(
      `SELECT loan_id FROM ${env.DB_SCHEMA}.loans WHERE member_id = $1 AND status IN ('ACTIVE', 'OVERDUE') ORDER BY checkout_date DESC LIMIT 1`,
      [member_id]
    );
    const loan_id = loanResult.rows.length > 0 ? loanResult.rows[0].loan_id : null;

    // Insert the alert (if no loan, we need to handle this differently - create a general alert)
    let result;
    if (loan_id) {
      result = await pool.query(
        `INSERT INTO ${env.DB_SCHEMA}.member_alerts (member_id, loan_id, alert_type, alert_message) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [member_id, loan_id, alert_type, message]
      );
    } else {
      // For general alerts without a loan, we need to modify the approach
      // Let's create a fee-type alert without loan reference (if table allows null)
      return next(new ValidationError('Cannot create alert - student has no active loans'));
    }

    const member = memberCheck.rows[0];
    sendSuccess(res, {
      alert: result.rows[0],
      member_name: `${member.first_name} ${member.last_name}`
    }, 'Alert created successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  searchStudent,
  getStudentLoans,
  getStudentOverdueLoans,
  getStudentFees,
  getStudentAlerts,
  viewBookCopyStatus,
  markCopyAvailable,
  generateOverdueAlerts,
  markAlertResolved,
  createAlert,
  viewBooks,
  viewBookCopies,
  scanBarcode,
  getBookStockStatus,
};
