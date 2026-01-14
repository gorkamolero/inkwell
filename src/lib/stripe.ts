import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

// For backward compatibility, export a getter that lazily initializes
export const stripe = {
  get instance() {
    return getStripe();
  },
  webhooks: {
    constructEvent: (
      payload: string | Buffer,
      header: string | Buffer | string[],
      secret: string,
    ) => {
      return getStripe().webhooks.constructEvent(payload, header, secret);
    },
  },
  subscriptions: {
    retrieve: (
      id: string,
      params?: Stripe.SubscriptionRetrieveParams,
      options?: Stripe.RequestOptions,
    ) => {
      return getStripe().subscriptions.retrieve(id, params, options);
    },
  },
  checkout: {
    sessions: {
      create: (params: Stripe.Checkout.SessionCreateParams) => {
        return getStripe().checkout.sessions.create(params);
      },
    },
  },
  billingPortal: {
    sessions: {
      create: (params: Stripe.BillingPortal.SessionCreateParams) => {
        return getStripe().billingPortal.sessions.create(params);
      },
    },
  },
};

// ============================================================================
// Pricing Configuration
// ============================================================================

// New pricing model: Feature-based (export quality), not limits-based
export const PRICING = {
  FREE: {
    // Unlimited everything - gating is on export quality, not quantity
    hasCleanExports: false,
    hasPrintReady: false,
    hasPremiumTemplates: false,
    hasGithubSync: false,
  },
  CREATOR: {
    // Per-book one-time purchase ($12.99)
    price: 12.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR_BOOK!,
    hasCleanExports: true,
    hasPrintReady: true,
    hasPremiumTemplates: true,
    hasGithubSync: false,
  },
  PRO: {
    // Annual subscription ($39.99/year)
    price: 39.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL!,
    hasCleanExports: true,
    hasPrintReady: true,
    hasPremiumTemplates: true,
    hasGithubSync: true,
  },
} as const;

export type Tier = keyof typeof PRICING;

export const PLANS = {
  free: {
    name: "Free Forever",
    description: "Everything you need to write and publish",
    price: 0,
    features: [
      "Unlimited writing & real-time collaboration",
      "Unlimited projects",
      "Unlimited PDF/EPUB exports",
      "Basic templates",
      '"Made with Hotpress" footer on exports',
    ],
    cta: "Get Started",
  },
  creator: {
    name: "Creator",
    description: "Professional publishing for your book",
    price: PRICING.CREATOR.price,
    priceId: PRICING.CREATOR.priceId,
    priceLabel: "per book",
    features: [
      "Clean exports (no watermark/footer)",
      "Print-ready CMYK with bleed marks",
      "All premium templates for that book",
      "Unlimited exports of that book forever",
    ],
    cta: "Unlock This Book",
  },
  pro: {
    name: "Pro",
    description: "For serious authors who publish regularly",
    price: PRICING.PRO.price,
    priceId: PRICING.PRO.priceId,
    priceLabel: "per year",
    features: [
      "Clean exports on all projects",
      "All premium templates",
      "CMYK print-ready on everything",
      "GitHub sync for manuscript versioning",
      "No per-book fees ever",
    ],
    cta: "Go Pro",
  },
} as const;

export type PlanType = keyof typeof PLANS;

// Create checkout session for Pro subscription (annual)
export async function createProCheckoutSession({
  userId,
  userEmail,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await getStripe().checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: userId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: PRICING.PRO.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      type: "pro_subscription",
    },
  });

  return session;
}

// Create checkout session for Creator book purchase (one-time)
export async function createCreatorCheckoutSession({
  userId,
  userEmail,
  sessionId,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  userEmail: string;
  sessionId: string; // The writing session (book) being purchased
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await getStripe().checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: userId,
    mode: "payment", // One-time payment, not subscription
    payment_method_types: ["card"],
    line_items: [
      {
        price: PRICING.CREATOR.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      sessionId, // Track which book was purchased
      type: "creator_book_purchase",
    },
  });

  return session;
}

// Legacy function for backward compatibility
export async function createCheckoutSession({
  userId,
  userEmail,
  priceId,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  userEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const isOneTimePayment = priceId === PRICING.CREATOR.priceId;

  const session = await getStripe().checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: userId,
    mode: isOneTimePayment ? "payment" : "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
  });

  return session;
}

export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

export async function getSubscription(subscriptionId: string) {
  return getStripe().subscriptions.retrieve(subscriptionId);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine the subscription tier from a Stripe price ID
 * Note: CREATOR is per-book, tracked separately in purchased_books table
 */
export function getTierFromPriceId(priceId: string | null | undefined): Tier {
  if (!priceId) return "FREE";
  if (priceId === PRICING.PRO.priceId) return "PRO";
  // CREATOR purchases are tracked per-book, not as a subscription tier
  return "FREE";
}

/**
 * Get feature flags for a given tier
 */
export function getTierFeatures(tier: Tier) {
  return PRICING[tier];
}

/**
 * Check if a price ID is for a one-time book purchase
 */
export function isCreatorPurchase(priceId: string | null | undefined): boolean {
  return priceId === PRICING.CREATOR.priceId;
}
