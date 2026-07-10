import { WebhookHandler } from "@liveblocks/node";
import { headers } from "next/headers";
import { sendDocumentEditedEmail } from "@/lib/email";
import { db, projects, projectCollaborators, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Liveblocks } from "@liveblocks/node";
import { redis } from "@/lib/redis";

// Redis key prefix for online users
const ONLINE_USERS_PREFIX = "hotpress:online-users:";
const ONLINE_USERS_TTL = 60; // seconds - user times out after 60s of inactivity

// Lazy initialization to avoid build-time errors
let liveblocksClient: Liveblocks | null = null;
let webhookHandler: WebhookHandler | null = null;

function getLiveblocksClient() {
  if (!liveblocksClient) {
    if (!process.env.LIVEBLOCKS_SECRET_KEY) {
      console.warn("LIVEBLOCKS_SECRET_KEY not set");
      return null;
    }
    liveblocksClient = new Liveblocks({
      secret: process.env.LIVEBLOCKS_SECRET_KEY,
    });
  }
  return liveblocksClient;
}

function getWebhookHandler() {
  if (!webhookHandler) {
    if (!process.env.LIVEBLOCKS_WEBHOOK_SECRET) {
      console.warn("LIVEBLOCKS_WEBHOOK_SECRET not set");
      return null;
    }
    webhookHandler = new WebhookHandler(process.env.LIVEBLOCKS_WEBHOOK_SECRET);
  }
  return webhookHandler;
}

/**
 * Check if a user is online in a specific room
 */
async function isUserOnline(roomId: string, userId: string): Promise<boolean> {
  try {
    const key = `${ONLINE_USERS_PREFIX}${roomId}`;
    const members = await redis.smembers(key);
    return Array.isArray(members) && members.includes(userId);
  } catch (error) {
    console.error("Redis error checking online status:", error);
    return false; // Fail open - don't send notification if Redis fails
  }
}

/**
 * Add user to online set for a room
 */
async function addUserOnline(roomId: string, userId: string): Promise<void> {
  try {
    const key = `${ONLINE_USERS_PREFIX}${roomId}`;
    await redis.sadd(key, userId);
    await redis.expire(key, ONLINE_USERS_TTL);
  } catch (error) {
    console.error("Redis error adding user online:", error);
  }
}

/**
 * Remove user from online set for a room
 */
async function removeUserOnline(roomId: string, userId: string): Promise<void> {
  try {
    const key = `${ONLINE_USERS_PREFIX}${roomId}`;
    await redis.srem(key, userId);
  } catch (error) {
    console.error("Redis error removing user online:", error);
  }
}

/**
 * Get all online users in a room
 */
async function getRoomOnlineUsers(roomId: string): Promise<string[]> {
  try {
    const key = `${ONLINE_USERS_PREFIX}${roomId}`;
    const members = await redis.smembers(key);
    return Array.isArray(members) ? members : [];
  } catch (error) {
    console.error("Redis error getting room users:", error);
    return [];
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const webhookSignature = headersList.get("webhook-signature");
  const webhookId = headersList.get("webhook-id");
  const webhookTimestamp = headersList.get("webhook-timestamp");

  if (!webhookSignature || !webhookId || !webhookTimestamp) {
    return new Response("Missing headers", { status: 400 });
  }

  const handler = getWebhookHandler();
  if (!handler) {
    return new Response("Webhook handler not configured", { status: 500 });
  }

  let event;
  try {
    event = handler.verifyRequest({
      headers: {
        "webhook-id": webhookId!,
        "webhook-timestamp": webhookTimestamp!,
        "webhook-signature": webhookSignature!,
      },
      rawBody: body,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Invalid signature", { status: 401 });
  }

  console.log(`Received Liveblocks webhook: ${event.type}`);

  switch (event.type) {
    case "ydocUpdated": {
      const { roomId, updatedAt } = event.data;
      await handleDocumentEdit({ roomId, updatedAt });
      break;
    }

    case "userEntered": {
      const { roomId, userId } = event.data;
      if (userId) {
        await handleUserEntered({ roomId, userId });
      }
      break;
    }

    case "userLeft": {
      const { roomId, userId } = event.data;
      if (userId) {
        await handleUserLeft({ roomId, userId });
      }
      break;
    }
  }

  return new Response("OK", { status: 200 });
}

async function handleDocumentEdit({
  roomId,
  updatedAt,
}: {
  roomId: string;
  updatedAt: string;
}) {
  // Get project info from room ID (format: project-{projectId}-{sessionId})
  const roomParts = roomId.split("-");
  const projectId = roomParts[1];
  if (!projectId) {
    console.log("Could not extract project ID from room:", roomId);
    return;
  }

  // db is possibly null when DATABASE_URL is not set
  if (!db) {
    console.log("Database not configured, skipping notification");
    return;
  }

  // Get project details
  const projectResult = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  const project = projectResult[0];

  if (!project) {
    console.log("Project not found:", projectId);
    return;
  }

  // Get all collaborators on this project
  const projectCollaboratorsList = await db
    .select({
      userId: projectCollaborators.userId,
      email: users.email,
      name: users.name,
    })
    .from(projectCollaborators)
    .innerJoin(users, eq(projectCollaborators.userId, users.id))
    .where(eq(projectCollaborators.projectId, projectId));

  // Get currently active users in this room from Redis
  const roomOnlineUsers = await getRoomOnlineUsers(roomId);

  // For each collaborator who's NOT online, send a notification
  const notifications = [];

  for (const collab of projectCollaboratorsList) {
    // Check if this collaborator is online in the room
    const isOnline = roomOnlineUsers.includes(collab.userId);
    if (isOnline) {
      console.log(`Collaborator ${collab.userId} is online, skipping notification`);
      continue;
    }

    if (!collab.email) continue;

    // Get user's notification preferences (implement this in your schema)
    // For now, we'll send to all
    notifications.push({
      to: collab.email,
      editorName: "A collaborator", // We can't identify the specific editor from YDocUpdated webhook
      editorEmail: "", // No specific editor email
      documentTitle: project.name,
      projectName: project.name,
      changeSummary: "Document was updated",
      editLink: `https://hotpress.app/projects/${projectId}`,
    });
  }

  // Send notification emails
  for (const notification of notifications) {
    try {
      await sendDocumentEditedEmail(notification);
      console.log(`Sent notification to ${notification.to}`);
    } catch (err) {
      console.error(`Failed to send notification to ${notification.to}:`, err);
    }
  }
}

async function handleUserEntered({ roomId, userId }: {
  roomId: string;
  userId: string;
}) {
  await addUserOnline(roomId, userId);
  console.log(`User ${userId} entered room ${roomId}`);
}

async function handleUserLeft({ roomId, userId }: {
  roomId: string;
  userId: string;
}) {
  await removeUserOnline(roomId, userId);
  console.log(`User ${userId} left room ${roomId}`);
}
