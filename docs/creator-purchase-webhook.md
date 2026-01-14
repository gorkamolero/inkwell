# Creator Book Purchase Webhook Implementation

## Overview

This document describes the implementation of Stripe webhook handling for Creator tier one-time book purchases ($12.99 per book).

## Architecture

### Purchase Flow

1. User clicks "Unlock This Book" on a writing session
2. Frontend calls `/api/billing/checkout` with `priceId` and `sessionId`
3. Stripe checkout session created with metadata:
   - `type: "creator_book_purchase"`
   - `userId: <buyer's user ID>`
   - `sessionId: <writing session ID being purchased>`
4. User completes payment on Stripe
5. Stripe sends `checkout.session.completed` webhook
6. Webhook handler records purchase in `purchased_books` table

### Database Schema

```typescript
purchasedBooks = {
  id: text("id").primaryKey(),                  // CUID
  userId: text("user_id"),                      // Buyer
  sessionId: text("session_id"),                // Writing session (book)
  stripePaymentIntentId: text("..."),           // Stripe payment ID
  purchasedAt: timestamp("purchased_at")        // Purchase time
}
```

Unique constraint: `(userId, sessionId)` - prevents duplicate purchases

### Webhook Handler

**File**: `src/app/api/webhooks/stripe/route.ts`

**Event**: `checkout.session.completed`

**Logic**:
```typescript
if (session.mode === "payment" &&
    session.metadata?.type === "creator_book_purchase") {
  // Extract metadata
  const { userId, sessionId } = session.metadata;
  const paymentIntentId = session.payment_intent;

  // Insert purchase record
  await db.insert(purchasedBooks)
    .values({ id: createId(), userId, sessionId, paymentIntentId })
    .onConflictDoNothing(); // Idempotency for webhook retries
}
```

### Idempotency

Stripe may retry webhooks multiple times. Idempotency is handled by:

1. **Unique constraint**: `(userId, sessionId)` prevents duplicate records
2. **onConflictDoNothing()**: Silently ignores duplicate inserts
3. **Payment Intent ID**: Stored for audit trail and refund tracking

### Error Handling

- **Missing metadata**: Logs error with full context, returns 200 (don't retry)
- **Database errors**: Logs error with metadata, returns 200 (investigate manually)
- **Webhook signature errors**: Returns 400 (Stripe will retry)

## Access Control

**File**: `src/lib/subscription.ts`

**Function**: `getExportAccess(userId, sessionId)`

Returns export features based on:
1. **Pro subscription**: All features, all books
2. **Creator purchase**: Premium features for that specific book only
3. **Free tier**: Basic features with "Made with Hotpress" footer

```typescript
// Check if user purchased this specific book
const purchase = await db.query.purchasedBooks.findFirst({
  where: and(
    eq(purchasedBooks.userId, userId),
    eq(purchasedBooks.sessionId, sessionId)
  )
});
```

## Testing

### Local Testing with Stripe CLI

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to local dev server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Trigger test event:
   ```bash
   stripe trigger checkout.session.completed \
     --add checkout_session:mode=payment \
     --add checkout_session:metadata.type=creator_book_purchase \
     --add checkout_session:metadata.userId=test_user_123 \
     --add checkout_session:metadata.sessionId=test_session_abc \
     --add checkout_session:payment_intent=pi_test_123
   ```

5. Check database:
   ```bash
   pnpm db:studio
   # Navigate to purchased_books table
   ```

### Test Script

A convenience script is provided:
```bash
./test-creator-webhook.sh
```

## Future Enhancements

### Email Notifications (TODO)

When a Creator purchase is completed, we should send a confirmation email:

**Trigger**: `checkout.session.completed` webhook for creator purchases

**Email contents**:
- Purchase receipt with payment details
- Link to access the book: `${APP_URL}/s/${sessionId}`
- Instructions for downloading clean exports
- Reminder that exports are available forever for this book

**Implementation notes**:
- Use Resend, SendGrid, or similar email service
- Store email service config in `.env.local`
- Add email template in `src/emails/creator-purchase-confirmation.tsx`
- Call email service from webhook handler after DB insert

**Example code**:
```typescript
// After successful DB insert
try {
  await sendEmail({
    to: userEmail,
    subject: "Your book purchase is complete!",
    template: "creator-purchase-confirmation",
    data: { sessionId, bookTitle, paymentAmount }
  });
} catch (emailError) {
  // Log but don't fail the webhook
  console.error("Failed to send confirmation email:", emailError);
}
```

## Files Modified

1. **src/app/api/webhooks/stripe/route.ts**
   - Added `purchasedBooks` import
   - Added `createId` import from `@paralleldrive/cuid2`
   - Added Creator purchase handler in `checkout.session.completed` case
   - Added comprehensive error logging

2. **src/lib/subscription.ts**
   - Fixed `getExportAccess()` to properly filter by both userId and sessionId
   - Fixed `hasBookPurchase()` to use proper query filtering
   - Added `and` import from `drizzle-orm`

## Webhook Events Reference

| Event | Mode | Metadata | Action |
|-------|------|----------|--------|
| checkout.session.completed | subscription | type: "pro_subscription" | Create/update subscription record |
| checkout.session.completed | payment | type: "creator_book_purchase" | Insert purchased_books record |
| invoice.payment_succeeded | - | - | Update subscription billing period |
| customer.subscription.deleted | - | - | Mark subscription as canceled |
| customer.subscription.updated | - | - | Update subscription status/plan |
| invoice.payment_failed | - | - | Mark subscription as past_due |

## Security Considerations

1. **Webhook signature verification**: All webhooks validate Stripe signature
2. **Metadata validation**: Required fields checked before DB insert
3. **User ownership**: No additional auth needed (Stripe provides verified userId)
4. **Idempotency**: Prevents duplicate charges if webhook retries
5. **Error logging**: All errors logged with context for debugging

## Database Queries

### Check if user purchased a book
```typescript
const hasPurchased = await hasBookPurchase(userId, sessionId);
```

### Get all books purchased by user
```typescript
const books = await getUserPurchasedBooks(userId);
```

### Check export access for a session
```typescript
const access = await getExportAccess(userId, sessionId);
// Returns: { hasCleanExports, hasPrintReady, hasPremiumTemplates, hasGithubSync, reason }
```

## Troubleshooting

### Purchase not recorded
1. Check webhook logs in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
3. Check application logs for errors
4. Verify metadata is being passed correctly from checkout session

### Duplicate purchases
- Should not happen due to unique constraint
- If it does, check webhook retry logic

### User can't access paid features
1. Verify purchase exists in `purchased_books` table
2. Check `getExportAccess()` is being called with correct userId and sessionId
3. Verify userId matches between purchase record and current user

## Monitoring

### Key metrics to track
- Creator purchase conversion rate
- Failed webhook deliveries
- Time from checkout to DB insert
- Email delivery rate (when implemented)

### Logs to monitor
```bash
# Success logs
"Creator book purchase recorded"

# Error logs
"Missing required metadata for creator purchase"
"Failed to record creator purchase"
```
