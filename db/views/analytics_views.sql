-- Library Management System Views
-- Author: Mitesh Kumar Anshu
-- Module: Analytics snapshots that keep the desk team informed

SET search_path TO library_app;

-- Inventory view used by campus teams to track copies
CREATE OR REPLACE VIEW vw_inventory_summary AS
SELECT b.book_id,
       b.isbn,
       b.title,
       COUNT(c.copy_id) AS total_copies,
       COUNT(c.copy_id) FILTER (WHERE c.status = 'AVAILABLE') AS available_copies,
       COUNT(c.copy_id) FILTER (WHERE c.status = 'LOANED') AS loaned_copies,
       COUNT(c.copy_id) FILTER (WHERE c.status = 'MAINTENANCE') AS maintenance_copies,
       COUNT(c.copy_id) FILTER (WHERE c.status = 'LOST') AS lost_copies
FROM books b
LEFT JOIN book_copies c ON c.book_id = b.book_id
GROUP BY b.book_id, b.isbn, b.title;

-- Member view used by counsellors while talking to students
CREATE OR REPLACE VIEW vw_member_activity AS
SELECT m.member_id,
       m.first_name,
       m.last_name,
       m.card_number,
       m.status,
       (SELECT COUNT(*)
        FROM loans l
        WHERE l.member_id = m.member_id
          AND l.status IN ('ACTIVE','OVERDUE')) AS active_loans,
       (SELECT COUNT(*)
        FROM loans l
        WHERE l.member_id = m.member_id) AS lifetime_loans,
       (SELECT COALESCE(SUM(GREATEST(f.amount - COALESCE(fp.total_paid, 0), 0)), 0)
        FROM loan_fees f
        LEFT JOIN (
            SELECT fee_id, SUM(payment_amount) AS total_paid
            FROM fee_payments
            GROUP BY fee_id
        ) fp ON fp.fee_id = f.fee_id
        WHERE f.member_id = m.member_id
          AND f.status IN ('UNPAID','PARTIAL')) AS outstanding_fees
FROM members m;
