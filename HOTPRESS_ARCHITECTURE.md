# Hotpress Architecture Document

> Transforming Inkwell into Hotpress: Collaborative writing with live output.

## Overview

**Hotpress** is a collaborative writing platform where the output is always ready. Write a book, article, or thread with your team. PDF regenerates on every save. Your content stays yours (GitHub-backed).

### Core Philosophy

1. **Land → Write immediately** (no auth required)
2. **Collaborate in real-time** (Liveblocks)
3. **Save to GitHub when ready** (you own your data)
4. **Configure formatting via schema** (API-driven)
5. **PDF regenerates automatically**

### API-First Design

The UI is one client. SDK and Claude skills are others. Everything goes through the API.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Real-time | Liveblocks (Yjs CRDT) |
| Database | PostgreSQL + Drizzle ORM |
| Auth | NextAuth v5 (GitHub OAuth, optional) |
| Storage | GitHub (user's repos) |
| PDF Generation | GitHub Actions + Python/ReportLab |
| UI | ShadCN + Tailwind + Neobrutalist design |
| Editor | Lexical (from shadcn-editor) |

---

## Database Schema

### New Tables

```sql
-- Sessions (primary content table)
CREATE TABLE writing_sessions (
  id              TEXT PRIMARY KEY,        -- CUID, also Liveblocks room ID
  share_slug      TEXT UNIQUE,             -- e.g., "abc123xyz"
  title           TEXT,
  type            TEXT DEFAULT 'book',     -- book, article, thread, newsletter, docs
  content         TEXT,                    -- Lexical JSON or markdown
  format_config   JSONB,                   -- hotpress.yaml as JSON
  password_hash   TEXT,                    -- bcrypt, optional
  owner_id        TEXT REFERENCES users,   -- NULL for anonymous
  github_repo     TEXT,                    -- NULL until saved
  github_path     TEXT,
  last_github_sha TEXT,
  expires_at      TIMESTAMP,               -- for ephemeral cleanup
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Liveblocks room metadata
CREATE TABLE liveblocks_rooms (
  id              TEXT PRIMARY KEY,
  session_id      TEXT REFERENCES writing_sessions,
  room_name       TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

### Keep from Inkwell

- `users` - NextAuth users
- `accounts` - OAuth tokens (GitHub access_token)
- `subscriptions` - Stripe billing

### Deprecate

- `projects` - replaced by sessions
- `documents` - content in sessions
- `project_collaborators` - replaced by Liveblocks

---

## Content Types

### Supported Types

| Type | Primary Output | Secondary Outputs | Status |
|------|----------------|-------------------|--------|
| `book` | PDF | ePub, Kindle, HTML | MVP |
| `article` | HTML | Markdown, Medium, Substack | v2 |
| `thread` | Platform posts | Twitter/X, LinkedIn, Bluesky | v3 |
| `newsletter` | Email HTML | Markdown | v3 |
| `docs` | Static site | Markdown, HTML | v4 |

---

## Format Configuration Schema

### Complete Schema (hotpress.yaml)

```yaml
# Type of content
type: "book"  # book | article | thread | newsletter | docs

# Metadata
meta:
  title: "Book Title"
  subtitle: "Optional Subtitle"
  author: "Author Name"
  series: { name: "Series Name", number: 1 }
  language: "en"
  isbn: "978-..."
  description: "For SEO/social"
  tags: ["tag1", "tag2"]

# Theme preset (optional)
theme:
  preset: "classic-serif"  # or null for custom

# Typography
typography:
  body:
    font: "Cormorant Garamond"
    size: "11pt"
    lineHeight: 1.5
  headings:
    font: "Cinzel"
    size: "18pt"
  paragraph:
    indent: "1.5em"
    spacing: "0"
    firstParagraphIndent: false

# Chapter styling
chapters:
  numbering:
    enabled: true
    format: "Chapter {n}"  # "Chapter {n}", "{n}", "{roman}", "{word}", null
  title:
    font: "Cinzel"
    size: "24pt"
    align: "center"
    transform: "uppercase"
  subtitle:
    enabled: true
    font: "Cormorant Garamond"
    style: "italic"
  startOn: "right"  # right, left, any
  ornament:
    enabled: true
    image: "flourish-01"
    spacing: "1em"

# Drop caps
dropCaps:
  enabled: true
  lines: 3
  font: "Cinzel"
  style: "dropped"  # dropped, raised

# Scene breaks
sceneBreaks:
  ornament: "three-asterisks"
  customImage: null
  spacing: "2em"

# Headers (print)
headers:
  enabled: true
  left: "{author}"
  right: "{title}"
  font: "Cormorant Garamond"
  size: "9pt"
  transform: "uppercase"
  hideOnChapterStart: true

# Footers (print)
footers:
  enabled: true
  pageNumber:
    position: "center"
    format: "{n}"
  ornament: null

# Page layout
page:
  size: "6x9"
  width: "6in"
  height: "9in"
  margins:
    top: "0.75in"
    bottom: "0.75in"
    outer: "0.625in"
    gutter: "0.875in"

# Front matter
frontMatter:
  - type: "halfTitle"
  - type: "title"
    includeSubtitle: true
    includeAuthor: true
  - type: "copyright"
    template: "fiction"
  - type: "dedication"
    content: "For those who dare to write."
    align: "center"
  - type: "epigraph"
    quote: "The first draft is just you telling yourself the story."
    attribution: "Terry Pratchett"
  - type: "toc"
    depth: 1

# Back matter
backMatter:
  - type: "epilogue"
  - type: "acknowledgements"
    content: "..."
  - type: "aboutAuthor"
    content: "..."
    image: "author.jpg"
  - type: "alsoBy"
    books:
      - title: "Previous Book"
        link: "https://..."

# Special elements
elements:
  blockquote:
    font: "inherit"
    style: "italic"
    indent: "2em"
  verse:
    font: "inherit"
    style: "italic"
    align: "left"
  callout:
    enabled: true
    border: "2px solid black"
    background: "#f5f5f5"
  footnotes:
    style: "bottom"
    numbering: "1"

# Image settings
images:
  inline:
    maxWidth: "80%"
    align: "center"
  fullPage:
    bleed: false
  caption:
    font: "inherit"
    size: "9pt"
    style: "italic"

# Output settings
output:
  formats: ["pdf", "epub"]
  pdf:
    colorProfile: "CMYK"
    bleed: "0.125in"
  epub:
    coverImage: "cover.jpg"
    tocDepth: 2

# Type-specific settings (for future types)
article:
  platform: "web"
  featuredImage: "cover.jpg"
  toc: true

thread:
  platform: "twitter"
  splitStrategy: "paragraph"
  maxLength: 280
  numbering: true

newsletter:
  platform: "resend"
  subject: "{{title}}"
  preheader: "Preview text"
```

### MVP Subset

For v1, implement only:
- `meta` (title, author)
- `typography` (body font, heading font, size)
- `chapters` (numbering, drop caps on/off)
- `page` (size presets)
- `frontMatter` (title, copyright, dedication, toc)
- `backMatter` (aboutAuthor, alsoBy)
- `output.formats: ["pdf"]`

---

## API Routes

### Session API
```
POST   /api/sessions                    Create new session
GET    /api/sessions/:id                Get session
PATCH  /api/sessions/:id                Update session (content, title, type)
DELETE /api/sessions/:id                Delete session
POST   /api/sessions/:id/claim          Link anonymous session to user
```

### Share API
```
GET    /api/share/:slug                 Get shared session (public)
POST   /api/share/:slug/verify          Verify password
POST   /api/sessions/:id/share          Generate share link
```

### Format API
```
GET    /api/sessions/:id/format         Get format config
PUT    /api/sessions/:id/format         Update format config
GET    /api/format/presets              List available presets/themes
GET    /api/format/fonts                List available fonts
GET    /api/format/ornaments            List available ornaments
```

### Generate API
```
POST   /api/sessions/:id/generate/pdf   Trigger PDF generation
POST   /api/sessions/:id/generate/epub  Trigger ePub generation
GET    /api/sessions/:id/generate/status  Check generation status
GET    /api/sessions/:id/preview        Get preview
```

### GitHub API
```
POST   /api/sessions/:id/save-to-github Save session to repo
GET    /api/sessions/:id/github/history Git commit history
GET    /api/user/repos                  List user's repos (keep from Inkwell)
POST   /api/github/create-repo          Create new repo (keep from Inkwell)
```

### Liveblocks API
```
POST   /api/liveblocks-auth             Room authentication
```

### Billing API (keep from Inkwell)
```
POST   /api/billing/checkout
POST   /api/billing/portal
POST   /api/webhooks/stripe
```

---

## URL Structure

```
/                           Homepage = Editor (ephemeral session)
/s/:shareSlug               Shared session (may require password)
/dashboard                  User's sessions (auth required)
/dashboard/:sessionId       Session settings/details
/dashboard/:sessionId/format  Formatting configuration
/pricing                    Pricing page
/about                      Marketing content (moved from homepage)
/docs                       API documentation
```

---

## Liveblocks Integration

### Client Setup

```typescript
// /src/lib/liveblocks.ts
import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

type Presence = {
  cursor: { x: number; y: number } | null;
  name: string;
  color: string;
};

export const {
  RoomProvider,
  useRoom,
  useOthers,
  useMyPresence,
  useSelf,
} = createRoomContext<Presence>(client);
```

### Auth Endpoint

```typescript
// /src/app/api/liveblocks-auth/route.ts
export async function POST(req: Request) {
  const { sessionId } = await req.json();

  // Verify session exists
  const session = await getSession(sessionId);
  if (!session) return new Response("Not found", { status: 404 });

  // Check password if protected
  // ...

  const liveblocksSession = liveblocks.prepareSession(
    userId || `anon-${nanoid()}`
  );
  liveblocksSession.allow(`session-${sessionId}`, session.full_access);

  const { body, status } = await liveblocksSession.authorize();
  return new Response(body, { status });
}
```

### Editor Integration

```typescript
// Lexical + Liveblocks Y.js binding
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import * as Y from "yjs";

function SessionEditor({ sessionId }) {
  return (
    <RoomProvider id={`session-${sessionId}`}>
      <LexicalComposer>
        <CollaborationPlugin
          providerFactory={(id, yjsDocMap) => {
            const doc = new Y.Doc();
            yjsDocMap.set(id, doc);
            return new LiveblocksYjsProvider(room, doc);
          }}
        />
        {/* Other plugins */}
      </LexicalComposer>
    </RoomProvider>
  );
}
```

---

## Auth Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         ANONYMOUS                            │
│  Land on / → Get session cookie → Write → Share              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ [Save to GitHub] or [Dashboard]
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      GITHUB OAUTH                            │
│  Redirect to GitHub → Authorize → Return with token          │
│  Session claimed: owner_id set to user.id                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       AUTHENTICATED                          │
│  Dashboard shows all owned sessions                          │
│  Can save to GitHub, access billing, etc.                    │
└─────────────────────────────────────────────────────────────┘
```

### Session Cookie Management

```typescript
// /src/lib/session.ts
const SESSION_COOKIE = "hp_session";

export async function getOrCreateSession(req: Request): Promise<Session> {
  const cookieStore = cookies();
  const existingId = cookieStore.get(SESSION_COOKIE)?.value;

  if (existingId) {
    const session = await db.query.writingSessions.findFirst({
      where: eq(writingSessions.id, existingId)
    });
    if (session) return session;
  }

  // Create new ephemeral session
  const newSession = await createSession();
  cookieStore.set(SESSION_COOKIE, newSession.id, {
    httpOnly: true,
    secure: true,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return newSession;
}
```

---

## GitHub Save Flow

```
User clicks [Save to GitHub]
          │
          ▼
    ┌─────────────┐
    │ Logged in?  │──No──→ GitHub OAuth → Return
    └─────────────┘
          │ Yes
          ▼
    ┌─────────────────────────────────────┐
    │  Select repo or create new          │
    └─────────────────────────────────────┘
          │
          ▼
    ┌─────────────────────────────────────┐
    │  Choose path                        │
    └─────────────────────────────────────┘
          │
          ▼
    ┌─────────────────────────────────────┐
    │  Commit to GitHub                   │
    │  - content as markdown              │
    │  - hotpress.yaml                    │
    │  - Update session record            │
    └─────────────────────────────────────┘
          │
          ▼
    ┌─────────────────────────────────────┐
    │  GitHub Action triggers             │
    │  - Reads hotpress.yaml              │
    │  - Generates PDF                    │
    │  - Commits PDF to repo              │
    └─────────────────────────────────────┘
```

---

## PDF Pipeline

### Repository Structure (Template)

```
my-book/
├── content/
│   └── book.md           # or chapters/*.md
├── hotpress.yaml         # formatting config
├── assets/
│   ├── cover.jpg
│   └── author.jpg
├── .github/
│   └── workflows/
│       └── generate-pdf.yml
└── output/
    └── book.pdf          # generated
```

### GitHub Action

```yaml
# .github/workflows/generate-pdf.yml
name: Generate PDF

on:
  push:
    paths:
      - 'content/**'
      - 'hotpress.yaml'
      - 'assets/**'
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install reportlab pyyaml markdown

      - name: Generate PDF
        run: python scripts/generate-pdf.py

      - name: Commit PDF
        run: |
          git config user.name "Hotpress Bot"
          git config user.email "bot@hotpress.app"
          git add output/
          git commit -m "Regenerate PDF" || exit 0
          git push
```

---

## SDK Architecture

### Package Structure

```
@hotpress/sdk
├── src/
│   ├── client.ts         # Main client
│   ├── sessions.ts       # Session operations
│   ├── format.ts         # Formatting operations
│   ├── generate.ts       # PDF/ePub generation
│   ├── github.ts         # GitHub operations
│   └── types.ts          # TypeScript types
```

### Client API

```typescript
import { Hotpress } from '@hotpress/sdk';

const client = new Hotpress({
  apiKey: process.env.HOTPRESS_API_KEY,
});

// Sessions
const session = await client.sessions.create({ title: 'My Book' });
await client.sessions.update(sessionId, { content: '...' });

// Formatting
await client.format.update(sessionId, {
  typography: { body: { font: 'Garamond' } },
  chapters: { dropCaps: { enabled: true } },
});

// Generation
const { jobId } = await client.generate.pdf(sessionId);
const pdfUrl = await client.generate.download(jobId);

// GitHub
await client.github.save(sessionId, {
  repo: 'user/my-book',
  path: 'book.md',
});
```

---

## Landing Page

### Structure

```
HEADER:     Logo | [About] [Pricing] [Login/Dashboard]

HERO:       "Write together. Publish instantly."
            "Books, articles, threads — collaborative writing with live output."

            ┌────────────────────────────────────────┐
            │                                        │
            │     Start writing your book...         │  ← LIVE EDITOR
            │                                        │
            ├────────────────────────────────────────┤
            │  📚 Book ▼  │  0 words  │  [Share]     │
            └────────────────────────────────────────┘

HOW IT WORKS:
            1. WRITE    →  2. FORMAT    →  3. PUBLISH
            Real-time      Configure       PDF, ePub,
            collaboration  your style      web, social

FEATURES:   6 cards
            - Real-time Collaboration
            - Live Output (PDF on save)
            - You Own It (GitHub-backed)
            - Any Format (book, article, thread)
            - API-First (SDK for automation)
            - Claude-Ready (AI editing)

USE CASES:  [Books] [Articles] [Threads] tabs

PRICING:    Free / Pro ($12) / Team ($29)

FAQ:        Accordion

FINAL CTA:  "Ready to write something?" → scroll to editor

FOOTER:     Links
```

### Copy

**Headline:** Write together. Publish instantly.

**Subheadline:** Books, articles, threads — collaborative writing with live output. Your content, your format.

**How It Works:**
1. **Write** — Real-time collaboration. Write with your team, see their cursors.
2. **Format** — Configure your output. Fonts, chapters, drop caps — or let us handle it.
3. **Publish** — One click to PDF, ePub, web, or social.

### Design

Neobrutalist styling:
- 3px black borders
- 4px offset shadows
- Bold/chunky typography
- Colors: Black, White, Yellow (#FFE75C), Blue (#0066FF), Pink (#FF66B2)
- No rounded corners (max 4px)

---

## File Changes

### Add

```
/src/lib/session.ts                     # Session management
/src/lib/liveblocks.ts                  # Liveblocks client
/src/lib/format-schema.ts               # Format config types/validation

/src/app/api/sessions/route.ts
/src/app/api/sessions/[id]/route.ts
/src/app/api/sessions/[id]/claim/route.ts
/src/app/api/sessions/[id]/share/route.ts
/src/app/api/sessions/[id]/format/route.ts
/src/app/api/sessions/[id]/generate/route.ts
/src/app/api/sessions/[id]/save-to-github/route.ts
/src/app/api/share/[slug]/route.ts
/src/app/api/share/[slug]/verify/route.ts
/src/app/api/liveblocks-auth/route.ts
/src/app/api/format/presets/route.ts

/src/app/s/[slug]/page.tsx              # Shared session view

/src/app/dashboard/page.tsx             # User sessions list
/src/app/dashboard/[id]/page.tsx        # Session detail
/src/app/dashboard/[id]/format/page.tsx # Formatting UI

/src/components/editor/SessionEditor.tsx
/src/components/editor/CollaboratorCursors.tsx
/src/components/editor/PresenceAvatars.tsx
/src/components/share/ShareDialog.tsx
/src/components/share/PasswordGate.tsx
/src/components/format/FormatPanel.tsx
/src/components/format/TypographySection.tsx
/src/components/format/ChapterSection.tsx
/src/components/format/PageLayoutSection.tsx
/src/components/format/PreviewPane.tsx
/src/components/github/SaveToGitHubDialog.tsx
/src/components/landing/Hero.tsx        # New hero with editor
/src/components/landing/HowItWorks.tsx  # New how it works
/src/components/landing/Features.tsx    # New features
/src/components/landing/UseCases.tsx    # New use cases
/src/components/landing/FAQ.tsx         # New FAQ
```

### Modify

```
/src/lib/db/schema.ts                   # Add writing_sessions, liveblocks_rooms
/src/lib/auth.ts                        # Make auth optional
/src/middleware.ts                      # Remove protected routes
/src/app/(marketing)/page.tsx           # Editor-first homepage
/src/app/(marketing)/layout.tsx         # Minimal chrome
/src/components/editor/editor.tsx       # Add Liveblocks binding
```

### Delete

```
/src/app/(dashboard)/projects/          # Entire folder
/src/app/(auth)/login/                  # Login page
/src/app/(auth)/signup/                 # Signup page
/src/app/api/projects/                  # Entire folder
/src/app/api/documents/                 # Entire folder
/src/components/marketing/Hero.tsx      # Old hero (replace)
/src/components/marketing/LiveEditorDemo.tsx  # Merge into new homepage
/src/components/marketing/Features.tsx  # Old features (replace)
/src/components/marketing/HowItWorks.tsx # Old (replace)
/src/components/marketing/PainPoints.tsx # Remove
/src/components/dashboard/ProjectCard.tsx # Replace with SessionCard
```

---

## MVP Scope

### Phase 1: Core Session Flow
- [ ] New DB schema (writing_sessions, liveblocks_rooms)
- [ ] Session API (create, get, update)
- [ ] Homepage becomes editor
- [ ] Auto-create session on first keystroke
- [ ] Basic auto-save to DB

### Phase 2: Real-time Collaboration
- [ ] Liveblocks integration
- [ ] Lexical + Y.js binding
- [ ] Presence (cursors, avatars)
- [ ] Share link generation

### Phase 3: GitHub Save
- [ ] Save to GitHub flow
- [ ] Repo picker / create
- [ ] Commit content + hotpress.yaml

### Phase 4: Basic Formatting
- [ ] Format config schema (MVP subset)
- [ ] Format API endpoints
- [ ] Simple format UI (fonts, chapters, page size)
- [ ] PDF generation pipeline

### Phase 5: Polish
- [ ] Password protection for shares
- [ ] Dashboard for owned sessions
- [ ] Claim anonymous session
- [ ] Landing page marketing sections
- [ ] E2E tests

---

## Branding

**Name:** Hotpress

**Tagline:** Write together. Publish instantly.

**Domain:** TBD (hotpress.app, hotpress.io, etc.)

**Logo:** "HOTPRESS" in bold neobrutalist style, optional flame/press icon

**Voice:** Direct, not corporate. Gumroad energy. No fluff.
