"use client";

import { Check, Crown } from "lucide-react";
import { useState } from "react";
import { PLANS, type PlanType } from "@/lib/stripe";
import type { UserWithSubscription } from "@/types";

function getCurrentPlan(stripePriceId: string | undefined | null): PlanType {
  if (!stripePriceId) {
    return "free";
  }

  if (stripePriceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEAM) {
    return "team";
  }

  return "pro";
}

interface BillingSectionProps {
  user: UserWithSubscription;
}

export function BillingSection({ user }: BillingSectionProps) {
  const [isLoading, setIsLoading] = useState(false);

  const currentPlan = getCurrentPlan(user.subscription?.stripePriceId);

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

  const handleUpgrade = async (priceId: string) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="border-4 border-yellow-400 bg-yellow-50 p-4">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-600" />
          <span className="font-bold text-black">
            Current Plan: {currentPlanInfo.name}
          </span>
        </div>
        {user.subscription?.currentPeriodEnd && (
          <p className="mt-1 text-sm text-gray-700">
            Renews on{" "}
            {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Plan Features */}
      <div>
        <h4 className="mb-2 font-bold text-black">Plan Features</h4>
        <ul className="space-y-2">
          {currentPlanInfo.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        {currentPlan === "free" ? (
          <>
            <button
              type="button"
              onClick={() => handleUpgrade(PLANS.pro.priceId!)}
              disabled={isLoading}
              className="border-4 border-black bg-yellow-400 px-6 py-2 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Upgrade to Pro
            </button>
            <button
              type="button"
              onClick={() => handleUpgrade(PLANS.team.priceId!)}
              disabled={isLoading}
              className="border-4 border-black bg-white px-6 py-2 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Upgrade to Team
            </button>
          </>
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
