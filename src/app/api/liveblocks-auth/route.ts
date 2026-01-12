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

  // Get authenticated user if available
  const session = await auth();

  // Generate user ID and info
  let userId: string;
  let userInfo: { name: string; color: string; picture?: string; isAuthenticated: boolean };

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
    // Anonymous user - generate a consistent ID based on request
    userId = `anon-${generateAnonymousId()}`;
    userInfo = {
      name: generateAnonymousName(),
      color: generateUserColor(userId),
      isAuthenticated: false,
    };
  }

  const liveblocks = getLiveblocks();

  // If no room specified (AI/notifications), use identifyUser
  // If room specified, use prepareSession with room access
  if (!room) {
    // ID token auth - for AI copilots, notifications, etc.
    const { status, body: responseBody } = await liveblocks.identifyUser(
      userId,
      { userInfo }
    );
    return new Response(responseBody, { status });
  }

  // Access token auth - for specific room access
  const liveblocksSession = liveblocks.prepareSession(userId, {
    userInfo,
  });

  // Grant full access to the requested room
  liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);

  // Authorize and return the session
  const { status, body: responseBody } = await liveblocksSession.authorize();

  return new Response(responseBody, { status });
}

/**
 * Generate a consistent color based on user ID.
 * Uses a hash of the user ID to pick from a predefined palette.
 */
function generateUserColor(userId: string): string {
  const colors = [
    "#0066FF", // Blue
    "#FF66B2", // Pink
    "#00FF66", // Green
    "#FFE75C", // Yellow
    "#FF3333", // Red
    "#9933FF", // Purple
    "#FF9900", // Orange
    "#00CCCC", // Teal
  ];

  // Simple hash function to pick a color consistently
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Generate a random anonymous ID.
 * Format: 8 random alphanumeric characters.
 */
function generateAnonymousId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random anonymous name.
 * Uses adjective + noun pattern for friendly names.
 */
function generateAnonymousName(): string {
  const adjectives = [
    "Swift",
    "Clever",
    "Bold",
    "Quiet",
    "Bright",
    "Keen",
    "Calm",
    "Brave",
  ];
  const nouns = [
    "Writer",
    "Author",
    "Scribe",
    "Wordsmith",
    "Poet",
    "Editor",
    "Storyteller",
    "Narrator",
  ];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
}
