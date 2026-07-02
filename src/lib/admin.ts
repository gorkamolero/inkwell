import type { Session } from "next-auth";
import { ApiError } from "@/lib/api-utils";

/**
 * Admin allowlist for /api/admin/* routes.
 *
 * Admins are configured via the ADMIN_USER_IDS environment variable: a
 * comma-separated list of user ids (the `users.id` column, carried on
 * `session.user.id`). Whitespace around ids is ignored.
 *
 * Fail closed: if ADMIN_USER_IDS is unset or empty, nobody is an admin.
 */
function getAdminUserIds(): ReadonlySet<string> {
  const raw = process.env.ADMIN_USER_IDS;
  if (!raw) {
    return new Set();
  }
  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
  );
}

/**
 * Returns true only when the session belongs to an allowlisted admin.
 */
export function isAdmin(session: Session | null): boolean {
  const userId = session?.user?.id;
  if (!userId) {
    return false;
  }
  return getAdminUserIds().has(userId);
}

/**
 * Throws ApiError.unauthorized() (401) when there is no authenticated user,
 * and ApiError.forbidden() (403) when the user is not an allowlisted admin.
 */
export function requireAdmin(
  session: Session | null,
): asserts session is Session {
  if (!session?.user?.id) {
    throw ApiError.unauthorized();
  }
  if (!isAdmin(session)) {
    throw ApiError.forbidden("Admin access required");
  }
}
