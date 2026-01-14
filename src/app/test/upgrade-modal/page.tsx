"use client";

import { useState } from "react";
import { UpgradeModal } from "@/components/export/upgrade-modal";
import { BrutalButton } from "@/components/ui/brutal-button";
import { PRICING } from "@/lib/stripe";

/**
 * Test page for the Upgrade Modal
 *
 * This page demonstrates and tests the upgrade modal component.
 * Use this for development and E2E tests.
 */
export default function UpgradeModalTestPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastAction, setLastAction] = useState<string>("");

  // Test session ID
  const TEST_SESSION_ID = "test-session-123";

  // Closure captures TEST_SESSION_ID for use in the upgrade callback
  async function handleUpgrade(tier: "creator" | "pro") {
    setLastAction(`Upgrading to ${tier}...`);

    // Simulate API call
    try {
      const priceId =
        tier === "creator" ? PRICING.CREATOR.priceId : PRICING.PRO.priceId;

      // For Creator tier, include sessionId to track which book is being purchased
      const body =
        tier === "creator"
          ? { priceId, sessionId: TEST_SESSION_ID }
          : { priceId };

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Checkout failed");
      }

      const data = await response.json();

      // In production, this would redirect to Stripe
      setLastAction(`Success! Would redirect to: ${data.url}`);
      console.log("Checkout URL:", data.url);

      // Close modal after success
      setTimeout(() => {
        setIsModalOpen(false);
      }, 2000);

      // In production: window.location.href = data.url;
    } catch (error) {
      console.error("Upgrade failed:", error);
      setLastAction(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error; // Re-throw so modal can handle it
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="border-4 border-black bg-brutal-yellow p-6 shadow-[4px_4px_0_0_#000000]">
          <h1 className="mb-2 text-3xl font-black">Upgrade Modal Test Page</h1>
          <p className="text-black">
            This page demonstrates the upgrade modal component. Click the button
            below to test it.
          </p>
        </div>

        {/* Test Controls */}
        <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000000]">
          <h2 className="mb-4 text-xl font-black">Test Controls</h2>

          <div className="space-y-4">
            <BrutalButton
              variant="primary"
              size="lg"
              onClick={() => setIsModalOpen(true)}
            >
              Open Upgrade Modal
            </BrutalButton>

            {lastAction && (
              <div className="border-2 border-black bg-gray-50 p-3">
                <p className="text-sm font-mono">{lastAction}</p>
              </div>
            )}
          </div>
        </div>

        {/* Component Info */}
        <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000000]">
          <h2 className="mb-4 text-xl font-black">Component Info</h2>

          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-bold">Props:</h3>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>
                  <code className="font-mono">isOpen</code>: Controls modal
                  visibility
                </li>
                <li>
                  <code className="font-mono">onClose</code>: Called when modal
                  closes
                </li>
                <li>
                  <code className="font-mono">onUpgrade</code>: Called when user
                  selects a tier (parent provides sessionId in closure)
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-bold">Pricing:</h3>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>Creator: ${PRICING.CREATOR.price} one-time per book</li>
                <li>Pro: ${PRICING.PRO.price} annual subscription</li>
                <li>
                  Break-even: ~
                  {Math.ceil(PRICING.PRO.price / PRICING.CREATOR.price)} books
                  per year
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-bold">Design:</h3>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>Neobrutalist style with bold borders and shadows</li>
                <li>Pro option highlighted with yellow background</li>
                <li>Side-by-side on desktop, stacked on mobile</li>
                <li>Loading states during checkout</li>
                <li>Close via X button, Escape key, or overlay click</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-bold">CTA Hierarchy:</h3>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>
                  <strong>Pro is emphasized</strong> - Yellow background, "Best
                  Value" badge
                </li>
                <li>Sparkles icon for Pro features vs Check for Creator</li>
                <li>Savings calculation shown for Pro</li>
                <li>
                  Philosophy: Push Pro harder since it&apos;s better long-term
                  value
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Integration Notes */}
        <div className="border-4 border-black bg-brutal-blue p-6 text-white shadow-[4px_4px_0_0_#000000]">
          <h2 className="mb-4 text-xl font-black">Integration Notes</h2>

          <div className="space-y-2 text-sm">
            <p>
              <strong>Where to use:</strong> Show this modal when a free user
              tries to export a document.
            </p>
            <p>
              <strong>Billing flow:</strong> The modal calls{" "}
              <code className="font-mono">POST /api/billing/checkout</code> with{" "}
              <code className="font-mono">priceId</code> and (for Creator){" "}
              <code className="font-mono">sessionId</code>.
            </p>
            <p>
              <strong>After checkout:</strong> User is redirected to Stripe,
              then back to your app with success/cancel params.
            </p>
            <p>
              <strong>Webhook handling:</strong> Stripe webhook updates user
              subscription or purchased_books table.
            </p>
          </div>
        </div>
      </div>

      {/* The Modal */}
      <UpgradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}
