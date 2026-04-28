const db = require('../config/db');
const env = require('../config/env');
const { sendSuccess } = require('../utils/response');
const { NotFoundError, ValidationError } = require('../utils/error');

const findMemberByEmail = async (email) => {
  const memberRes = await db.query(
    `SELECT member_id FROM ${env.DB_SCHEMA}.members WHERE email = $1`,
    [email],
    { operationName: 'find member by email' }
  );

  return memberRes.rows[0] || null;
};

const createReservation = async (req, res, next) => {
  try {
    const { book_id } = req.body;

    if (!book_id) {
      return next(new ValidationError('book_id is required'));
    }

    const member = await findMemberByEmail(req.user.email);

    if (!member) {
      return next(new NotFoundError('Member not found'));
    }

    const result = await db.query(
      `INSERT INTO ${env.DB_SCHEMA}.reservations (book_id, member_id)
       VALUES ($1, $2)
       RETURNING *`,
      [book_id, member.member_id],
      { operationName: 'create reservation' }
    );

    sendSuccess(res, result.rows[0], 'Reservation created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getMyReservations = async (req, res, next) => {
  try {
    const member = await findMemberByEmail(req.user.email);

    if (!member) {
      return sendSuccess(res, [], 'Reservations retrieved', 200);
    }

    const result = await db.query(
      `SELECT r.*, b.title, b.isbn
       FROM ${env.DB_SCHEMA}.reservations r
       JOIN ${env.DB_SCHEMA}.books b ON r.book_id = b.book_id
       WHERE r.member_id = $1
       ORDER BY r.reserved_at DESC`,
      [member.member_id],
      { operationName: 'get member reservations' }
    );

    sendSuccess(res, result.rows, 'Reservations retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE ${env.DB_SCHEMA}.reservations
       SET status = $1
       WHERE reservation_id = $2
       RETURNING reservation_id`,
      ['CANCELLED', id],
      { operationName: 'cancel reservation' }
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError('Reservation not found'));
    }

    sendSuccess(res, null, 'Reservation cancelled', 200);
  } catch (err) {
    next(err);
  }
};

const getAllReservations = async (req, res, next) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT r.*,
             b.title, b.isbn,
             m.first_name, m.last_name, m.email, m.card_number
      FROM ${env.DB_SCHEMA}.reservations r
      JOIN ${env.DB_SCHEMA}.books b ON r.book_id = b.book_id
      JOIN ${env.DB_SCHEMA}.members m ON r.member_id = m.member_id
    `;

    const params = [];

    if (status) {
      query += ' WHERE r.status = $1';
      params.push(status);
    }

    query += ` ORDER BY r.reserved_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));

    const result = await db.query(query, params, { operationName: 'get all reservations' });
    sendSuccess(res, result.rows, 'Reservations retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const fulfillReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE ${env.DB_SCHEMA}.reservations
       SET status = $1,
           expiry_at = NOW() + INTERVAL '3 days'
       WHERE reservation_id = $2
       RETURNING *`,
      ['FULFILLED', id],
      { operationName: 'fulfill reservation' }
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError('Reservation not found'));
    }

    sendSuccess(
      res,
      result.rows[0],
      'Reservation fulfilled - member has 3 days to collect',
      200
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  cancelReservation,
  getAllReservations,
  fulfillReservation,
};
