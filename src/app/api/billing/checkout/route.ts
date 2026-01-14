import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ApiError,
  type AuthContext,
  withAuth,
} from "@/lib/api-utils";
import {
  createProCheckoutSession,
  createCreatorCheckoutSession,
  PRICING,
} from "@/lib/stripe";

// ============================================================================
// Schema
// ============================================================================

const checkoutSchema = z.object({
  priceId: z.string().min(1, "Price ID is required"),
  sessionId: z.string().optional(), // Required for Creator (per-book) purchases
});

// ============================================================================
// POST /api/billing/checkout - Create Stripe checkout session
// ============================================================================

async function createCheckoutHandler(
  request: NextRequest,
  { userId, userEmail }: AuthContext,
) {
  const body = checkoutSchema.parse(await request.json());
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    // Handle Pro subscription (annual)
    if (body.priceId === PRICING.PRO.priceId) {
      const checkoutSession = await createProCheckoutSession({
        userId,
        userEmail,
        successUrl: `${baseUrl}/settings?success=true`,
        cancelUrl: `${baseUrl}/settings?canceled=true`,
      });
      return NextResponse.json({ url: checkoutSession.url });
    }

    // Handle Creator book purchase (one-time)
    if (body.priceId === PRICING.CREATOR.priceId) {
      if (!body.sessionId || body.sessionId === "undefined") {
        throw ApiError.badRequest(
          "Session ID is required for Creator purchases",
        );
      }

      const checkoutSession = await createCreatorCheckoutSession({
        userId,
        userEmail,
        sessionId: body.sessionId,
        successUrl: `${baseUrl}/s/${body.sessionId}?purchased=true`,
        cancelUrl: `${baseUrl}/s/${body.sessionId}?canceled=true`,
      });
      return NextResponse.json({ url: checkoutSession.url });
    }

    throw ApiError.badRequest("Invalid price ID");
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Error creating checkout session:", error);
    throw ApiError.internal("Failed to create checkout session");
  }
}

export const POST = withAuth(createCheckoutHandler);
