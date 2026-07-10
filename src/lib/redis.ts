/**
 * Presence store used by the Liveblocks webhook to track which users are
 * currently active in a room (for notification de-duplication).
 *
 * This data is ephemeral and the callers already fail open, so the default
 * backing store is in-process memory with TTL — no external dependency to rot.
 * (Upstash free-tier databases get reaped after inactivity; that repeatedly
 * broke deploys, so presence no longer depends on them.)
 *
 * If a real Upstash/Vercel-KV instance is ever attached, its REST env vars are
 * picked up automatically and used instead, giving cross-instance presence.
 */
import { Redis as UpstashRedis } from "@upstash/redis";

type PresenceStore = {
  smembers(key: string): Promise<string[]>;
  sadd(key: string, member: string): Promise<number>;
  srem(key: string, member: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
};

function createUpstash(): PresenceStore | null {
  const url = process.env.KV_REST_API_URL || process.env.REDIS_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN;
  if (!url || !token) return null;
  const client = new UpstashRedis({ url, token });
  return {
    smembers: (key) => client.smembers(key),
    sadd: (key, member) => client.sadd(key, member),
    srem: (key, member) => client.srem(key, member),
    expire: (key, seconds) => client.expire(key, seconds),
  };
}

function createInMemory(): PresenceStore {
  // key -> (member -> expiry epoch ms)
  const sets = new Map<string, Map<string, number>>();

  function live(key: string): Map<string, number> {
    const now = Date.now();
    let set = sets.get(key);
    if (!set) {
      set = new Map();
      sets.set(key, set);
    }
    for (const [member, expiry] of set) {
      if (expiry !== 0 && expiry <= now) set.delete(member);
    }
    return set;
  }

  return {
    async smembers(key) {
      return [...live(key).keys()];
    },
    async sadd(key, member) {
      const set = live(key);
      const had = set.has(member);
      set.set(member, 0);
      return had ? 0 : 1;
    },
    async srem(key, member) {
      return live(key).delete(member) ? 1 : 0;
    },
    async expire(key, seconds) {
      const set = live(key);
      if (set.size === 0) return 0;
      const expiry = Date.now() + seconds * 1000;
      for (const member of set.keys()) set.set(member, expiry);
      return 1;
    },
  };
}

export const redis: PresenceStore = createUpstash() ?? createInMemory();
