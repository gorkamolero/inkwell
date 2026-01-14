"use client";

import { Check, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import {
  BrutalDialog,
  BrutalDialogContent,
  BrutalDialogHeader,
  BrutalDialogTitle,
  BrutalDialogDescription,
} from "@/components/ui/brutal-dialog";
import { BrutalButton } from "@/components/ui/brutal-button";
import { BrutalBadge } from "@/components/ui/brutal-badge";
import { PRICING } from "@/lib/stripe";

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (tier: "creator" | "pro") => Promise<void>;
}

export function UpgradeModal({
  isOpen,
  onClose,
  onUpgrade,
}: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTier, setLoadingTier] = useState<"creator" | "pro" | null>(
    null,
  );

  async function handleUpgrade(tier: "creator" | "pro") {
    setIsLoading(true);
    setLoadingTier(tier);
    try {
      await onUpgrade(tier);
    } catch (error) {
      console.error("Upgrade failed:", error);
      // Error handling is done by parent
    } finally {
      setIsLoading(false);
      setLoadingTier(null);
    }
  }

  return (
    <BrutalDialog open={isOpen} onOpenChange={onClose}>
      <BrutalDialogContent className="max-w-4xl">
        <BrutalDialogHeader>
          <BrutalDialogTitle>Unlock Professional Exports</BrutalDialogTitle>
          <BrutalDialogDescription>
            Choose the option that fits your publishing needs
          </BrutalDialogDescription>
        </BrutalDialogHeader>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          {/* Creator Option */}
          <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000000]">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black text-black">Creator</h3>
                <BrutalBadge variant="secondary">Per Book</BrutalBadge>
              </div>
              <p className="text-gray-600 text-sm">
                Professional publishing for this book
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-black">
                  ${PRICING.CREATOR.price}
                </span>
                <span className="text-gray-600">one-time</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 flex-shrink-0 text-black mt-0.5" />
                <span className="text-black text-sm">
                  Clean exports (no watermark)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 flex-shrink-0 text-black mt-0.5" />
                <span className="text-black text-sm">
                  Print-ready CMYK with bleed
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 flex-shrink-0 text-black mt-0.5" />
                <span className="text-black text-sm">
                  All premium templates
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 flex-shrink-0 text-black mt-0.5" />
                <span className="text-black text-sm">
                  <strong>This book only</strong>
                </span>
              </li>
            </ul>

            <BrutalButton
              variant="default"
              size="lg"
              className="w-full"
              onClick={() => handleUpgrade("creator")}
              loading={isLoading && loadingTier === "creator"}
              loadingText="Redirecting..."
              disabled={isLoading}
            >
              <Zap className="h-4 w-4" />
              Unlock This Book
            </BrutalButton>

            <p className="text-xs text-gray-500 text-center mt-3">
              Perfect for single projects
            </p>
          </div>

          {/* Pro Option - Highlighted */}
          <div className="border-4 border-black bg-brutal-yellow p-6 shadow-[6px_6px_0_0_#000000] relative">
            {/* Best Value Badge */}
            <div className="absolute -top-3 -right-3 bg-black text-white px-3 py-1 border-3 border-black shadow-[3px_3px_0_0_#000000] rotate-3">
              <span className="font-black text-xs uppercase tracking-wider">
                Best Value
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black text-black">Pro</h3>
                <BrutalBadge variant="inverted">Annual</BrutalBadge>
              </div>
              <p className="text-black text-sm font-medium">
                For serious authors who publish regularly
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-black">
                  ${PRICING.PRO.price}
                </span>
                <span className="text-black/70">/year</span>
              </div>
              <p className="text-xs text-black/70 mt-1">
                Pays for itself after 3 books
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 flex-shrink-0 text-black mt-0.5" />
                <span className="text-black text-sm font-medium">
                  Clean exports on <strong>all projects</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 flex-shrink-0 text-black mt-0.5" />
                <span className="text-black text-sm font-medium">
                  All premium templates
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 flex-shrink-0 text-black mt-0.5" />
                <span className="text-black text-sm font-medium">
                  CMYK print-ready on everything
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 flex-shrink-0 text-black mt-0.5" />
                <span className="text-black text-sm font-medium">
                  GitHub sync (coming soon)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 flex-shrink-0 text-black mt-0.5" />
                <span className="text-black text-sm font-medium">
                  <strong>No per-book fees ever</strong>
                </span>
              </li>
            </ul>

            <BrutalButton
              variant="primary"
              size="lg"
              className="w-full bg-black text-white hover:bg-black/90"
              onClick={() => handleUpgrade("pro")}
              loading={isLoading && loadingTier === "pro"}
              loadingText="Redirecting..."
              disabled={isLoading}
            >
              <Sparkles className="h-4 w-4" />
              Go Pro Now
            </BrutalButton>

            <p className="text-xs text-black/70 text-center mt-3">
              Pays for itself after ~3 books per year
            </p>
          </div>
        </div>

        {/* Philosophy Footer */}
        <div className="mt-6 border-4 border-black bg-white p-4">
          <p className="text-sm text-gray-700 text-center">
            <strong>Our Philosophy:</strong> Free tier is genuinely useful.
            Upgrade only when you need professional polish. Your content is
            always yours.
          </p>
        </div>
      </BrutalDialogContent>
    </BrutalDialog>
  );
}
