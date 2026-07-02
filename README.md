# Hotpress

**Write together. Publish instantly.**

A collaborative writing platform where your book is always ready. Real-time editing with your team, professional PDF/EPUB exports, and complete creative control over typography and layout.

[Live Demo](https://hotpress.app) · [Documentation](#getting-started)

## Why Hotpress?

Traditional publishing tools make you choose: collaborate OR format. Hotpress does both. Write with your team in real-time while your book stays print-ready. Every save, every keystroke—your PDF regenerates automatically.

**No signup required.** Start writing immediately. Create an account when you're ready to save.

## Features

### Real-time Collaboration
- **Live cursors** — See collaborators typing in real-time with colored cursors and names
- **Conflict-free editing** — Yjs CRDT ensures no overwrites, ever
- **Presence awareness** — Know who's in your document
- **Powered by Liveblocks** — Enterprise-grade collaboration infrastructure

### Professional Publishing

#### Export Formats
- **PDF** — Print-ready with CMYK color profiles, bleed marks, trim marks, and PDF/X-4 output
- **EPUB** — Standard ebook format with configurable TOC depth and cover images

#### 20+ Typography Templates
- **Serif classics** — Cormorant Garamond, EB Garamond, Libre Baskerville, Merriweather
- **Modern sans** — Inter, Roboto, Source Sans Pro, Exo 2
- **Accessible** — Atkinson Hyperlegible, OpenDyslexic
- **Genre-specific** — Templates optimized for fiction, non-fiction, technical writing

#### Complete Format Control
- **Page sizes** — 6×9, 5.5×8.5, 5×8, A5, US Letter, or custom dimensions
- **Margins** — Standard, Wide, Narrow presets or pixel-perfect custom margins
- **Chapter styles** — Numbered (1, I, One), drop caps (2-5 lines), custom title fonts
- **Scene breaks** — Asterisks, dots, dashes, fleurons, asterisms, dinkus, or blank space
- **Headers/Footers** — Per-page templates with author, title, chapter, page numbers
- **Front matter** — Half title, title page, copyright, dedication, epigraph, TOC, preface, foreword
- **Back matter** — Epilogue, acknowledgements, about the author, also by, glossary, appendix

### Version Control
- **Git-backed** — Full commit history via GitHub integration
- **One-click restore** — Browse and restore any previous version
- **No vendor lock-in** — Your content lives in your GitHub repo

### Document Types
- Books (chapters, front/back matter)
- Articles (blog posts, essays)
- Threads (social media content)

## Pricing

### Free Forever — $0
Everything you need to write and publish:
- ✓ Unlimited writing & real-time collaboration
- ✓ Unlimited projects
- ✓ Unlimited PDF/EPUB exports
- ✓ Basic templates
- ✓ "Made with Hotpress" footer on exports

### Creator — $12.99 per book
Professional publishing for your book:
- ✓ Clean exports (no watermark)
- ✓ Print-ready CMYK with bleed marks
- ✓ All premium templates
- ✓ Unlimited exports forever
- One-time purchase, yours to keep

### Pro — $39.99/year
For authors who publish regularly:
- ✓ Clean exports on ALL projects
- ✓ All premium templates
- ✓ CMYK print-ready on everything
- ✓ GitHub sync for manuscript versioning
- ✓ No per-book fees ever

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Real-time | Liveblocks (Yjs CRDT) |
| Editor | Lexical |
| Database | PostgreSQL + Drizzle ORM |
| Auth | NextAuth v5 (GitHub OAuth) |
| Payments | Stripe |
| PDF | React-PDF |
| Storage | GitHub (user repos) |
| UI | Tailwind + Neobrutalist design system |

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL (Docker or hosted)

### Quick Start

```bash
# Clone
git clone https://github.com/gorkamolero/inkwell.git
cd inkwell

# Install
pnpm install

# Database (Docker)
docker compose up -d

# Environment
cp .env.example .env.local
# Edit .env.local with your values

# Migrate
pnpm db:migrate

# Run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth secret (`openssl rand -base64 32`) |
| `AUTH_GITHUB_ID` | GitHub OAuth client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth client secret |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PRICE_CREATOR_BOOK` | Stripe Price ID for Creator tier |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL` | Stripe Price ID for Pro tier |
| `LIVEBLOCKS_SECRET_KEY` | Liveblocks secret key |
| `ADMIN_USER_IDS` | Comma-separated user ids (`users.id`) allowed to call `/api/admin/*`. Unset or empty = no admins (fail closed) |

### Scripts

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # Biome linting
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Database browser
```

## Design System

Hotpress uses a **Neobrutalist** design language:

```css
.brutal {
  border: 3px solid black;
  box-shadow: 4px 4px 0 black;
}
```

### Colors
| Name | Hex | Usage |
|------|-----|-------|
| Yellow | `#FFE75C` | Primary accent |
| Blue | `#0066FF` | Links, actions |
| Pink | `#FF66B2` | Highlights |
| Green | `#00FF66` | Success states |
| Red | `#FF3333` | Errors, warnings |

### Principles
- Bold 3-4px black borders
- Hard drop shadows (no blur)
- High contrast
- No rounded corners
- No gradients
- Hover: elements "lift" with expanded shadow
- Active: elements "press" with reduced shadow

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Set environment variables
4. Deploy

For preview deployments with OAuth, set `AUTH_REDIRECT_PROXY_URL` to your production domain (e.g., `https://auth.yourdomain.com`).

### Self-Hosted

```bash
pnpm build
pnpm start
```

Ensure you configure:
- PostgreSQL database
- Environment variables
- Stripe webhook endpoint (`/api/webhooks/stripe`)
- Liveblocks authentication

## API

### Sessions
- `POST /api/sessions` — Create new writing session
- `GET /api/sessions/[id]` — Get session content
- `PUT /api/sessions/[id]` — Update session content
- `DELETE /api/sessions/[id]` — Delete session
- `POST /api/sessions/[id]/claim` — Claim anonymous session
- `GET /api/sessions/[id]/generate` — Generate PDF
- `GET /api/sessions/[id]/epub` — Generate EPUB

### Projects
- `GET /api/projects` — List user projects
- `POST /api/projects` — Create project
- `GET /api/projects/[id]` — Get project
- `PUT /api/projects/[id]` — Update project
- `DELETE /api/projects/[id]` — Delete project

### Billing
- `POST /api/billing/checkout` — Create Stripe checkout session
- `POST /api/billing/portal` — Create billing portal session
- `POST /api/webhooks/stripe` — Stripe webhook handler

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm lint` (zero warnings policy)
5. Submit a pull request

## License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with 🖤 by [Gorka Molero](https://github.com/gorkamolero)
