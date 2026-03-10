import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { pingRedis } from "@/lib/redis-ping";

/**
 * Cron endpoint to keep Upstash Redis alive.
 * Upstash deletes databases after 14 days of inactivity.
 * 
 * Configure cron in vercel.json with schedule: every 13 days.
 * Set CRON_SECRET in Vercel for request validation (optional).
 * If CRON_SECRET is set in Vercel, you must configure the same secret
 * in the cron job settings so Vercel sends it as x-vercel-cron-signature.
 */
export async function GET() {
  const headersList = await headers();
  const cronSignature = headersList.get("x-vercel-cron-signature")?.trim();
  const expectedSecret = process.env.CRON_SECRET?.trim();

  // If CRON_SECRET is set, validate the signature
  if (expectedSecret) {
    // Vercel only sends the header if you configured a secret in cron settings
    if (cronSignature !== expectedSecret) {
      console.warn("[cron] Unauthorized cron request - invalid signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await pingRedis();
  
  if (result.success) {
    return NextResponse.json(result);
  }
  
  return NextResponse.json(result, { status: 500 });
}
