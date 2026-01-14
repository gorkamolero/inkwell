#!/bin/bash
# Test Creator book purchase webhook locally
# Requires: stripe CLI installed (https://stripe.com/docs/stripe-cli)

set -e

echo "Testing Creator Book Purchase Webhook"
echo "======================================="
echo ""
echo "Prerequisites:"
echo "  1. Stripe CLI installed: brew install stripe/stripe-cli/stripe"
echo "  2. Dev server running: pnpm dev"
echo "  3. Stripe webhook secret configured in .env.local"
echo ""
echo "Starting Stripe webhook listener..."
echo ""

# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/webhooks/stripe &
STRIPE_PID=$!

echo ""
echo "Webhook listener started (PID: $STRIPE_PID)"
echo ""
echo "To test a Creator purchase, trigger a test event:"
echo ""
echo "  stripe trigger checkout.session.completed \\"
echo "    --add checkout_session:mode=payment \\"
echo "    --add checkout_session:metadata.type=creator_book_purchase \\"
echo "    --add checkout_session:metadata.userId=test_user_123 \\"
echo "    --add checkout_session:metadata.sessionId=test_session_abc \\"
echo "    --add checkout_session:payment_intent=pi_test_123"
echo ""
echo "Press Ctrl+C to stop the listener"
echo ""

# Wait for user to stop
trap "kill $STRIPE_PID 2>/dev/null" EXIT
wait $STRIPE_PID
