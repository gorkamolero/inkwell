# Inkwell - Collaborative Writing Platform

## Vision
"Own your writing. Version control for everyone."

A SaaS collaborative writing platform where GitHub is the storage backend. Users own their content in their own repositories - no vendor lock-in.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict)
- **UI**: ShadCN UI + Tailwind CSS + **Neobrutalist Design**
- **Editor**: shadcn-editor (Lexical-based)
- **Auth**: NextAuth.js v5 (GitHub + Google OAuth)
- **Database**: PostgreSQL + **Drizzle ORM**
- **Payments**: Stripe
- **Storage**: GitHub API (user's own repos)
- **Deployment**: Vercel

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

1. **You own your content** - Files live in your GitHub repo, not our servers
2. **Version history included** - Full git history for every document
3. **No lock-in** - Standard markdown files, export anytime
4. **Try before signup** - Live editor on homepage, no account required

## Landing Page

The homepage features a LIVE, FUNCTIONAL editor that visitors can use without signing up. This lets them experience the product immediately.

**Copy voice**: Bold, direct, slightly irreverent (like Gumroad). No corporate fluff.

## Architecture Decisions

### Why Drizzle over Prisma?
- Type-safe SQL that feels like writing SQL
- Lighter weight, faster
- Better edge compatibility
- User preference

### Why GitHub as Backend?
- Users already trust GitHub with their code
- Free, reliable storage with CDN
- Built-in version control
- Collaboration via GitHub's model
- Zero storage costs for us

### Why Lexical Editor?
- Modern, performant editor framework
- Extensible for future features
- Good markdown roundtrip support
- Active development by Meta

## Pricing Model

| Tier | Price | Projects | Docs/Project | Collaborators |
|------|-------|----------|--------------|---------------|
| Free | $0 | 3 | 10 | 0 |
| Pro | $12/mo | Unlimited | Unlimited | 5/project |
| Team | $29/mo | Unlimited | Unlimited | Unlimited |

## Development Notes

### Environment Variables
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=
STRIPE_PRICE_TEAM=
```

### GitHub OAuth Scopes
- `repo` - Full access to private repos (for reading/writing content)
- `user:email` - Get user email for account

### Database
Local dev uses Docker:
```bash
docker-compose up -d postgres
pnpm db:generate
pnpm db:migrate
```

### Drizzle Commands
```bash
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
```

## Multi-Book Repo Support

Inkwell supports two repo structures:

**Single-Book Repo** (e.g., `single-book-test-repo`):
- One book per repo
- Chapters in root or a `chapters/` folder
- `chaptersPath`: `"chapters"` or `""`

**Multi-Book Repo** (e.g., `multi-book-test-repo`):
- Multiple books in subfolders
- Each book has its own chapters path
- When connecting, show Book Selector UI
- Each selected book becomes its own project

Example - `multi-book-test-repo` repo:
```
multi-book-test-repo/
  book-a/output/chapters/*.md  → Project "Book A Tantra"
  book-b/output/chapters/*.md → Project "Book B Tantra"
```

## Acceptance Testing

The app MUST be tested against real repos before deployment:

| Test | Repo | Expected Result |
|------|------|-----------------|
| Single-book detection | `gorkamolero/single-book-test-repo` | Detect as single-book, list chapters |
| Multi-book detection | `gorkamolero/multi-book-test-repo` | Detect both Book A and Book B |
| Book selector UI | `multi-book-test-repo` | Show selector, create correct projects |
| Editor save | Any | Save to GitHub, verify commit |

Use `GITHUB_TOKEN` from environment for testing.

## Quality Standards

- Zero TypeScript errors
- Zero ESLint warnings
- All pages responsive
- All interactive elements accessible
- Loading states for all async operations
- Proper error handling with user feedback
- Neobrutalist styling consistent throughout
- **All acceptance tests must pass**
