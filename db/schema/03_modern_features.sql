-- Library Management System: Optional feature tables
-- Purpose: Create reviews, reservations, announcements, wishlist, and rating helper
-- Safe to run against the deployed Neon database more than once

SET search_path TO library_app, public;

-- =====================================================
-- Reviews & Ratings
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    book_id INT NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ux_reviews_book_user UNIQUE (book_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- =====================================================
-- Reservations / Holds
-- =====================================================
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    book_id INT NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    member_id INT NOT NULL REFERENCES members(member_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('PENDING', 'FULFILLED', 'CANCELLED', 'EXPIRED'))
        DEFAULT 'PENDING',
    reserved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiry_at TIMESTAMP,
    queue_position INT
);

CREATE INDEX IF NOT EXISTS idx_reservations_member_status ON reservations(member_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_book_status ON reservations(book_id, status);

-- =====================================================
-- Announcements / News
-- =====================================================
CREATE TABLE IF NOT EXISTS announcements (
    announcement_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL
        CHECK (priority IN ('LOW', 'NORMAL', 'HIGH'))
        DEFAULT 'NORMAL',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_active_priority
    ON announcements(is_active, priority, created_at DESC);

-- =====================================================
-- Wishlist / Favorites
-- =====================================================
CREATE TABLE IF NOT EXISTS wishlist (
    wishlist_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_id INT NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ux_wishlist_user_book UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_book_id ON wishlist(book_id);

-- =====================================================
-- Function to calculate average rating
-- =====================================================
CREATE OR REPLACE FUNCTION fn_calculate_book_rating(p_book_id INT)
RETURNS TABLE (avg_rating NUMERIC, review_count INT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        CAST(COALESCE(AVG(r.rating), 0) AS NUMERIC(3,1)),
        CAST(COUNT(*) AS INT)
    FROM reviews r
    WHERE r.book_id = p_book_id;
END;
$$;
