import { inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await auth())?.user)
    return new Response("Unauthorized", { status: 401 });
  const body = await request.json().catch(() => null);
  const ids = body?.userIds;
  if (
    !Array.isArray(ids) ||
    ids.length > 50 ||
    ids.some((id) => typeof id !== "string" || !id || id.length > 256)
  ) {
    return new Response("Invalid user IDs", { status: 400 });
  }
  if (!db) return new Response("Unavailable", { status: 503 });
  const rows = ids.length
    ? await db
        .select({ id: users.id, name: users.name, avatar: users.image })
        .from(users)
        .where(inArray(users.id, ids))
    : [];
  const byId = new Map(
    rows.map((user) => [
      user.id,
      {
        name: user.name || "Writer",
        avatar: user.avatar || undefined,
      },
    ]),
  );
  return Response.json(
    ids.map((id) => byId.get(id) ?? null),
    {
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
