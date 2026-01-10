import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withAuth, ApiError, type AuthContext } from "@/lib/api-utils";
import { createBillingPortalSession } from "@/lib/stripe";
import { db, subscriptions } from "@/lib/db";

// ============================================================================
// POST /api/billing/portal - Create Stripe billing portal session
// ============================================================================

async function createPortalHandler(
  request: NextRequest,
  { userId }: AuthContext
) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // Get the user's subscription to find their Stripe customer ID
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  if (!subscription?.stripeCustomerId) {
    throw ApiError.badRequest(
      "No billing account found. Please subscribe to a plan first."
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const portalSession = await createBillingPortalSession({
      customerId: subscription.stripeCustomerId,
      returnUrl: `${baseUrl}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    throw ApiError.internal("Failed to create billing portal session");
  }
}

export const POST = withAuth(createPortalHandler);
