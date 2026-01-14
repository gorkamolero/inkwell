import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createId } from "@paralleldrive/cuid2";
import { db, subscriptions, purchasedBooks } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!db) {
    return new NextResponse("Database not configured", { status: 500 });
  }

  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature");

  if (!signature) {
    return new NextResponse("Missing Stripe signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Handle Creator book purchase (one-time payment)
      if (
        session.mode === "payment" &&
        session.metadata?.type === "creator_book_purchase"
      ) {
        const { userId, sessionId } = session.metadata;
        const paymentIntentId = session.payment_intent as string;

        if (!userId || !sessionId || !paymentIntentId) {
          console.error("Missing required metadata for creator purchase:", {
            userId,
            sessionId,
            paymentIntentId,
            checkoutSessionId: session.id,
          });
          break;
        }

        try {
          // Insert purchase record with idempotency via unique constraint
          await db
            .insert(purchasedBooks)
            .values({
              id: createId(),
              userId,
              sessionId,
              stripePaymentIntentId: paymentIntentId,
            })
            .onConflictDoNothing(); // Ignore if already exists (webhook retry)

          console.log("Creator book purchase recorded:", {
            userId,
            sessionId,
            paymentIntentId,
          });

          // TODO: Send purchase confirmation email
          // - Receipt with payment details
          // - Link to access the book
          // - Instructions for downloading exports
        } catch (error) {
          console.error("Failed to record creator purchase:", error, {
            userId,
            sessionId,
            paymentIntentId,
          });
        }
        break;
      }

      // Handle Pro subscription
      if (!session.subscription || !session.client_reference_id) {
        break;
      }

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
        { expand: ["items.data"] },
      );

      // Get billing period from the first subscription item
      const firstItem = subscription.items.data[0];
      const currentPeriodEnd = firstItem?.current_period_end;

      // Upsert subscription record
      await db
        .insert(subscriptions)
        .values({
          id: crypto.randomUUID(),
          userId: session.client_reference_id,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: firstItem?.price.id ?? null,
          status: subscription.status,
          currentPeriodEnd: currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000)
            : null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: firstItem?.price.id ?? null,
            status: subscription.status,
            currentPeriodEnd: currentPeriodEnd
              ? new Date(currentPeriodEnd * 1000)
              : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;

      // Get subscription ID from parent.subscription_details
      const subscriptionId = invoice.parent?.subscription_details?.subscription;

      if (!subscriptionId) {
        break;
      }

      const subId =
        typeof subscriptionId === "string" ? subscriptionId : subscriptionId.id;

      const subscription = await stripe.subscriptions.retrieve(subId, {
        expand: ["items.data"],
      });

      const firstItem = subscription.items.data[0];
      const currentPeriodEnd = firstItem?.current_period_end;

      await db
        .update(subscriptions)
        .set({
          stripePriceId: firstItem?.price.id ?? null,
          status: subscription.status,
          currentPeriodEnd: currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000)
            : null,
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      await db
        .update(subscriptions)
        .set({
          status: "canceled",
          stripeSubscriptionId: null,
          stripePriceId: null,
          currentPeriodEnd: null,
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;

      const firstItem = subscription.items.data[0];
      const currentPeriodEnd = firstItem?.current_period_end;

      await db
        .update(subscriptions)
        .set({
          stripePriceId: firstItem?.price.id ?? null,
          status: subscription.status,
          currentPeriodEnd: currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000)
            : null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;

      // Get subscription ID from parent.subscription_details
      const subscriptionId = invoice.parent?.subscription_details?.subscription;

      if (!subscriptionId) {
        break;
      }

      const subId =
        typeof subscriptionId === "string" ? subscriptionId : subscriptionId.id;

      // Mark subscription as past_due
      await db
        .update(subscriptions)
        .set({
          status: "past_due",
        })
        .where(eq(subscriptions.stripeSubscriptionId, subId));
      break;
    }
  }

  return new NextResponse(null, { status: 200 });
}
