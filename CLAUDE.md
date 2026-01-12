# Hotpress - Collaborative Writing Platform

## Vision
"Write together. Publish instantly."

A collaborative writing platform with live output. Write a book, article, or thread with your team. PDF regenerates on every save. Your content stays yours (GitHub-backed).

## Core Philosophy

1. **Land -> Write immediately** (no auth required)
2. **Collaborate in real-time** (Liveblocks)
3. **Save to GitHub when ready** (you own your data)
4. **Configure formatting via schema** (API-driven)
5. **PDF regenerates automatically**

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict)
- **Real-time**: Liveblocks (Yjs CRDT)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: NextAuth v5 (GitHub OAuth, optional)
- **Storage**: GitHub (user's repos)
- **PDF Generation**: GitHub Actions + Python/ReportLab
- **UI**: ShadCN + Tailwind + **Neobrutalist Design**
- **Editor**: Lexical

## Architecture

```
src/
├── app/api/           # REST APIs (sessions, share, billing, github, liveblocks-auth)
├── components/
│   ├── editor/        # HotpressEditor, SharedSessionView, toolbar, cursors
│   ├── ui/            # Neobrutalist design system (brutal-*)
│   ├── dashboard/     # Project cards, folder picker
│   ├── format/        # Format config panels
│   └── layout/        # Headers, sidebars
└── lib/
    ├── db/schema.ts   # Drizzle schema (users, sessions, projects, documents)
    ├── auth.ts        # NextAuth v5 + GitHub OAuth
    ├── liveblocks.ts  # Real-time collaboration (Yjs CRDT)
    ├── github.ts      # Octokit integration
    ├── session.ts     # Ephemeral session management
    └── format-schema.ts # Output format configs (book/article/thread)
```

**Key Tables:** `writingSessions` (ephemeral), `projects` (GitHub-backed), `documents` (versioned), `liveblocksRooms`

**Data Flow:** Anonymous session → auto-save to DB → optional GitHub export → format schema → PDF generation

## Design System: Neobrutalism

Inspired by Gumroad and neobrutalism.dev. Key principles:

```css
/* Core brutal styling */
.brutal {
  border: 3px solid black;
  box-shadow: 4px 4px 0 black;
  transition: all 0.1s ease;
}
.brutal:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 black;
}
.brutal:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 black;
}
```

**Color Palette:**
- Black: `#000000` (borders, text)
- White: `#FFFFFF` (backgrounds)
- Yellow: `#FFE75C` (primary accent)
- Blue: `#0066FF` (links, secondary)
- Pink: `#FF66B2` (highlights)
- Green: `#00FF66` (success)
- Red: `#FF3333` (destructive)

**Typography:**
- Bold, chunky headings
- Clean body text
- No rounded corners (or max 4px)
- Everything feels tactile and physical

## Key Differentiators

1. **Start writing immediately** - No signup required to use the editor
2. **Real-time collaboration** - Write with your team, see their cursors
3. **Live output** - PDF regenerates on every save
4. **You own your content** - Files live in your GitHub repo
5. **Any format** - Books, articles, threads, newsletters, docs

## Landing Page

The homepage IS the editor. Visitors land and can start writing immediately without signing up.

**Copy voice**: Direct, not corporate. Gumroad energy. No fluff.

**Headline**: "Write together. Publish instantly."
**Subheadline**: "Books, articles, threads. Collaborative writing with live output. Your content, your format."

## Content Types

| Type | Primary Output | Secondary Outputs | Status |
|------|----------------|-------------------|--------|
| `book` | PDF | ePub, Kindle, HTML | MVP |
| `article` | HTML | Markdown, Medium, Substack | v2 |
| `thread` | Platform posts | Twitter/X, LinkedIn, Bluesky | v3 |
| `newsletter` | Email HTML | Markdown | v3 |
| `docs` | Static site | Markdown, HTML | v4 |

## Pricing Model

| Tier | Price | Sessions | Collaborators |
|------|-------|----------|---------------|
| Free | $0 | 3 | 0 |
| Pro | $12/mo | Unlimited | 5/session |
| Team | $29/mo | Unlimited | Unlimited |

## Development Notes

### Environment Variables
```
DATABASE_URL=
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=
STRIPE_PRICE_TEAM=
LIVEBLOCKS_SECRET_KEY=
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY_PATH=
```

### GitHub OAuth Scopes
- `repo` - Full access to private repos (for reading/writing content)
- `user:email` - Get user email for account

### Database
Local dev uses Docker:
```bash
docker compose up -d
pnpm db:generate
pnpm db:migrate
```

### Drizzle Commands
```bash
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
```

## URL Structure

```
/                           Homepage = Editor (ephemeral session)
/s/:shareSlug               Shared session (may require password)
/sessions                   User's sessions (auth required)
/sessions/:sessionId        Session settings/details
/projects                   Legacy projects (GitHub-connected)
/pricing                    Pricing page
/docs                       API documentation
```

## Quality Standards

- Zero TypeScript errors
- Zero ESLint warnings
- All pages responsive
- All interactive elements accessible
- Loading states for all async operations
- Proper error handling with user feedback
- Neobrutalist styling consistent throughout
