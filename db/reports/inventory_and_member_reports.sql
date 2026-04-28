-- Library Management System Reports
-- Author: Mitesh Kumar Anshu
-- Purpose: Ready-to-run SQL for circulation and membership insights

SET search_path TO library_app;

-- Weekly list of top overdue titles
SELECT b.title,
       COUNT(*) AS overdue_count,
       ARRAY_AGG(m.first_name || ' ' || m.last_name) AS member_list
FROM vw_overdue_loans vol
JOIN books b ON b.book_id = (
    SELECT bc.book_id
    FROM book_copies bc
    WHERE bc.barcode = vol.barcode
    LIMIT 1
)
JOIN members m ON m.member_id = vol.member_id
GROUP BY b.title
ORDER BY overdue_count DESC
LIMIT 20;

-- Member debt aging buckets to help front-desk triage conversations
WITH fee_balances AS (
    SELECT f.member_id,
           f.assessed_date,
           f.status,
           GREATEST(f.amount - COALESCE(SUM(p.payment_amount), 0), 0) AS outstanding_amount
    FROM loan_fees f
    LEFT JOIN fee_payments p ON p.fee_id = f.fee_id
    GROUP BY f.fee_id, f.member_id, f.assessed_date, f.status, f.amount
)
SELECT m.member_id,
       m.first_name,
       m.last_name,
       SUM(f.outstanding_amount) FILTER (WHERE f.status IN ('UNPAID', 'PARTIAL') AND f.assessed_date >= CURRENT_DATE - INTERVAL '7 days') AS due_0_7,
       SUM(f.outstanding_amount) FILTER (WHERE f.status IN ('UNPAID', 'PARTIAL') AND f.assessed_date BETWEEN CURRENT_DATE - INTERVAL '14 days' AND CURRENT_DATE - INTERVAL '8 days') AS due_8_14,
       SUM(f.outstanding_amount) FILTER (WHERE f.status IN ('UNPAID', 'PARTIAL') AND f.assessed_date < CURRENT_DATE - INTERVAL '14 days') AS due_15_plus,
       SUM(f.outstanding_amount) FILTER (WHERE f.status = 'PARTIAL') AS partial_balance
FROM members m
LEFT JOIN fee_balances f ON f.member_id = m.member_id
GROUP BY m.member_id, m.first_name, m.last_name
ORDER BY due_15_plus DESC NULLS LAST;

-- Circulation velocity: how many days copies spend on the shelf vs with members
SELECT b.title,
       AVG(EXTRACT(EPOCH FROM (c.last_loaned_at - c.last_returned_at)) / 86400.0) AS avg_turnaround_days,
       COUNT(l.loan_id) AS loans_tracked
FROM books b
JOIN book_copies c ON c.book_id = b.book_id
LEFT JOIN loans l ON l.copy_id = c.copy_id
GROUP BY b.title
HAVING COUNT(l.loan_id) > 0
ORDER BY avg_turnaround_days;
