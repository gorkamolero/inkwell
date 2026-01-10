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
      secret: string
    ) => {
      return getStripe().webhooks.constructEvent(payload, header, secret);
    },
  },
  subscriptions: {
    retrieve: (
      id: string,
      params?: Stripe.SubscriptionRetrieveParams,
      options?: Stripe.RequestOptions
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

export const PRICING = {
  FREE: {
    projects: 3,
    docsPerProject: 10,
    collaborators: 0,
  },
  PRO: {
    price: 12,
    priceId: process.env.STRIPE_PRICE_PRO!,
    projects: Infinity,
    docsPerProject: Infinity,
    collaborators: 5,
  },
  TEAM: {
    price: 29,
    priceId: process.env.STRIPE_PRICE_TEAM!,
    projects: Infinity,
    docsPerProject: Infinity,
    collaborators: Infinity,
  },
} as const;

export type Tier = keyof typeof PRICING;

// Legacy PLANS constant for backward compatibility with existing components
export const PLANS = {
  free: {
    name: "Free",
    description: "For individuals getting started",
    price: 0,
    features: [
      "3 projects",
      "10 docs per project",
      "Basic editor",
      "Export to Markdown",
      "Community support",
    ],
    limits: {
      projects: PRICING.FREE.projects,
      collaborators: PRICING.FREE.collaborators,
      docsPerProject: PRICING.FREE.docsPerProject,
      storage: 100, // MB
    },
  },
  pro: {
    name: "Pro",
    description: "For serious writers and small teams",
    price: PRICING.PRO.price,
    priceId: PRICING.PRO.priceId,
    features: [
      "Unlimited projects",
      "Unlimited documents",
      "Up to 5 collaborators",
      "Advanced editor features",
      "Version history",
      "GitHub sync",
      "Export to PDF, EPUB, DOCX",
      "Priority support",
    ],
    limits: {
      projects: PRICING.PRO.projects,
      collaborators: PRICING.PRO.collaborators,
      docsPerProject: PRICING.PRO.docsPerProject,
      storage: 5000, // MB
    },
  },
  team: {
    name: "Team",
    description: "For organizations and publishing teams",
    price: PRICING.TEAM.price,
    priceId: PRICING.TEAM.priceId,
    features: [
      "Everything in Pro",
      "Unlimited collaborators",
      "Team workspaces",
      "Admin controls",
      "API access",
      "Custom branding",
      "SSO (coming soon)",
    ],
    limits: {
      projects: PRICING.TEAM.projects,
      collaborators: PRICING.TEAM.collaborators,
      docsPerProject: PRICING.TEAM.docsPerProject,
      storage: 50000, // MB
    },
  },
} as const;

export type PlanType = keyof typeof PLANS;

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
  const session = await getStripe().checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: userId,
    mode: "subscription",
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
 * Determine the tier from a Stripe price ID
 */
export function getTierFromPriceId(priceId: string | null | undefined): Tier {
  if (!priceId) return "FREE";
  if (priceId === PRICING.TEAM.priceId) return "TEAM";
  if (priceId === PRICING.PRO.priceId) return "PRO";
  return "FREE";
}

/**
 * Get limits for a given tier
 */
export function getTierLimits(tier: Tier) {
  return PRICING[tier];
}
