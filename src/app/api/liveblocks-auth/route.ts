import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GUEST_COOKIE, guestIdentity } from "@/lib/guest-identity";
import {
  authorColor as generateUserColor,
  guestName,
} from "@/lib/collaboration-identity";
import { Liveblocks } from "@liveblocks/node";
import { auth } from "@/lib/auth";

/**
 * Liveblocks authentication endpoint.
 *
 * Authenticates users for specific Liveblocks rooms based on session ID.
 * Supports both authenticated users (with NextAuth session) and anonymous guests.
 *
 * Room access is granted based on the session ID provided in the request.
 * All users (authenticated or anonymous) can access rooms they have the session ID for.
 */

// Lazy-load Liveblocks client to avoid build errors when secret is not set
let liveblocksClient: Liveblocks | null = null;

function getLiveblocks(): Liveblocks {
  if (!liveblocksClient) {
    const secret = process.env.LIVEBLOCKS_SECRET_KEY;
    if (!secret) {
      throw new Error("LIVEBLOCKS_SECRET_KEY environment variable is not set");
    }
    liveblocksClient = new Liveblocks({ secret });
  }
  return liveblocksClient;
}

export async function POST(request: Request) {
  // Get the room from request body (may be undefined for AI/notifications)
  const body = await request.json();
  const { room } = body;
  // A room ID is a capability in the existing sharing model, never a pattern.
  if (
    room !== undefined &&
    (typeof room !== "string" || !room || room.includes("*"))
  ) {
    return new Response("Invalid room ID", { status: 400 });
  }

  // Get authenticated user if available
  const session = await auth();

  // Generate user ID and info
  let guestCookie: string | undefined;
  let userId: string;
  let userInfo: {
    name: string;
    color: string;
    picture?: string;
    isAuthenticated: boolean;
  };

  if (session?.user) {
    // Authenticated user
    userId = session.user.id;
    userInfo = {
      name: session.user.name || session.user.login || "User",
      color: generateUserColor(userId),
      picture: session.user.image || undefined,
      isAuthenticated: true,
    };
  } else {
    // One identity for room, roomless and refreshed access tokens.
    const guest = guestIdentity((await cookies()).get(GUEST_COOKIE)?.value);
    userId = guest.id;
    guestCookie = guest.cookie;
    userInfo = {
      name: guestName(userId),
      color: generateUserColor(userId),
      isAuthenticated: false,
    };
  }

  const liveblocks = getLiveblocks();

  // Use access tokens for both room and roomless features. An empty grant
  // authenticates notifications without granting access to any room; the client
  // only reuses a room token when its exact room permission matches.
  const liveblocksSession = liveblocks.prepareSession(userId, { userInfo });
  if (room) {
    liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);
  }

  // Authorize and return the session
  const { status, body: responseBody } = await liveblocksSession.authorize();

  const response = new NextResponse(responseBody, { status });
  if (guestCookie && status === 200)
    response.cookies.set(GUEST_COOKIE, guestCookie, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      secure: new URL(request.url).protocol === "https:",
    });
  return response;
}
