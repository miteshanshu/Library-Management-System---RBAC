-- Library Management System: User Authentication & Role-Based Access Control
-- Author: Mitesh Kumar Anshu (Extended)
-- Purpose: Add users table, authentication support, and role management functions
-- Note: Uses pgcrypto for password hashing; does not modify existing tables

SET search_path TO library_app;

-- Ensure pgcrypto extension is available for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table: authentication & role management
CREATE TABLE IF NOT EXISTS users (
    user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' 
        CHECK (role IN ('admin', 'librarian', 'student')),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index on email for faster login lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Trigger to update users.updated_at on modification
CREATE OR REPLACE FUNCTION set_users_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated ON users;

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_users_updated_at();

-- =====================================================
-- 1. INSERT DEFAULT ADMIN USER (Idempotent)
-- =====================================================
-- Pre-hashed password for Admin@123 using crypt()
-- This creates a bcrypt-style hash that can be verified with crypt(password, hash)
INSERT INTO users (full_name, email, password_hash, role, is_demo, is_active)
VALUES (
    'Demo Admin',
    'demoadmin@library.in',
    crypt('Admin@123', gen_salt('bf')),
    'admin',
    TRUE,
    TRUE
)
ON CONFLICT (email) DO UPDATE
SET full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_demo = EXCLUDED.is_demo,
    is_active = EXCLUDED.is_active;

-- Main admin account: intended for real administration, not public demos.
INSERT INTO users (full_name, email, password_hash, role, is_demo, is_active)
VALUES (
    'Main Admin',
    'admin@library.in',
    crypt('MainAdmin@123', gen_salt('bf')),
    'admin',
    FALSE,
    TRUE
)
ON CONFLICT (email) DO UPDATE
SET full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_demo = EXCLUDED.is_demo,
    is_active = EXCLUDED.is_active;

-- =====================================================
-- 2. FUNCTION: Register new student user & auto-create member card
-- =====================================================
-- Takes: full_name, email, password_plain
-- Does: 
--   1. Creates user with role='student'
--   2. Auto-generates card number (STU-YYYY+sequence)
--   3. Inserts into members table with membership_type=Student
--   4. Returns (user_id, member_id)
-- Raises: Exception if email already exists or membership type not found

CREATE OR REPLACE FUNCTION fn_register_student_user(
    p_full_name VARCHAR,
    p_email VARCHAR,
    p_password_plain VARCHAR
)
RETURNS TABLE (
    new_user_id INT,
    new_member_id INT,
    new_card_number VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id INT;
    v_member_id INT;
    v_card_number VARCHAR;
    v_membership_type_id INT;
    v_first_name VARCHAR;
    v_last_name VARCHAR;
    v_next_sequence INT;
    v_current_year INT;
BEGIN
    -- Validate inputs
    IF p_full_name IS NULL OR TRIM(p_full_name) = '' THEN
        RAISE EXCEPTION 'Full name cannot be empty';
    END IF;
    IF p_email IS NULL OR TRIM(p_email) = '' THEN
        RAISE EXCEPTION 'Email cannot be empty';
    END IF;
    IF p_password_plain IS NULL OR LENGTH(p_password_plain) < 6 THEN
        RAISE EXCEPTION 'Password must be at least 6 characters';
    END IF;

    -- Check if email already exists in users
    IF EXISTS (SELECT 1 FROM users WHERE LOWER(email) = LOWER(p_email)) THEN
        RAISE EXCEPTION 'Email already registered: %', p_email;
    END IF;

    -- Get Student membership type
    SELECT membership_type_id INTO v_membership_type_id
    FROM membership_types
    WHERE type_name = 'Student'
    LIMIT 1;

    IF v_membership_type_id IS NULL THEN
        RAISE EXCEPTION 'Student membership type not found in database';
    END IF;

    -- Split full_name into first and last name
    v_first_name := SPLIT_PART(TRIM(p_full_name), ' ', 1);
    v_last_name := COALESCE(TRIM(SUBSTR(TRIM(p_full_name), LENGTH(v_first_name) + 2)), '');

    -- Generate card number: STU-YYYY+sequence
    v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    SELECT COALESCE(MAX(CAST(SUBSTRING(card_number, 9, 3) AS INT)), 0) + 1
    INTO v_next_sequence
    FROM members
    WHERE card_number LIKE 'STU-' || v_current_year || '%';

    v_card_number := 'STU-' || v_current_year || LPAD(v_next_sequence::TEXT, 3, '0');

    -- Check for card number collision (should not happen)
    IF EXISTS (SELECT 1 FROM members WHERE card_number = v_card_number) THEN
        RAISE EXCEPTION 'Card number generation collision: %', v_card_number;
    END IF;

    -- Create user record
    INSERT INTO users (full_name, email, password_hash, role, is_active)
    VALUES (
        p_full_name,
        p_email,
        crypt(p_password_plain, gen_salt('bf')),
        'student',
        TRUE
    )
    RETURNING user_id INTO v_user_id;

    -- Create member record linked to user email
    INSERT INTO members (
        membership_type_id,
        card_number,
        first_name,
        last_name,
        email,
        status
    )
    VALUES (
        v_membership_type_id,
        v_card_number,
        v_first_name,
        v_last_name,
        p_email,
        'ACTIVE'
    )
    RETURNING member_id INTO v_member_id;

    -- Return results
    RETURN QUERY SELECT v_user_id, v_member_id, v_card_number;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Registration failed: email or card number already exists';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Registration error: %', SQLERRM;
END;
$$;

-- =====================================================
-- 3. FUNCTION: Create new Librarian user (Admin only)
-- =====================================================
-- Takes: full_name, email, password_plain
-- Does:
--   1. Creates user with role='librarian'
--   2. Returns new user_id
-- Raises: Exception if email exists or duplicate

CREATE OR REPLACE FUNCTION fn_create_librarian_user(
    p_full_name VARCHAR,
    p_email VARCHAR,
    p_password_plain VARCHAR
)
RETURNS TABLE (
    new_user_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id INT;
BEGIN
    -- Validate inputs
    IF p_full_name IS NULL OR TRIM(p_full_name) = '' THEN
        RAISE EXCEPTION 'Full name cannot be empty';
    END IF;
    IF p_email IS NULL OR TRIM(p_email) = '' THEN
        RAISE EXCEPTION 'Email cannot be empty';
    END IF;
    IF p_password_plain IS NULL OR LENGTH(p_password_plain) < 6 THEN
        RAISE EXCEPTION 'Password must be at least 6 characters';
    END IF;

    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM users WHERE LOWER(email) = LOWER(p_email)) THEN
        RAISE EXCEPTION 'Email already registered: %', p_email;
    END IF;

    -- Create librarian user
    INSERT INTO users (full_name, email, password_hash, role, is_active)
    VALUES (
        p_full_name,
        p_email,
        crypt(p_password_plain, gen_salt('bf')),
        'librarian',
        TRUE
    )
    RETURNING user_id INTO v_user_id;

    -- Return the new user ID
    RETURN QUERY SELECT v_user_id;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Email already registered: %', p_email;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating librarian user: %', SQLERRM;
END;
$$;

-- =====================================================
-- 4. HELPER FUNCTION: Verify password (for login)
-- =====================================================
-- Takes: email, plain_password
-- Returns: user_id if credentials valid, NULL if invalid

CREATE OR REPLACE FUNCTION fn_verify_user_credentials(
    p_email VARCHAR,
    p_password_plain VARCHAR
)
RETURNS TABLE (
    user_id INT,
    full_name VARCHAR,
    role VARCHAR,
    is_demo BOOLEAN,
    is_active BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT u.user_id, u.full_name, u.role, u.is_demo, u.is_active
    FROM users u
    WHERE LOWER(u.email) = LOWER(p_email)
      AND u.password_hash = crypt(p_password_plain, u.password_hash)
      AND u.is_active = TRUE
    LIMIT 1;
END;
$$;

-- =====================================================
-- OPTIONAL: Helper view to see all users (password hidden)
-- =====================================================
CREATE OR REPLACE VIEW vw_users_summary AS
SELECT
    user_id,
    full_name,
    email,
    role,
    is_demo,
    is_active,
    created_at,
    updated_at
FROM users
ORDER BY role, created_at DESC;

-- =====================================================
-- COMMENTS
-- =====================================================
-- To use:
--
-- 1. Register a new student:
--    SELECT * FROM fn_register_student_user(
--        'John Doe',
--        'john.doe@campus.in',
--        'SecurePass123'
--    );
--
-- 2. Create a librarian user (Admin):
--    SELECT * FROM fn_create_librarian_user(
--        'Jane Smith',
--        'jane.smith@library.in',
--        'LibrarianPass456'
--    );
--
-- 3. Verify login credentials:
--    SELECT * FROM fn_verify_user_credentials(
--        'admin@library.in',
--        'Admin@123'
--    );
--
-- 4. View all users:
--    SELECT * FROM vw_users_summary;
-- =====================================================
