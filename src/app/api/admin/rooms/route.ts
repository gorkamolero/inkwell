import { Liveblocks } from "@liveblocks/node";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Admin API for Liveblocks room management
 *
 * GET /api/admin/rooms?id=xxx - Get room info
 * POST /api/admin/rooms - Create room
 * DELETE /api/admin/rooms?id=xxx - Delete room
 */

let liveblocksClient: Liveblocks | null = null;

function getLiveblocks(): Liveblocks {
  if (!liveblocksClient) {
    const secret = process.env.LIVEBLOCKS_SECRET_KEY;
    if (!secret) {
      throw new Error("LIVEBLOCKS_SECRET_KEY not set");
    }
    liveblocksClient = new Liveblocks({ secret });
  }
  return liveblocksClient;
}

const CreateRoomSchema = z.object({
  id: z.string().min(1),
  defaultAccesses: z.array(z.string()).optional(),
});

// GET - Get room info
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Room ID required" }, { status: 400 });
  }

  try {
    const liveblocks = getLiveblocks();
    const room = await liveblocks.getRoom(id);
    return NextResponse.json(room);
  } catch (error) {
    return NextResponse.json(
      { error: "Room not found", details: String(error) },
      { status: 404 }
    );
  }
}

// POST - Create room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, defaultAccesses } = CreateRoomSchema.parse(body);

    const liveblocks = getLiveblocks();

    // Check if room exists
    try {
      await liveblocks.getRoom(id);
      return NextResponse.json(
        { error: "Room already exists", id },
        { status: 409 }
      );
    } catch {
      // Room doesn't exist, create it
    }

    const room = await liveblocks.createRoom(id, {
      defaultAccesses: (defaultAccesses as ("room:write" | "room:read")[]) || ["room:write"],
    });

    return NextResponse.json({ success: true, room });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create room", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Delete room
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Room ID required" }, { status: 400 });
  }

  try {
    const liveblocks = getLiveblocks();
    await liveblocks.deleteRoom(id);
    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete room", details: String(error) },
      { status: 500 }
    );
  }
}
