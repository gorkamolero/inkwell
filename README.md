# Hotpress

**Write together. Publish instantly.**

Collaborative writing with live output. Books, articles, threads. Your content, your format. PDF regenerates on every save.

## What is Hotpress?

Hotpress is a collaborative writing platform where the output is always ready. Write a book, article, or thread with your team. PDF regenerates on every save. Your content stays yours (GitHub-backed).

## Features

- **Real-time Collaboration** - Write with your team, see their cursors. Powered by Liveblocks.
- **Live Output** - PDF regenerates automatically on every save
- **You Own It** - Content saved to your GitHub repo. No vendor lock-in.
- **Any Format** - Books, articles, threads, newsletters, docs
- **API-First** - SDK for automation. Claude-ready for AI editing.
- **No Signup Required** - Start writing immediately. Sign up when you're ready.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict)
- **Real-time**: Liveblocks (Yjs CRDT)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: NextAuth v5 (GitHub OAuth, optional)
- **Storage**: GitHub (user's repos)
- **PDF Generation**: GitHub Actions + Python/ReportLab
- **UI**: ShadCN + Tailwind + Neobrutalist design
- **Editor**: Lexical

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local PostgreSQL)

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/hotpress.git
   cd hotpress
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start the database**

   ```bash
   docker compose up -d
   ```

   This starts PostgreSQL on port 5432 and Adminer (database UI) on port 8080.

4. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and fill in your values:
   - Generate `AUTH_SECRET` with: `openssl rand -base64 32`
   - Create GitHub OAuth app at https://github.com/settings/developers
   - Create Stripe account and get API keys

5. **Run database migrations**

   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

6. **Start the development server**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Management

```bash
# Generate migration files from schema changes
pnpm db:generate

# Run pending migrations
pnpm db:migrate

# Open Drizzle Studio for database browsing
pnpm db:studio
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AUTH_SECRET` | NextAuth.js secret key | Yes |
| `AUTH_GITHUB_ID` | GitHub OAuth client ID | Yes |
| `AUTH_GITHUB_SECRET` | GitHub OAuth client secret | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes |
| `STRIPE_PRICE_PRO` | Stripe Price ID for Pro plan | Yes |
| `STRIPE_PRICE_TEAM` | Stripe Price ID for Team plan | Yes |
| `LIVEBLOCKS_SECRET_KEY` | Liveblocks secret for real-time | Yes |

See `.env.example` for the complete list with documentation.

## Design System

Hotpress uses a **Neobrutalist** design system inspired by Gumroad's aesthetic:

- Bold 3-4px black borders
- Offset box shadows (4px right, 4px down)
- High contrast colors: black, white, yellow accent
- Hover: elements "lift" with expanded shadow
- Active: elements "press" with reduced shadow
- No rounded corners, no gradients

### Key Colors

- **Primary**: `#FFE75C` (Yellow)
- **Secondary**: `#0066FF` (Blue)
- **Accent Pink**: `#FF66B2`
- **Success**: `#00FF66`
- **Error**: `#FF3333`

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Self-Hosted

1. Build the application:
   ```bash
   pnpm build
   ```

2. Start with:
   ```bash
   pnpm start
   ```

Make sure to set up:
- PostgreSQL database
- Environment variables
- Stripe webhook endpoint
- Liveblocks configuration

## License

MIT License - see [LICENSE](LICENSE) for details.
