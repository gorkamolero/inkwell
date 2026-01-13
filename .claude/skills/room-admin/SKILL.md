---
name: room-admin
description: |
  Manage Liveblocks rooms for testing Hotpress editor. Reset rooms, inject
  sample content, debug collaboration issues.

triggers:
  - pattern: "/room-reset"
    action: reset_room
    description: Reset a Liveblocks room with optional content injection
  - pattern: "/room-info"
    action: get_room
    description: Get info about a Liveblocks room
  - pattern: "/room-delete"
    action: delete_room
    description: Delete a Liveblocks room
---

# Room Admin Skill

Manage Liveblocks rooms for Hotpress testing and debugging.

## When to Activate

- User needs to reset a room for testing
- Debugging Liveblocks/Yjs issues
- Injecting sample content for testing PDF generation
- Clearing corrupted room state

## API Endpoints

All endpoints are at `http://localhost:3000/api/admin/rooms`

### Get Room Info

```bash
curl http://localhost:3000/api/admin/rooms?id=ROOM_ID
```

### Create Room

```bash
curl -X POST http://localhost:3000/api/admin/rooms \
  -H "Content-Type: application/json" \
  -d '{"id": "ROOM_ID"}'
```

### Delete Room

```bash
curl -X DELETE http://localhost:3000/api/admin/rooms?id=ROOM_ID
```

### Reset Room (Most Common)

Delete + recreate + inject content in one call:

```bash
curl -X POST http://localhost:3000/api/admin/rooms/reset \
  -H "Content-Type: application/json" \
  -d '{"id": "ROOM_ID", "content": "# Chapter 1\n\nHello world."}'
```

### Reset with Sample Book

```bash
curl -X POST http://localhost:3000/api/admin/rooms/reset \
  -H "Content-Type: application/json" \
  -d "$(cat scripts/sample-book.md | jq -Rs '{id: "ROOM_ID", content: .}')"
```

## Test Session

- Room ID: `<TEST_ROOM_ID>`
- Share slug: `<TEST_SLUG>`
- URL: `http://localhost:3000/s/<TEST_SLUG>`

## Content Format

The reset endpoint accepts markdown content:

- `# Heading` → Lexical HeadingNode (h1-h6)
- `> Quote` → Lexical QuoteNode
- Regular text → Lexical ParagraphNode
- `* * *` or `---` → Scene break (rendered as paragraph)

## Troubleshooting

### "Expected shared type to include type attribute"

Room has corrupted Yjs data. Reset it:

```bash
curl -X POST http://localhost:3000/api/admin/rooms/reset \
  -H "Content-Type: application/json" \
  -d '{"id": "<TEST_ROOM_ID>"}'
```

### WebSocket connection timeout

1. Check if room exists: `GET /api/admin/rooms?id=...`
2. Delete and recreate if corrupted
3. Refresh browser to reconnect

### Content not appearing

After reset, user must refresh the page to reconnect to the new room.
