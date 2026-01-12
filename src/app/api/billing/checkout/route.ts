import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ApiError,
  type AuthContext,
  validateBody,
  withAuth,
} from "@/lib/api-utils";
import { createCheckoutSession, PRICING } from "@/lib/stripe";

// ============================================================================
// Schema
// ============================================================================

const checkoutSchema = z.object({
  priceId: z.string().min(1, "Price ID is required"),
});

// ============================================================================
// POST /api/billing/checkout - Create Stripe checkout session
// ============================================================================

async function createCheckoutHandler(
  request: NextRequest,
  { userId, userEmail }: AuthContext,
) {
  const body = await validateBody(request, checkoutSchema);

  // Validate that the priceId is one of our valid prices
  const validPriceIds = [PRICING.PRO.priceId, PRICING.TEAM.priceId].filter(
    Boolean,
  );
  if (!validPriceIds.includes(body.priceId)) {
    throw ApiError.badRequest("Invalid price ID");
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const checkoutSession = await createCheckoutSession({
      userId,
      userEmail,
      priceId: body.priceId,
      successUrl: `${baseUrl}/settings?success=true`,
      cancelUrl: `${baseUrl}/settings?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw ApiError.internal("Failed to create checkout session");
  }
}

export const POST = withAuth(createCheckoutHandler);
