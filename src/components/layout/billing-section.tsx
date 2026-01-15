"use client";

import { Check, Crown, Sparkles } from "lucide-react";
import { useState } from "react";
import { PLANS, PRICING, type PlanType } from "@/lib/stripe";
import type { UserWithSubscription } from "@/types";

function getCurrentPlan(stripePriceId: string | undefined | null): PlanType {
  if (!stripePriceId) {
    return "free";
  }

  if (stripePriceId === PRICING.PRO.priceId) {
    return "pro";
  }

  // Default to free for unknown price IDs
  return "free";
}

interface BillingSectionProps {
  user: UserWithSubscription;
}

export function BillingSection({ user }: BillingSectionProps) {
  const [isLoading, setIsLoading] = useState(false);

  const currentPlan = getCurrentPlan(user.subscription?.stripePriceId);
  const isPro = currentPlan === "pro";

  const currentPlanInfo = PLANS[currentPlan];

  const handleManageBilling = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeToPro = async () => {
    setIsLoading(true);

    try {
      const priceId = PRICING.PRO.priceId;
      if (!priceId) {
        console.error("Pro price ID not configured");
        alert("Payment system not configured. Please try again later.");
        return;
      }

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (!data.url) {
        throw new Error("No checkout URL returned");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div
        className={`border-4 p-4 ${
          isPro
            ? "border-yellow-400 bg-yellow-50"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-2">
          {isPro ? (
            <Crown className="h-5 w-5 text-yellow-600" />
          ) : (
            <Sparkles className="h-5 w-5 text-gray-600" />
          )}
          <span className="font-bold text-black">
            Current Plan: {currentPlanInfo.name}
          </span>
        </div>
        {isPro && user.subscription?.currentPeriodEnd && (
          <p className="mt-1 text-sm text-gray-700">
            Renews on{" "}
            {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        )}
        {!isPro && (
          <p className="mt-1 text-sm text-gray-600">
            Unlock individual books for $12.99 each, or go Pro for unlimited
            clean exports.
          </p>
        )}
      </div>

      {/* Plan Features */}
      <div>
        <h4 className="mb-2 font-bold text-black">Your Features</h4>
        <ul className="space-y-2">
          {currentPlanInfo.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pro Benefits (for free users) */}
      {!isPro && (
        <div className="border-4 border-yellow-400 bg-yellow-50 p-4">
          <h4 className="mb-2 font-bold text-black">
            Go Pro - ${PRICING.PRO.price}/year
          </h4>
          <ul className="space-y-1 text-sm">
            {PLANS.pro.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="h-3 w-3 text-yellow-600" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        {!isPro ? (
          <button
            type="button"
            onClick={handleUpgradeToPro}
            disabled={isLoading}
            className="border-4 border-black bg-yellow-400 px-6 py-2 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Go Pro - $39.99/year"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleManageBilling}
            disabled={isLoading}
            className="border-4 border-black bg-white px-6 py-2 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Manage Billing"}
          </button>
        )}
      </div>
    </div>
  );
}
