# Upgrade Modal Implementation

## Overview

Built a complete Neobrutalist upgrade modal for the export flow, including component, E2E tests, test page, and documentation.

**Created:** 2026-01-14

## Files Created

### Component
- `/src/components/export/upgrade-modal.tsx` - Main modal component
- `/src/components/export/index.ts` - Export barrel
- `/src/components/export/README.md` - Component documentation

### Test Page
- `/src/app/test/upgrade-modal/page.tsx` - Interactive test page with integration examples

### E2E Tests
- `/e2e/export/upgrade-modal.spec.ts` - Comprehensive E2E test suite (21 tests)

## Component Features

### Design (Neobrutalist)
- Bold 4px borders with box shadows
- Pro option highlighted with yellow background (#FFE75C)
- "Best Value" badge rotated 3deg
- Side-by-side on desktop, stacked on mobile
- Sparkles icon for Pro, Check icon for Creator

### Pricing Display
- **Creator:** $12.99 one-time per book
- **Pro:** $39.99/year annual subscription
- Shows "Pays for itself after ~3 books per year"
- Emphasizes Pro as better long-term value

### Feature Comparison

**Creator (This book only):**
- Clean exports (no watermark)
- Print-ready CMYK with bleed
- All premium templates

**Pro (All projects):**
- Everything in Creator
- GitHub sync (coming soon)
- No per-book fees ever

### Interactions
- Loading states during checkout (spinner + disabled buttons)
- Both buttons disabled while one is loading
- Close via X button, Escape key, or overlay click
- Prevents body scroll when open

## Integration Pattern

```tsx
import { UpgradeModal } from "@/components/export/upgrade-modal";
import { PRICING } from "@/lib/stripe";

function ExportFeature({ sessionId }: { sessionId: string }) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  async function handleUpgrade(tier: "creator" | "pro") {
    const priceId =
      tier === "creator" ? PRICING.CREATOR.priceId : PRICING.PRO.priceId;

    // For Creator, include sessionId to track which book
    const body =
      tier === "creator" ? { priceId, sessionId } : { priceId };

    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    window.location.href = data.url; // Redirect to Stripe
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

## Billing Flow

1. User clicks tier button (Creator or Pro)
2. Modal calls `onUpgrade(tier)` with loading state
3. Parent component calls `POST /api/billing/checkout` with:
   - `priceId` (required)
   - `sessionId` (required for Creator, tracks which book)
4. API returns Stripe checkout session URL
5. Redirect user to Stripe checkout
6. After payment, Stripe redirects back with success params
7. Webhook updates `subscriptions` or `purchased_books` table

## Test Coverage

### E2E Tests (21 tests)
Located at `/e2e/export/upgrade-modal.spec.ts`

**Modal Display (8 tests):**
- Shows both pricing options
- Displays correct Creator pricing ($12.99 one-time)
- Displays correct Pro pricing ($39.99/year)
- Highlights Pro with yellow background
- Shows "Best Value" badge on Pro
- Feature comparison accuracy
- Philosophy footer
- Break-even information

**Modal Interactions (3 tests):**
- Close with X button
- Close with Escape key
- Close by clicking overlay

**Upgrade Flow - Creator (3 tests):**
- Initiates checkout with correct API call
- Shows loading state during checkout
- Disables Pro button while Creator loading

**Upgrade Flow - Pro (3 tests):**
- Initiates checkout with correct API call
- Shows loading state during checkout
- Disables Creator button while Pro loading

**Responsive Design (2 tests):**
- Side-by-side on desktop (1280x720)
- Stacked on mobile (375x667)

**Error Handling (1 test):**
- Handles checkout API errors gracefully

### Test Page
Interactive test page at `/test/upgrade-modal` with:
- Trigger button to open modal
- Last action display
- Component info and props documentation
- Pricing breakdown
- Design decisions explained
- Integration notes

## Design Decisions

### CTA Hierarchy: Pro Emphasized
The modal intentionally pushes Pro harder because:

1. **Better Long-Term Value**
   - Pro: $39.99/year ÷ 12.99 = ~3.08 books to break even
   - Unlocks ALL projects forever (vs one book)
   - Authors publishing regularly save significant money

2. **Visual Hierarchy**
   - Yellow background (#FFE75C) stands out
   - Larger shadow (6px vs 4px)
   - "Best Value" badge rotated for visual interest
   - Sparkles icon vs basic checkmarks

3. **Messaging**
   - "For serious authors who publish regularly"
   - "Pays for itself after ~3 books per year"
   - "No per-book fees ever"
   - Emphasizes "all projects" vs "this book only"

4. **Philosophy Alignment**
   - Free tier genuinely useful (unlimited writing/exports with footer)
   - Creator for single projects or testing premium
   - Pro for committed authors building a catalog

### Why Not Equal Presentation?
- Analysis shows Pro is objectively better value for regular users
- Creator exists as stepping stone or single-project option
- Honest presentation: both are valid, but Pro is smarter choice
- Pricing doc confirms: "Pro pays for itself after 3 books"

## Code Quality

- **Zero TypeScript errors**
- **Zero ESLint warnings**
- **Properly formatted** (Biome)
- **Fully typed** interface
- **Accessible** (ARIA labels, keyboard navigation)
- **Responsive** design
- **Loading states** handled
- **Error boundaries** respected

## Test It

1. **Start dev server:** `pnpm dev`
2. **Visit test page:** http://localhost:3000/test/upgrade-modal
3. **Run E2E tests:** `pnpm test:e2e e2e/export/upgrade-modal.spec.ts`

## Next Steps

To integrate into the actual export flow:

1. Add to editor export button click handler:
   ```tsx
   const { subscription } = useSubscription();
   if (!subscription.hasCleanExports) {
     setShowUpgrade(true);
     return;
   }
   // ... proceed with export
   ```

2. Create hook for subscription checking:
   ```tsx
   function useExportAccess(sessionId: string) {
     const { subscription, purchased } = useUser();
     const canExport = subscription.tier === 'PRO' ||
       purchased.includes(sessionId);
     return { canExport };
   }
   ```

3. Add to format panel export buttons
4. Consider showing preview with upgrade prompt
5. Track conversion metrics (Creator vs Pro selections)

## Related Files

- `/src/lib/stripe.ts` - Pricing constants and checkout functions
- `/src/app/api/billing/checkout/route.ts` - Checkout API endpoint
- `/src/lib/subscription.ts` - Subscription checking logic
- `/src/components/ui/brutal-*` - Neobrutalist components used
- `/src/app/(marketing)/pricing/page.tsx` - Public pricing page (similar design)

## Philosophy Alignment

This implementation follows the project philosophy:

> "Cover costs, don't extract. Free tier is genuinely useful. Paid = professional polish."

- Free users can export unlimited books (with footer)
- Creator unlocks pro features for ONE book ($12.99)
- Pro unlocks pro features for ALL books ($39.99/year)
- No dark patterns, no artificial limits
- Honest comparison, let users decide
- But: emphasize Pro because it's objectively better value

The modal respects users while pushing them toward the better long-term choice.
