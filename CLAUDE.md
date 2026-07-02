# Hotpress

Collaborative writing platform. Write together, publish instantly.

## Stack

- **Next.js 16** + TypeScript + Tailwind
- **Liveblocks** (Yjs CRDT) for real-time collaboration
- **Lexical** editor
- **PostgreSQL** + Drizzle ORM
- **Neobrutalist** design system

## Key Paths

```
src/app/api/           # REST APIs
src/components/editor/ # Lexical editor, collaboration
src/components/format/ # PDF formatting panels
src/components/ui/     # Brutal-* design system
src/lib/pdf/           # React-PDF generation
```

## Skills

- `/room-reset` - Reset Liveblocks room, inject test content
- `/room-info` - Get room status
- `/room-delete` - Delete room

See `.claude/skills/room-admin/SKILL.md`

## Test Session

- Room: `<TEST_ROOM_ID>` (set locally; not committed)
- Slug: `<TEST_SLUG>` (set locally; not committed)
- URL: `/s/<TEST_SLUG>`

## Commands

```bash
pnpm dev              # Start dev server
pnpm db:studio        # Drizzle Studio
pnpm db:migrate       # Run migrations
```

## Design: Neobrutalism

```css
.brutal {
  border: 3px solid black;
  box-shadow: 4px 4px 0 black;
}
```

Colors: Yellow `#FFE75C`, Blue `#0066FF`, Pink `#FF66B2`, Green `#00FF66`, Red `#FF3333`

## Standards

- Zero TypeScript errors
- Zero ESLint warnings
- Neobrutalist styling throughout
- Loading states for async ops
