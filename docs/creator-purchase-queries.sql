-- Creator Purchase SQL Queries
-- Use these with Drizzle Studio or direct PostgreSQL access

-- ==============================================================================
-- Check if a specific user purchased a specific book
-- ==============================================================================
SELECT
  pb.*,
  u.email as buyer_email,
  u.name as buyer_name,
  ws.title as book_title,
  ws.share_slug as book_slug
FROM purchased_books pb
JOIN "user" u ON pb.user_id = u.id
JOIN writing_sessions ws ON pb.session_id = ws.id
WHERE pb.user_id = 'USER_ID_HERE'
  AND pb.session_id = 'SESSION_ID_HERE';

-- ==============================================================================
-- Get all purchases by a user
-- ==============================================================================
SELECT
  pb.purchased_at,
  pb.stripe_payment_intent_id,
  ws.title as book_title,
  ws.share_slug as book_slug,
  ws.type as book_type
FROM purchased_books pb
JOIN writing_sessions ws ON pb.session_id = ws.id
WHERE pb.user_id = 'USER_ID_HERE'
ORDER BY pb.purchased_at DESC;

-- ==============================================================================
-- Get all purchases for a book
-- ==============================================================================
SELECT
  pb.purchased_at,
  u.email as buyer_email,
  u.name as buyer_name,
  pb.stripe_payment_intent_id
FROM purchased_books pb
JOIN "user" u ON pb.user_id = u.id
WHERE pb.session_id = 'SESSION_ID_HERE'
ORDER BY pb.purchased_at DESC;

-- ==============================================================================
-- Revenue analytics - Total Creator revenue
-- ==============================================================================
SELECT
  COUNT(*) as total_purchases,
  COUNT(*) * 12.99 as estimated_revenue_usd,
  MIN(purchased_at) as first_purchase,
  MAX(purchased_at) as latest_purchase
FROM purchased_books;

-- ==============================================================================
-- Most popular books
-- ==============================================================================
SELECT
  ws.title,
  ws.share_slug,
  ws.type,
  COUNT(pb.id) as purchase_count,
  COUNT(pb.id) * 12.99 as book_revenue_usd
FROM writing_sessions ws
JOIN purchased_books pb ON ws.id = pb.session_id
GROUP BY ws.id, ws.title, ws.share_slug, ws.type
ORDER BY purchase_count DESC
LIMIT 20;

-- ==============================================================================
-- Recent purchases (last 30 days)
-- ==============================================================================
SELECT
  pb.purchased_at,
  u.email as buyer_email,
  ws.title as book_title,
  ws.share_slug,
  pb.stripe_payment_intent_id
FROM purchased_books pb
JOIN "user" u ON pb.user_id = u.id
JOIN writing_sessions ws ON pb.session_id = ws.id
WHERE pb.purchased_at > NOW() - INTERVAL '30 days'
ORDER BY pb.purchased_at DESC;

-- ==============================================================================
-- Users with most book purchases
-- ==============================================================================
SELECT
  u.email,
  u.name,
  COUNT(pb.id) as books_purchased,
  COUNT(pb.id) * 12.99 as total_spent_usd
FROM "user" u
JOIN purchased_books pb ON u.id = pb.user_id
GROUP BY u.id, u.email, u.name
ORDER BY books_purchased DESC
LIMIT 20;

-- ==============================================================================
-- Check for duplicate purchases (should be none due to unique constraint)
-- ==============================================================================
SELECT
  user_id,
  session_id,
  COUNT(*) as duplicate_count
FROM purchased_books
GROUP BY user_id, session_id
HAVING COUNT(*) > 1;

-- ==============================================================================
-- Verify webhook idempotency worked correctly
-- ==============================================================================
-- Check if any payment intents appear multiple times (webhook retries)
SELECT
  stripe_payment_intent_id,
  COUNT(*) as record_count
FROM purchased_books
WHERE stripe_payment_intent_id IS NOT NULL
GROUP BY stripe_payment_intent_id
HAVING COUNT(*) > 1;

-- ==============================================================================
-- Users who bought books vs Pro subscribers
-- ==============================================================================
SELECT
  'Creator Purchases' as tier,
  COUNT(DISTINCT user_id) as user_count
FROM purchased_books
UNION ALL
SELECT
  'Pro Subscribers' as tier,
  COUNT(*) as user_count
FROM subscriptions
WHERE status = 'active';

-- ==============================================================================
-- Book owners who also purchased their own book (unusual but possible)
-- ==============================================================================
SELECT
  u.email,
  ws.title as book_title,
  ws.share_slug,
  pb.purchased_at
FROM purchased_books pb
JOIN writing_sessions ws ON pb.session_id = ws.id
JOIN "user" u ON pb.user_id = u.id
WHERE ws.owner_id = pb.user_id;
