const db = require('../config/db');
const env = require('../config/env');
const { generateToken } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');
const { ValidationError, AuthenticationError } = require('../utils/error');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ValidationError('Email and password are required'));
    }

    // Neon-safe function call through the shared pooled database helper.
    const result = await db.selectFunction('fn_verify_user_credentials', [email, password], {
      operationName: 'verify user credentials',
    });

    if (result.rows.length === 0) {
      return next(new AuthenticationError('Invalid credentials'));
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return next(new AuthenticationError('User account is inactive'));
    }

    const token = generateToken(user);

    sendSuccess(
      res,
      {
        token,
        user: {
          user_id: user.user_id,
          email,
          role: user.role,
          full_name: user.full_name,
          is_demo: user.is_demo,
        },
      },
      'Login successful',
      200
    );
  } catch (err) {
    next(err);
  }
};

const registerStudent = async (req, res, next) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return next(new ValidationError('Full name, email, and password are required'));
    }

    if (password.length < 6) {
      return next(new ValidationError('Password must be at least 6 characters'));
    }

    const result = await db.selectFunction('fn_register_student_user', [full_name, email, password], {
      operationName: 'register student user',
    });

    if (result.rows.length === 0) {
      return next(new ValidationError('Registration failed'));
    }

    const registration = result.rows[0];

    const userResult = await db.query(
      `SELECT user_id, email, role, full_name FROM ${env.DB_SCHEMA}.users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return next(new ValidationError('User creation failed'));
    }

    const user = userResult.rows[0];
    const token = generateToken(user);

    sendSuccess(
      res,
      {
        token,
        user: {
          user_id: registration.new_user_id,
          email,
          role: 'student',
          full_name,
          is_demo: false,
          member_id: registration.new_member_id,
          card_number: registration.new_card_number,
        },
      },
      'Student registration successful',
      201
    );
  } catch (err) {
    if (err.message.includes('already registered') || err.message.includes('Email already')) {
      return next(new ValidationError('Email already registered'));
    }
    next(err);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT user_id, email, role, full_name, is_demo, is_active FROM ${env.DB_SCHEMA}.users WHERE user_id = $1`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return next(new ValidationError('User not found'));
    }

    sendSuccess(res, result.rows[0], 'Current user retrieved', 200);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { full_name } = req.body;
    const userId = req.user.user_id;

    if (!full_name) {
      return next(new ValidationError('Full name is required'));
    }

    const userResult = await db.query(
      `SELECT is_demo FROM ${env.DB_SCHEMA}.users WHERE user_id = $1`,
      [userId]
    );

    if (userResult.rows[0]?.is_demo) {
      return next(new ValidationError('Demo account profile cannot be edited'));
    }

    const result = await db.query(
      `UPDATE ${env.DB_SCHEMA}.users SET full_name = $1 WHERE user_id = $2 RETURNING user_id, full_name, email, role, is_demo, is_active`,
      [full_name, userId]
    );

    sendSuccess(res, result.rows[0], 'Profile updated successfully', 200);
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.user_id;

    if (!current_password || !new_password) {
      return next(new ValidationError('Current and new passwords are required'));
    }

    if (new_password.length < 6) {
      return next(new ValidationError('New password must be at least 6 characters'));
    }

    const userResult = await db.query(
      `SELECT is_demo FROM ${env.DB_SCHEMA}.users WHERE user_id = $1`,
      [userId]
    );

    if (userResult.rows[0]?.is_demo) {
      return next(new ValidationError('Demo account password cannot be changed'));
    }

    // Verify current password
    const verifyResult = await db.query(
      `SELECT 1 FROM ${env.DB_SCHEMA}.users 
             WHERE user_id = $1 AND password_hash = crypt($2, password_hash)`,
      [userId, current_password]
    );

    if (verifyResult.rows.length === 0) {
      return next(new AuthenticationError('Invalid current password'));
    }

    // Update password
    await db.query(
      `UPDATE ${env.DB_SCHEMA}.users 
             SET password_hash = crypt($1, gen_salt('bf')) 
             WHERE user_id = $2`,
      [new_password, userId]
    );

    sendSuccess(res, null, 'Password changed successfully', 200);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  registerStudent,
  getCurrentUser,
  updateProfile,
  changePassword
};
