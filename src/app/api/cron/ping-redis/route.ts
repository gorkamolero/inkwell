import { NextResponse } from "next/server";
import { pingRedis } from "@/lib/redis-ping";

/**
 * Cron endpoint to keep Upstash Redis alive
 * 
 * Upstash deletes databases after 14 days of inactivity.
 * This endpoint should be called at least once every 13 days.
 * 
 * Configure cron in vercel.json - schedule: "0 0 every 13 days"
 */
export async function GET() {
  const result = await pingRedis();
  
  if (result.success) {
    return NextResponse.json(result);
  }
  
  return NextResponse.json(result, { status: 500 });
}
