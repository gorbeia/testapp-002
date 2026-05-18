# Txosnabai

Web application for managing food and drink stalls (_txosnak_) at festivals. Multitenant, self-service, with online payments and Spanish TicketBAI fiscal invoicing.

## Quick Start

```bash
pnpm install
cp .env.example .env   # defaults run in memory mode — no database needed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Use the credentials in [`DEMO.md`](DEMO.md).

## Documentation

**[docs/index.md](docs/index.md)** — start here. Maps every documentation file and explains the application architecture.

Key links:

- [Local development guide](docs/local-development.md) — setup, environment variables, storage modes
- [Domain model](docs/domain-model.md) — entities, lifecycle states, relationships
- [API reference](docs/api-reference.md) — all 46 endpoints
- [Production deployment](docs/ubuntu-vps-install.md) — VPS install guide

## Testing

```bash
pnpm test               # Vitest unit tests
pnpm test:integration   # Cucumber integration tests (no server needed)
pnpm lint && pnpm typecheck && pnpm format:check   # code quality (matches pre-push hook)
```

## Tech Stack

Next.js 16 · React 19 · TypeScript 5 · Prisma 7 · PostgreSQL · NextAuth 5 · next-intl 4 · Tailwind 4 · Vitest · Cucumber + Playwright
