import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.REDIS_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN,
});

const PING_KEY = "hotpress:cron:ping";
const PING_INTERVAL = 14 * 24 * 60 * 60 * 1000; // 14 days in ms

export async function pingRedis() {
  const now = Date.now();
  
  try {
    // Get last ping time
    const lastPing = await redis.get<number>(PING_KEY);
    
    // If last ping was more than 13 days ago, ping now
    if (!lastPing || now - lastPing > PING_INTERVAL - 24 * 60 * 60 * 1000) {
      await redis.set(PING_KEY, now);
      console.log(`[cron] Redis ping at ${new Date(now).toISOString()}`);
      return { success: true, message: "Redis pinged" };
    }
    
    console.log(`[cron] Redis skip - last ping: ${new Date(lastPing).toISOString()}`);
    return { success: true, message: "Redis already pinged recently", lastPing };
  } catch (error) {
    console.error("[cron] Redis ping failed:", error);
    return { success: false, error: String(error) };
  }
}

// Run if called directly
if (require.main === module) {
  pingRedis()
    .then(result => console.log(result))
    .catch(error => console.error(error))
    .finally(() => process.exit(0));
}
