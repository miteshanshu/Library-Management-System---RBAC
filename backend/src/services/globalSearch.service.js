const pool = require('../config/db');
const env = require('../config/env');

/**
 * searchAll
 * - q: search term
 * - opts: { limit, offset, role }
 *
 * Role rules:
 * - student: only books + authors
 * - librarian: books + authors + copies + members + loans
 * - admin: everything (books, authors, copies, members, users, loans)
 */
const searchAll = async (q, opts = {}) => {
  const { limit = 10, offset = 0, role = 'student' } = opts;
  const schema = env.DB_SCHEMA;
  const term = `%${q}%`;
  // Authors are also matched on the full name, so squeeze repeated spaces first
  const authorTerm = `%${String(q).trim().replace(/\s+/g, ' ')}%`;

  // Build queries. Keep them independent so we can run in parallel.
  // Note: we use explicit param arrays for each query to avoid index mistakes.
  const queries = [];

  // 1) Books (title, isbn, description)
  const booksQuery = {
    sql: `SELECT book_id, title, isbn, publication_year, publisher_id
          FROM ${schema}.books
          WHERE title ILIKE $1 OR isbn ILIKE $1 OR description ILIKE $1
          ORDER BY title ASC
          LIMIT $2 OFFSET $3`,
    params: [term, limit, offset],
    key: 'books',
  };
  queries.push(booksQuery);

  // 2) Authors (name)
 const authorsQuery = {
  sql: `
    SELECT a.author_id,
           CONCAT(a.first_name, ' ', a.last_name) AS full_name
    FROM ${schema}.authors a
    WHERE a.first_name ILIKE $1 OR a.last_name ILIKE $1
       OR CONCAT(a.first_name, ' ', a.last_name) ILIKE $1
    ORDER BY full_name ASC
    LIMIT $2 OFFSET $3
  `,
  params: [authorTerm, limit, offset],
  key: 'authors',
};
  queries.push(authorsQuery);


  // Librarians and above get copies, members, loans; admin additionally gets users
  if (role === 'librarian' || role === 'admin') {
    // 3) Book copies (barcode)
    const copiesQuery = {
      sql: `SELECT bc.copy_id, bc.book_id, bc.barcode, bc.status, l.location_name
            FROM ${schema}.book_copies bc
            LEFT JOIN ${schema}.library_locations l ON bc.location_id = l.location_id
            WHERE bc.barcode ILIKE $1
            ORDER BY bc.barcode ASC
            LIMIT $2 OFFSET $3`,
      params: [term, limit, offset],
      key: 'copies',
    };
    queries.push(copiesQuery);

    // 4) Members (card_number, first_name, last_name, email)
    const membersQuery = {
      sql: `SELECT member_id, card_number, first_name, last_name, email
            FROM ${schema}.members
            WHERE card_number ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1
            ORDER BY last_name ASC
            LIMIT $2 OFFSET $3`,
      params: [term, limit, offset],
      key: 'members',
    };
    queries.push(membersQuery);

    // 5) Loans (loan_id cast to text, or loan notes) - basic
    const loansQuery = {
      sql: `SELECT l.loan_id, l.copy_id, l.member_id, l.status, l.checkout_date, l.due_date
            FROM ${schema}.loans l
            WHERE CAST(l.loan_id AS TEXT) ILIKE $1
            ORDER BY l.checkout_date DESC
            LIMIT $2 OFFSET $3`,
      params: [term, limit, offset],
      key: 'loans',
    };
    queries.push(loansQuery);
  }

  if (role === 'admin') {
    // 6) Users (admins, librarians)
    const usersQuery = {
      sql: `SELECT user_id, email, full_name, role
            FROM ${schema}.users
            WHERE email ILIKE $1 OR full_name ILIKE $1
            ORDER BY full_name ASC
            LIMIT $2 OFFSET $3`,
      params: [term, limit, offset],
      key: 'users',
    };
    queries.push(usersQuery);
  }

  // execute all queries in parallel
  const exec = queries.map((qObj) => pool.query(qObj.sql, qObj.params).then(r => ({ key: qObj.key, rows: r.rows })));

  const rawResults = await Promise.all(exec);

  // Convert array to object keyed by entity
  const results = {};
  for (const item of rawResults) {
    results[item.key] = item.rows;
  }

  // Ensure keys exist even if empty
  const defaultKeys = ['books', 'authors', 'copies', 'members', 'loans', 'users'];
  defaultKeys.forEach(k => { if (!results[k]) results[k] = []; });

  return results;
};

module.exports = {
  searchAll,
};
