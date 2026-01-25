#!/usr/bin/env node
/**
 * Redis Ping Script
 * 
 * Run this via cron every 13 days to keep Upstash Redis alive:
 * 
 * Linux/Mac cron (every 13 days at midnight):
 * 0 0 */13 * * /path/to/node /path/to/www/inkwell/scripts/ping-redis.js
 * 
 * Or run manually:
 * node scripts/ping-redis.js
 */

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.REDIS_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN,
});

const PING_KEY = "hotpress:cron:ping";

async function ping() {
  try {
    const now = Date.now();
    await redis.set(PING_KEY, now);
    console.log(`✓ Redis pinged at ${new Date(now).toISOString()}`);
    process.exit(0);
  } catch (error) {
    console.error("✗ Redis ping failed:", error.message);
    process.exit(1);
  }
}

ping();
