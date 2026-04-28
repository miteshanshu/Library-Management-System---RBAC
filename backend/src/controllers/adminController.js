const pool = require('../config/db');
const env = require('../config/env');
const { sendSuccess } = require('../utils/response');
const { ValidationError, NotFoundError } = require('../utils/error');

const createLibrarian = async (req, res, next) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return next(new ValidationError('Full name, email, and password are required'));
    }

    if (password.length < 6) {
      return next(new ValidationError('Password must be at least 6 characters'));
    }

    const result = await pool.query(
      `SELECT * FROM ${env.DB_SCHEMA}.fn_create_librarian_user($1, $2, $3)`,
      [full_name, email, password]
    );

    if (result.rows.length === 0) {
      return next(new ValidationError('Failed to create librarian'));
    }

    const librarian = result.rows[0];

    sendSuccess(
      res,
      {
        user_id: librarian.new_user_id,
        email,
        role: 'librarian',
        full_name,
      },
      'Librarian created successfully',
      201
    );
  } catch (err) {
    if (err.message.includes('already registered')) {
      return next(new ValidationError('Email already registered'));
    }
    next(err);
  }
};

const toggleLibrarianStatus = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return next(new ValidationError('is_active must be a boolean'));
    }

    const result = await pool.query(
      `UPDATE ${env.DB_SCHEMA}.users SET is_active = $1 WHERE user_id = $2 AND role = $3 RETURNING *`,
      [is_active, user_id, 'librarian']
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError('Librarian not found'));
    }

    const updatedUser = result.rows[0];

    sendSuccess(
      res,
      {
        user_id: updatedUser.user_id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        is_active: updatedUser.is_active,
      },
      `Librarian ${is_active ? 'activated' : 'deactivated'}`,
      200
    );
  } catch (err) {
    next(err);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { role, limit = 50, offset = 0 } = req.query;

    let query = `SELECT user_id, full_name, email, role, is_active, created_at FROM ${env.DB_SCHEMA}.users`;
    const params = [];

    if (role) {
      query += ' WHERE role = $1';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit);
    params.push(offset);

    const result = await pool.query(query, params);

    sendSuccess(res, result.rows, 'Users retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const getLoginList = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT user_id, full_name, email, role, created_at FROM ${env.DB_SCHEMA}.users ORDER BY created_at DESC`
    );

    sendSuccess(res, result.rows, 'Login list retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const addBook = async (req, res, next) => {
  try {
    const { isbn, title, publisher_id, publication_year, language, edition, description } = req.body;

    if (!isbn || !title) {
      return next(new ValidationError('ISBN and title are required'));
    }

    const result = await pool.query(
      `SELECT * FROM ${env.DB_SCHEMA}.fn_admin_add_book($1, $2, $3, $4, $5, $6, $7)`,
      [title, isbn, publisher_id, publication_year, language, edition, description]
    );

    if (result.rows.length === 0) {
      return next(new ValidationError('Failed to add book'));
    }

    const book = result.rows[0];
    sendSuccess(res, {
      book_id: book.new_book_id,
      isbn: book.isbn,
      title: book.title,
      created_at: book.created_at
    }, 'Book added successfully', 201);
  } catch (err) {
    if (err.message.includes('unique constraint') || err.message.includes('duplicate')) {
      return next(new ValidationError('ISBN already exists'));
    }
    next(err);
  }
};

const editBook = async (req, res, next) => {
  try {
    const { book_id } = req.params;
    const { title, subtitle, publisher_id, publication_year, language, edition, description } = req.body;

    const result = await pool.query(
      `UPDATE ${env.DB_SCHEMA}.books SET title = COALESCE($1, title), subtitle = COALESCE($2, subtitle), publisher_id = COALESCE($3, publisher_id), publication_year = COALESCE($4, publication_year), language = COALESCE($5, language), edition = COALESCE($6, edition), description = COALESCE($7, description) WHERE book_id = $8 RETURNING *`,
      [title, subtitle, publisher_id, publication_year, language, edition, description, book_id]
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError('Book not found'));
    }

    sendSuccess(res, result.rows[0], 'Book updated successfully', 200);
  } catch (err) {
    next(err);
  }
};

const deleteBook = async (req, res, next) => {
  try {
    const { book_id } = req.params;

    const result = await pool.query(
      `SELECT * FROM ${env.DB_SCHEMA}.fn_admin_delete_book($1)`,
      [book_id]
    );

    if (result.rows.length === 0) {
      return next(new ValidationError('Failed to delete book'));
    }

    const deleteResult = result.rows[0];

    if (!deleteResult.success) {
      return next(new ValidationError(deleteResult.message));
    }

    sendSuccess(res, { book_id, message: deleteResult.message }, 'Book deleted successfully', 200);
  } catch (err) {
    next(err);
  }
};

const addBookCopy = async (req, res, next) => {
  try {
    const { book_id, barcode, location_id, acquisition_date } = req.body;

    if (!book_id || !barcode) {
      return next(new ValidationError('Book ID and barcode are required'));
    }

    const result = await pool.query(
      `SELECT * FROM ${env.DB_SCHEMA}.fn_admin_add_copy($1, $2, $3, $4)`,
      [book_id, location_id, barcode, acquisition_date ? new Date(acquisition_date) : null]
    );

    if (result.rows.length === 0) {
      return next(new ValidationError('Failed to add book copy'));
    }

    const copy = result.rows[0];
    sendSuccess(res, {
      copy_id: copy.new_copy_id,
      book_id: copy.book_id,
      barcode: copy.barcode,
      status: copy.status,
      location_id: copy.location_id,
      created_at: copy.created_at
    }, 'Book copy added successfully', 201);
  } catch (err) {
    if (err.message.includes('unique constraint') || err.message.includes('duplicate')) {
      return next(new ValidationError('Barcode already exists'));
    }
    next(err);
  }
};

const updateCopyStatus = async (req, res, next) => {
  try {
    const { copy_id } = req.params;
    const { status, condition_notes } = req.body;

    if (!status || !['AVAILABLE', 'RESERVED', 'LOANED', 'MAINTENANCE', 'LOST'].includes(status)) {
      return next(new ValidationError('Valid status required (AVAILABLE, RESERVED, LOANED, MAINTENANCE, LOST)'));
    }

    const result = await pool.query(
      `UPDATE ${env.DB_SCHEMA}.book_copies SET status = $1, condition_notes = COALESCE($2, condition_notes) WHERE copy_id = $3 RETURNING *`,
      [status, condition_notes, copy_id]
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError('Book copy not found'));
    }

    sendSuccess(res, result.rows[0], 'Copy status updated successfully', 200);
  } catch (err) {
    next(err);
  }
};

const setBookLocation = async (req, res, next) => {
  try {
    const { copy_id } = req.params;
    const { location_id } = req.body;

    if (!location_id) {
      return next(new ValidationError('Location ID is required'));
    }

    const result = await pool.query(
      `UPDATE ${env.DB_SCHEMA}.book_copies SET location_id = $1 WHERE copy_id = $2 RETURNING *`,
      [location_id, copy_id]
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError('Book copy not found'));
    }

    sendSuccess(res, result.rows[0], 'Book location updated successfully', 200);
  } catch (err) {
    next(err);
  }
};

const getMembershipTypes = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ${env.DB_SCHEMA}.membership_types ORDER BY membership_type_id`
    );

    sendSuccess(res, result.rows, 'Membership types retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const manageMembershipTypes = async (req, res, next) => {
  try {
    const { action, type_name, loan_limit, loan_period_days, daily_late_fee } = req.body;

    if (!action || !['create', 'update', 'delete'].includes(action)) {
      return next(new ValidationError('Valid action required (create, update, delete)'));
    }

    let result;

    if (action === 'create') {
      if (!type_name || !loan_limit || !loan_period_days) {
        return next(new ValidationError('type_name, loan_limit, and loan_period_days are required'));
      }
      result = await pool.query(
        `INSERT INTO ${env.DB_SCHEMA}.membership_types (type_name, loan_limit, loan_period_days, daily_late_fee) VALUES ($1, $2, $3, $4) RETURNING *`,
        [type_name, loan_limit, loan_period_days, daily_late_fee || 0]
      );
    } else if (action === 'update') {
      const { membership_type_id } = req.body;
      if (!membership_type_id) {
        return next(new ValidationError('membership_type_id is required'));
      }
      result = await pool.query(
        `UPDATE ${env.DB_SCHEMA}.membership_types SET type_name = COALESCE($1, type_name), loan_limit = COALESCE($2, loan_limit), loan_period_days = COALESCE($3, loan_period_days), daily_late_fee = COALESCE($4, daily_late_fee) WHERE membership_type_id = $5 RETURNING *`,
        [type_name, loan_limit, loan_period_days, daily_late_fee, req.body.membership_type_id]
      );
    } else if (action === 'delete') {
      const { membership_type_id } = req.body;
      if (!membership_type_id) {
        return next(new ValidationError('membership_type_id is required'));
      }
      result = await pool.query(
        `DELETE FROM ${env.DB_SCHEMA}.membership_types WHERE membership_type_id = $1 RETURNING membership_type_id`,
        [membership_type_id]
      );
    }

    if (result.rows.length === 0) {
      return next(new NotFoundError('Membership type not found'));
    }

    sendSuccess(res, result.rows[0], `Membership type ${action}d successfully`, action === 'create' ? 201 : 200);
  } catch (err) {
    next(err);
  }
};

const overrideMember = async (req, res, next) => {
  try {
    const { member_id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(status)) {
      return next(new ValidationError('Valid status required (ACTIVE, SUSPENDED, INACTIVE)'));
    }

    const result = await pool.query(
      `UPDATE ${env.DB_SCHEMA}.members SET status = $1 WHERE member_id = $2 RETURNING *`,
      [status, member_id]
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError('Member not found'));
    }

    sendSuccess(res, result.rows[0], 'Member status overridden successfully', 200);
  } catch (err) {
    next(err);
  }
};

const waiveFee = async (req, res, next) => {
  try {
    const { fee_id } = req.params;

    const result = await pool.query(
      `UPDATE ${env.DB_SCHEMA}.loan_fees SET status = $1 WHERE fee_id = $2 RETURNING *`,
      ['PAID', fee_id]
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError('Fee not found'));
    }

    sendSuccess(res, result.rows[0], 'Fee waived successfully', 200);
  } catch (err) {
    next(err);
  }
};

const forceCloseLoan = async (req, res, next) => {
  try {
    const { loan_id } = req.params;

    const result = await pool.query(
      `UPDATE ${env.DB_SCHEMA}.loans SET status = $1, returned_date = $2 WHERE loan_id = $3 RETURNING *`,
      ['RETURNED', new Date(), loan_id]
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError('Loan not found'));
    }

    sendSuccess(res, result.rows[0], 'Loan force closed successfully', 200);
  } catch (err) {
    next(err);
  }
};

const getAllBookCopies = async (req, res, next) => {
  try {
    const { limit = 100, offset = 0, search } = req.query;

    let query = `
      SELECT 
        bc.copy_id, 
        bc.barcode, 
        bc.status, 
        bc.condition_notes, 
        bc.acquisition_date,
        b.book_id, 
        b.title, 
        b.isbn,
        l.location_name,
        NULL::text as created_by_name,
        NULL::text as created_by_email
      FROM ${env.DB_SCHEMA}.book_copies bc
      JOIN ${env.DB_SCHEMA}.books b ON bc.book_id = b.book_id
      LEFT JOIN ${env.DB_SCHEMA}.library_locations l ON bc.location_id = l.location_id
    `;

    const params = [];

    if (search) {
      query += ` WHERE bc.barcode ILIKE $1 OR b.title ILIKE $1 OR b.isbn ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY bc.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit);
    params.push(offset);

    const result = await pool.query(query, params);

    sendSuccess(res, result.rows, 'Book copies retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const deleteBookCopy = async (req, res, next) => {
  try {
    const { copy_id } = req.params;

    const result = await pool.query(
      `SELECT * FROM ${env.DB_SCHEMA}.fn_admin_delete_copy($1)`,
      [copy_id]
    );

    if (result.rows.length === 0) {
      return next(new ValidationError('Failed to delete copy'));
    }

    const deleteResult = result.rows[0];

    if (!deleteResult.success) {
      return next(new ValidationError(deleteResult.message));
    }

    sendSuccess(res, { copy_id, message: deleteResult.message }, 'Book copy deleted successfully', 200);
  } catch (err) {
    next(err);
  }
};

// Add multiple copies of a book at once with auto-generated barcodes
const addBulkCopies = async (req, res, next) => {
  try {
    const { book_id, quantity, location_id } = req.body;
    const created_by = req.user.user_id;

    if (!book_id || !quantity) {
      return next(new ValidationError('Book ID and quantity are required'));
    }

    const qty = parseInt(quantity, 10);
    if (qty < 1 || qty > 100) {
      return next(new ValidationError('Quantity must be between 1 and 100'));
    }

    // Get book ISBN for barcode generation
    const bookResult = await pool.query(
      `SELECT isbn FROM ${env.DB_SCHEMA}.books WHERE book_id = $1`,
      [book_id]
    );

    if (bookResult.rows.length === 0) {
      return next(new NotFoundError('Book not found'));
    }

    const isbn = bookResult.rows[0].isbn;
    const createdCopies = [];
    const timestamp = Date.now();

    for (let i = 0; i < qty; i++) {
      // Generate unique barcode: BC-{book_id}-{timestamp last 6 digits}-{sequence}
      const shortTimestamp = String(timestamp).slice(-6);
      const barcode = `BC${book_id}-${shortTimestamp}-${String(i + 1).padStart(2, '0')}`;

      const copyResult = await pool.query(
        `INSERT INTO ${env.DB_SCHEMA}.book_copies 
         (book_id, barcode, location_id, status, acquisition_date) 
         VALUES ($1, $2, $3, 'AVAILABLE', CURRENT_DATE) 
         RETURNING copy_id, barcode, status`,
        [book_id, barcode, location_id || null]
      );

      if (copyResult.rows.length > 0) {
        createdCopies.push(copyResult.rows[0]);
      }
    }

    sendSuccess(res, {
      book_id,
      isbn,
      copies_created: createdCopies.length,
      copies: createdCopies
    }, `${createdCopies.length} copies added successfully`, 201);
  } catch (err) {
    if (err.message.includes('unique constraint') || err.message.includes('duplicate')) {
      return next(new ValidationError('Barcode generation conflict. Please try again.'));
    }
    next(err);
  }
};

const bulkDeleteBookCopies = async (req, res, next) => {
  try {
    const { copy_ids } = req.body;

    if (!copy_ids || !Array.isArray(copy_ids) || copy_ids.length === 0) {
      return next(new ValidationError('Array of copy IDs is required'));
    }

    // Using a transaction usually safer, but loop works for MVP logic reusing existing function logic or direct DELETE
    // Direct DELETE is much more efficient
    const result = await pool.query(
      `DELETE FROM ${env.DB_SCHEMA}.book_copies WHERE copy_id = ANY($1) RETURNING copy_id`,
      [copy_ids]
    );

    sendSuccess(res, {
      deleted_count: result.rowCount,
      deleted_ids: result.rows.map(r => r.copy_id)
    }, `Successfully deleted ${result.rowCount} book copies`, 200);

  } catch (err) {
    if (err.message.includes('foreign key constraint')) {
      return next(new ValidationError('Cannot delete some copies because they have active loans or history.'));
    }
    next(err);
  }
};

module.exports = {
  createLibrarian,
  toggleLibrarianStatus,
  getAllUsers,
  getLoginList,
  addBook,
  editBook,
  deleteBook,
  addBookCopy,
  updateCopyStatus,
  setBookLocation,
  deleteBookCopy,
  getMembershipTypes,
  manageMembershipTypes,
  overrideMember,
  waiveFee,
  forceCloseLoan,
  getAllBookCopies,
  addBulkCopies,
  bulkDeleteBookCopies,
};
