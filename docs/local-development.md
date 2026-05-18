# Local Development

## Prerequisites

- **Node.js 22+** (check `.nvmrc` for the pinned version; use `nvm use` if you have nvm)
- **pnpm 10** — `npm install -g pnpm@10`
- **PostgreSQL** — only needed for ORM mode; memory mode requires no database

## Quick Start (Memory Mode — Recommended)

The app runs entirely in memory by default. No database is required.

```bash
git clone <repo-url> && cd txosnabai
pnpm install
cp .env.example .env        # defaults work as-is for memory mode
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and use the credentials from [`DEMO.md`](../DEMO.md).

Data lives in memory and resets on every server restart. This is intentional for development — use `POST /api/demo/reset` to restore the fixture state without restarting.

## Environment Variables

All variables come from `.env.example`. The table below covers the ones you'll need locally.

| Variable                    | Required          | Default                        | Purpose                                                                                                                                      |
| --------------------------- | ----------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `STORAGE_BACKEND`           | No                | `memory`                       | `memory` (in-memory store) or `orm` (Prisma + PostgreSQL). When unset, inferred from `DATABASE_URL`.                                         |
| `DATABASE_URL`              | Only for ORM mode | —                              | PostgreSQL connection string. Omit entirely in memory mode.                                                                                  |
| `AUTH_SECRET`               | Yes               | `change-me-to-a-random-string` | NextAuth v5 signing secret. Any non-empty string works locally. (`NEXTAUTH_SECRET` is also accepted as a fallback.)                          |
| `AUTH_URL` / `NEXTAUTH_URL` | No                | Auto-detected                  | Set to `http://localhost:3000` if auth redirects break.                                                                                      |
| `NEXT_PUBLIC_APP_URL`       | No                | `http://localhost:3000`        | Used for QR codes and public URLs.                                                                                                           |
| `PAYMENT_CREDENTIALS_KEY`   | No                | Zeros (64 hex chars)           | Encryption key for stored Stripe/Redsys credentials. Any 64-char hex string works locally.                                                   |
| `DEMO_RESET_SECRET`         | No                | `demo-reset-secret-change-me`  | Allows calling `POST /api/demo/reset?secret=…` to restore demo data.                                                                         |
| `PROTO_MODE`                | No                | unset                          | Set to `true` to bypass NextAuth session checks in API handlers. Used automatically by `pnpm test:integration`. **Never set in production.** |

## Storage Backends

The storage layer (`src/lib/store/index.ts`) selects a backend at startup:

1. If `STORAGE_BACKEND=memory` (or unset and no `DATABASE_URL`) → in-memory store (`src/lib/store/memory.ts`)
2. If `STORAGE_BACKEND=orm` (or `DATABASE_URL` is set) → Prisma ORM adapter (`src/lib/store/adapters/orm-adapter.ts`)

All API handlers import from `@/lib/store` and never reference the backend directly — swapping backends requires only an environment variable change.

## Running with PostgreSQL (ORM Mode)

If you need the full Prisma + PostgreSQL stack:

**Option A — Docker**

```bash
docker run --name txosnabai-db \
  -e POSTGRES_PASSWORD=txosnabai \
  -e POSTGRES_DB=txosnabai \
  -p 5432:5432 \
  -d postgres:15
```

**Option B — Local PostgreSQL**

```bash
createdb txosnabai
```

Then set these in your `.env`:

```env
STORAGE_BACKEND=orm
DATABASE_URL="postgresql://postgres:txosnabai@localhost:5432/txosnabai"
```

Run migrations:

```bash
pnpm prisma migrate dev    # creates tables and a migration file
pnpm prisma db push        # schema-only push (skips migration history — avoid in production)
pnpm prisma studio         # optional: browse data in a GUI
```

## Running Tests

```bash
pnpm test                  # Vitest unit tests (watch mode)
pnpm test:run              # Vitest unit tests (single run, for CI)
pnpm test:integration      # Cucumber integration tests (PROTO_MODE=true, no server needed)
pnpm test:e2e              # Cucumber E2E tests with Playwright (requires dev server running)
pnpm test:all              # Vitest + Cucumber integration (what CI runs)
```

Unit tests live in `src/**/__tests__/*.test.ts(x)` and use fixtures from `src/lib/fixtures/demo.ts`.
BDD scenarios live in `features/**/*.feature`.

## Code Quality Checks

Run these before every push (the pre-push hook runs the same commands):

```bash
pnpm lint                  # ESLint
pnpm typecheck             # TypeScript strict check
pnpm format:check          # Prettier check

pnpm format                # Auto-fix formatting (run before format:check)
pnpm lint:fix              # Auto-fix ESLint issues
```

## All Scripts

| Script                    | What it does                                          |
| ------------------------- | ----------------------------------------------------- |
| `pnpm dev`                | Start Next.js dev server with hot reload              |
| `pnpm build`              | `prisma generate` + Next.js production build          |
| `pnpm start`              | Start production server (requires `pnpm build` first) |
| `pnpm test`               | Vitest unit tests in watch mode                       |
| `pnpm test:run`           | Vitest single run                                     |
| `pnpm test:ui`            | Vitest with browser UI                                |
| `pnpm test:integration`   | Cucumber integration tests                            |
| `pnpm test:e2e`           | Cucumber E2E tests (Playwright)                       |
| `pnpm test:all`           | Vitest + Cucumber integration                         |
| `pnpm lint`               | ESLint                                                |
| `pnpm lint:fix`           | ESLint auto-fix                                       |
| `pnpm typecheck`          | TypeScript strict type check                          |
| `pnpm format`             | Prettier auto-fix all files                           |
| `pnpm format:check`       | Prettier check (no changes)                           |
| `pnpm prisma generate`    | Regenerate Prisma client after schema changes         |
| `pnpm prisma migrate dev` | Create and apply a new migration                      |
| `pnpm prisma db push`     | Push schema changes without a migration file          |
| `pnpm prisma studio`      | Open Prisma Studio (database GUI)                     |

## Demo Data

Two associations are pre-loaded in memory mode:

- **Demo Elkartea** — for manual exploration. See [`DEMO.md`](../DEMO.md) for credentials, pre-loaded order states, and test URLs.
- **Erreka Gaztedi** — used by the automated integration tests; don't use this association for manual testing.

To reset the demo data without restarting the server:

```bash
curl -X POST "http://localhost:3000/api/demo/reset?secret=demo-reset-secret-change-me"
```
