import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const GUEST_COOKIE = "hotpress-guest";
function signature(id: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Authentication configuration unavailable");
  return createHmac("sha256", secret)
    .update(`hotpress-guest:${id}`)
    .digest("base64url");
}
/** A signed cookie prevents a guest from choosing another comment author's ID. */
export function guestIdentity(cookie?: string) {
  const [id, supplied] = (cookie || "").split(".");
  if (
    /^[a-f0-9-]{36}$/.test(id || "") &&
    /^[A-Za-z0-9_-]{43}$/.test(supplied || "")
  ) {
    const expected = signature(id);
    if (
      supplied.length === expected.length &&
      timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
    ) {
      return { id: `anon-${id}`, cookie: `${id}.${supplied}` };
    }
  }
  const fresh = randomUUID();
  return { id: `anon-${fresh}`, cookie: `${fresh}.${signature(fresh)}` };
}
