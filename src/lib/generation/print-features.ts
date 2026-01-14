/**
 * Print Feature Access Control
 *
 * Gates professional print features behind Pro/Team subscription tiers.
 */

import { getUserTier } from "@/lib/subscription";

// ============================================================================
// Types
// ============================================================================

export type SubscriptionTier = "free" | "pro" | "team";

export interface PrintFeatureAccess {
  /** Can use bleed area expansion */
  canUseBleed: boolean;
  /** Can add trim/crop marks */
  canUseTrimMarks: boolean;
  /** Can add registration marks */
  canUseRegistrationMarks: boolean;
  /** Can add color bars */
  canUseColorBars: boolean;
  /** Can set PDF/X output intent */
  canUsePdfX: boolean;
  /** Can use CMYK color profile indication */
  canUseCMYK: boolean;
  /** User's subscription tier */
  tier: SubscriptionTier;
}

// ============================================================================
// Feature Access
// ============================================================================

/**
 * Get print feature access for a user
 */
export async function getPrintFeatureAccess(
  userId: string | undefined
): Promise<PrintFeatureAccess> {
  // No user = free tier
  if (!userId) {
    return getAccessForTier("free");
  }

  const tier = await getUserTier(userId);
  return getAccessForTier(tier);
}

/**
 * Get access flags for a specific tier
 */
export function getAccessForTier(tier: SubscriptionTier): PrintFeatureAccess {
  const isPro = tier === "pro" || tier === "team";

  return {
    canUseBleed: isPro,
    canUseTrimMarks: isPro,
    canUseRegistrationMarks: isPro,
    canUseColorBars: isPro,
    canUsePdfX: isPro,
    canUseCMYK: isPro,
    tier,
  };
}

/**
 * Check if a specific print feature is enabled for a tier
 */
export function isPrintFeatureEnabled(
  tier: SubscriptionTier,
  feature: keyof Omit<PrintFeatureAccess, "tier">
): boolean {
  const access = getAccessForTier(tier);
  return access[feature];
}

/**
 * Check if any print features are enabled in the config
 */
export function hasPrintFeaturesEnabled(pdfConfig: {
  bleed?: string;
  trimMarks?: boolean;
  registrationMarks?: boolean;
  colorBars?: boolean;
  outputIntent?: string;
}): boolean {
  const bleedValue = pdfConfig.bleed ? parseFloat(pdfConfig.bleed) : 0;

  return (
    bleedValue > 0 ||
    pdfConfig.trimMarks === true ||
    pdfConfig.registrationMarks === true ||
    pdfConfig.colorBars === true ||
    pdfConfig.outputIntent === "PDF/X-4"
  );
}

/**
 * Filter print config to only include features the user has access to
 */
export function filterPrintConfig(
  pdfConfig: {
    bleed?: string;
    trimMarks?: boolean;
    registrationMarks?: boolean;
    colorBars?: boolean;
    outputIntent?: string;
    colorProfile?: string;
  },
  access: PrintFeatureAccess
): {
  bleed: string;
  trimMarks: boolean;
  registrationMarks: boolean;
  colorBars: boolean;
  outputIntent: "none" | "PDF/X-4";
  colorProfile: string;
} {
  return {
    bleed: access.canUseBleed ? (pdfConfig.bleed || "0") : "0",
    trimMarks: access.canUseTrimMarks ? (pdfConfig.trimMarks ?? false) : false,
    registrationMarks: access.canUseRegistrationMarks
      ? (pdfConfig.registrationMarks ?? false)
      : false,
    colorBars: access.canUseColorBars ? (pdfConfig.colorBars ?? false) : false,
    outputIntent: access.canUsePdfX && pdfConfig.outputIntent === "PDF/X-4"
      ? "PDF/X-4"
      : "none",
    colorProfile: access.canUseCMYK
      ? (pdfConfig.colorProfile || "RGB")
      : "RGB",
  };
}
