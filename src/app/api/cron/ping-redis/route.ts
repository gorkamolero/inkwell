import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { pingRedis } from "@/lib/redis-ping";

/**
 * Cron endpoint to keep Upstash Redis alive
 * 
 * Upstash deletes databases after 14 days of inactivity.
 * This endpoint should be called at least once every 13 days.
 * 
 * Configure cron in vercel.json:
 * { "crons": [{ "path": "/api/cron/ping-redis", "schedule": "0 0 */13 * *" }] }
 * 
 * Optional: Set CRON_SECRET in Vercel environment for request validation.
 * Vercel sends this as x-vercel-cron-signature header.
 */
export async function GET() {
  // Verify cron secret if configured
  const headersList = await headers();
  const cronSignature = headersList.get("x-vercel-cron-signature");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && cronSignature !== expectedSecret) {
    console.warn("[cron] Unauthorized cron request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pingRedis();
  
  if (result.success) {
    return NextResponse.json(result);
  }
  
  return NextResponse.json(result, { status: 500 });
}
