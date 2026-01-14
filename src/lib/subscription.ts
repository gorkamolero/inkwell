import { and, eq } from "drizzle-orm";
import { db, purchasedBooks, subscriptions } from "@/lib/db";
import { getTierFromPriceId, PRICING, type Tier } from "@/lib/stripe";

// ============================================================================
// Tier Determination
// ============================================================================

export type UserTier = "free" | "pro";

/**
 * Get the subscription tier for a user
 * Returns 'free' | 'pro' based on their active subscription
 * Note: 'creator' is per-book, not a user tier
 */
export async function getUserTier(userId: string): Promise<UserTier> {
  if (!db) {
    return "free";
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  // No subscription or inactive/canceled = free tier
  if (
    !subscription ||
    subscription.status === "canceled" ||
    subscription.status === "past_due"
  ) {
    return "free";
  }

  // Check if subscription has expired
  if (
    subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd < new Date()
  ) {
    return "free";
  }

  const tier = getTierFromPriceId(subscription.stripePriceId);
  return tier === "PRO" ? "pro" : "free";
}

/**
 * Get the PRICING tier enum for a user (uppercase)
 */
export async function getUserPricingTier(userId: string): Promise<Tier> {
  const tier = await getUserTier(userId);
  return tier.toUpperCase() as Tier;
}

// ============================================================================
// Export Access (the core of the new pricing model)
// ============================================================================

export interface ExportAccess {
  hasCleanExports: boolean; // No "Made with Hotpress" footer
  hasPrintReady: boolean; // CMYK, bleed marks, trim marks
  hasPremiumTemplates: boolean;
  hasGithubSync: boolean;
  reason: "pro" | "purchased" | "free";
}

/**
 * Check if a user has clean export access for a specific session (book)
 *
 * Access is granted if:
 * 1. User has Pro subscription (all sessions)
 * 2. User purchased this specific session (Creator tier)
 *
 * Otherwise, exports include "Made with Hotpress" footer
 */
export async function getExportAccess(
  userId: string | null,
  sessionId: string,
): Promise<ExportAccess> {
  // Unauthenticated users get free tier
  if (!userId || !db) {
    return {
      hasCleanExports: false,
      hasPrintReady: false,
      hasPremiumTemplates: false,
      hasGithubSync: false,
      reason: "free",
    };
  }

  // Check if user has Pro subscription
  const userTier = await getUserTier(userId);
  if (userTier === "pro") {
    return {
      hasCleanExports: true,
      hasPrintReady: true,
      hasPremiumTemplates: true,
      hasGithubSync: true,
      reason: "pro",
    };
  }

  // Check if user purchased this specific book
  const purchase = await db.query.purchasedBooks.findFirst({
    where: and(
      eq(purchasedBooks.userId, userId),
      eq(purchasedBooks.sessionId, sessionId),
    ),
  });

  if (purchase) {
    return {
      hasCleanExports: true,
      hasPrintReady: true,
      hasPremiumTemplates: true,
      hasGithubSync: false, // GitHub sync is Pro-only
      reason: "purchased",
    };
  }

  // Free tier
  return {
    hasCleanExports: false,
    hasPrintReady: false,
    hasPremiumTemplates: false,
    hasGithubSync: false,
    reason: "free",
  };
}

/**
 * Check if a user has purchased a specific book
 */
export async function hasBookPurchase(
  userId: string,
  sessionId: string,
): Promise<boolean> {
  if (!db) return false;

  const purchase = await db.query.purchasedBooks.findFirst({
    where: and(
      eq(purchasedBooks.userId, userId),
      eq(purchasedBooks.sessionId, sessionId),
    ),
  });

  return !!purchase;
}

/**
 * Get all books purchased by a user
 */
export async function getUserPurchasedBooks(userId: string) {
  if (!db) return [];

  return db.query.purchasedBooks.findMany({
    where: eq(purchasedBooks.userId, userId),
    with: {
      session: true,
    },
  });
}

// ============================================================================
// Feature Access Helpers
// ============================================================================

/**
 * Check if user has GitHub sync access (Pro only)
 */
export async function hasGithubSyncAccess(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return tier === "pro";
}

/**
 * Get features available for a tier
 */
export function getTierFeatures(tier: Tier) {
  return PRICING[tier];
}

// ============================================================================
// Legacy Limit Functions (all return true - everything is unlimited now)
// ============================================================================

/**
 * @deprecated Everything is unlimited in the new pricing model
 */
export async function canCreateProject(_userId: string): Promise<boolean> {
  return true;
}

/**
 * @deprecated Everything is unlimited in the new pricing model
 */
export async function canAddDocument(_projectId: string): Promise<boolean> {
  return true;
}

/**
 * @deprecated Everything is unlimited in the new pricing model
 */
export async function canAddCollaborator(_projectId: string): Promise<boolean> {
  return true;
}

// ============================================================================
// Usage Statistics (simplified - no limits)
// ============================================================================

/**
 * Get user's subscription info
 */
export async function getUserSubscriptionInfo(userId: string) {
  const tier = await getUserTier(userId);
  const features = PRICING[tier.toUpperCase() as Tier];

  return {
    tier,
    ...features,
  };
}
