# Export Components

This directory contains components related to document export functionality, including upgrade prompts for premium export features.

## Components

### UpgradeModal

A Neobrutalist modal that prompts free users to upgrade when they attempt to export documents. Presents two pricing tiers side-by-side with clear feature comparison.

#### Usage

```tsx
import { UpgradeModal } from "@/components/export/upgrade-modal";
import { PRICING } from "@/lib/stripe";

function ExportButton({ sessionId }: { sessionId: string }) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  async function handleUpgrade(tier: "creator" | "pro") {
    const priceId =
      tier === "creator" ? PRICING.CREATOR.priceId : PRICING.PRO.priceId;

    // For Creator tier, include sessionId to track which book is being purchased
    const body =
      tier === "creator" ? { priceId, sessionId } : { priceId };

    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Redirect to Stripe checkout
    window.location.href = data.url;
  }

  return (
    <>
      <button onClick={() => setShowUpgrade(true)}>Export</button>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={handleUpgrade}
      />
    </>
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Controls modal visibility |
| `onClose` | `() => void` | Called when modal is closed (X button, Escape, overlay click) |
| `onUpgrade` | `(tier: "creator" \| "pro") => Promise<void>` | Called when user selects a tier. Should handle checkout API call and redirect. |

#### Features

**Pricing Display:**
- Creator: $12.99 one-time per book
- Pro: $39.99 annual subscription
- Shows "Best Value" badge on Pro option
- Displays savings calculation for Pro vs buying 3 books

**Feature Comparison:**
- Creator: Clean exports, print-ready CMYK, premium templates (this book only)
- Pro: All Creator features + GitHub sync + no per-book fees (all projects)

**Design:**
- Neobrutalist style with 4px borders and shadows
- Pro option highlighted with yellow background (#FFE75C)
- Side-by-side layout on desktop, stacked on mobile
- Sparkles icon for Pro features, Check icon for Creator features

**Interactions:**
- Loading states during checkout (spinner + disabled buttons)
- Both buttons disabled while one is loading
- Close via X button, Escape key, or clicking overlay
- Prevents body scroll when open

**CTA Hierarchy:**
- Pro is emphasized as the better long-term value
- Larger shadow on Pro card (6px vs 4px)
- "Best Value" badge rotated 3deg for visual interest
- Shows break-even math ("Pays for itself after 3 books")

#### Testing

E2E tests available at `/e2e/export/upgrade-modal.spec.ts`:
- Modal display and pricing
- Feature comparison accuracy
- Loading states
- Error handling
- Responsive design
- Keyboard navigation

Test page available at `/test/upgrade-modal` for development and manual testing.

#### Integration Notes

**When to show:**
Show this modal when a free user attempts to export a document with premium features (clean exports, print-ready, etc).

**Billing flow:**
1. User clicks tier button
2. Modal calls `onUpgrade(tier)`
3. Parent calls `POST /api/billing/checkout` with `priceId` (and `sessionId` for Creator)
4. API returns Stripe checkout session URL
5. Redirect user to Stripe
6. After payment, Stripe redirects back to app with success params
7. Webhook updates user subscription or purchased_books table

**Session ID usage:**
For Creator purchases, include the `sessionId` in the checkout body so the webhook knows which book to unlock. This should be captured in the closure of the `onUpgrade` callback:

```tsx
function MyComponent({ sessionId }: { sessionId: string }) {
  const handleUpgrade = async (tier: "creator" | "pro") => {
    // sessionId is captured in this closure
    const body = tier === "creator"
      ? { priceId, sessionId }
      : { priceId };
    // ... rest of checkout
  };

  return <UpgradeModal onUpgrade={handleUpgrade} />;
}
```

**Philosophy:**
The modal design intentionally pushes Pro harder because:
- Pro pays for itself after 3 books ($12.99 × 3 = $38.97 vs $39.99/year)
- Unlocks all projects, not just one book
- Provides GitHub sync and other premium features
- Better for authors who publish regularly

However, Creator is still presented as a valid option for single-project authors or those testing the premium features.
