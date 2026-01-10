# Inkwell

A collaborative writing platform for modern teams. Create beautiful documents, sync with GitHub, and ship content faster.

## Features

- **Real-time Collaboration** - Work together with your team in real-time
- **GitHub Sync** - Two-way sync with GitHub repositories for version control
- **Rich Text Editor** - Powerful Lexical-based editor with markdown support
- **Version History** - Track changes and restore previous versions
- **Team Workspaces** - Organize projects with collaborators
- **Subscription Tiers** - Free, Pro, and Team plans with Stripe billing

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with Neobrutalist design system
- **Editor**: Lexical
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js v5 with GitHub/Google OAuth
- **Payments**: Stripe

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local PostgreSQL)

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/inkwell.git
   cd inkwell
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
   - Set up Google OAuth (optional)

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
| `AUTH_GOOGLE_ID` | Google OAuth client ID | No |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | No |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes |
| `STRIPE_PRICE_PRO` | Stripe Price ID for Pro plan | Yes |
| `STRIPE_PRICE_TEAM` | Stripe Price ID for Team plan | Yes |

See `.env.example` for the complete list with documentation.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages (login, signup)
│   ├── (dashboard)/       # Dashboard pages (projects, settings)
│   ├── (editor)/          # Document editor
│   ├── (marketing)/       # Public marketing pages
│   └── api/               # API routes
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   ├── editor/            # Editor components (Lexical)
│   ├── layout/            # Layout components (header, sidebar)
│   ├── marketing/         # Marketing page components
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
│   ├── db/               # Database schema and client
│   ├── auth.ts           # NextAuth configuration
│   ├── github.ts         # GitHub API integration
│   └── stripe.ts         # Stripe integration
└── types/                 # TypeScript type definitions
```

## Design System

Inkwell uses a **Neobrutalist** design system inspired by Gumroad's aesthetic:

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

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.
