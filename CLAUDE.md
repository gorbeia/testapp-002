@AGENTS.md

# Txosnabai — Claude Rules

## Stack

- **Next.js 16** App Router (route groups: `(public)`, `(customer)`, `(volunteer)`, `(admin)`)
- **React 19** — Server Components by default; `'use client'` only when needed
- **TypeScript 5** — strict mode, path alias `@/*` → `src/*`
- **Prisma 7** + PostgreSQL (schema is the source of truth for the domain model)
- **NextAuth 5 beta** — `auth()` from `next-auth`
- **next-intl 4** — all user-facing strings via `useTranslations` / `getTranslations`
- **Tailwind 4** + shadcn/ui + base-ui/react
- **Vitest 4** (unit) + Cucumber 12 + Playwright (E2E/BDD)
- Package manager: **pnpm 10**

## Repository / Store Pattern

All API route handlers **must** import repositories from `@/lib/store`, never directly from `@/lib/store/memory.ts`.

```ts
import { orderRepo, ticketRepo } from '@/lib/store';
```

This keeps handlers storage-agnostic. When `STORAGE_BACKEND=prisma` lands (Phase 10), handlers will work without changes.

## API Route Conventions

```
src/app/api/[resource]/route.ts   ← exports GET, POST, PUT, DELETE
```

- Authenticate with `await auth()` from `next-auth`; return 401 if no session when required
- Return `NextResponse.json(data, { status })` — never `Response.json`
- Skip auth in `PROTO_MODE=true` (integration tests) — check `process.env.PROTO_MODE`
- Never hard-code `associationId`; derive it from the session or the test context

## Domain Conventions

- Enums live in `@/lib/store/types.ts` as discriminated union types — never import from Prisma directly in application code
- `StoredXxx` types are plain-JS (numbers, Dates) — no Prisma Decimal/DateTime leaking into handlers or components
- Multi-tenant anchor: every entity is scoped to an `associationId`

## Routing & Locale

- All customer/volunteer/admin pages are under a `[locale]` dynamic segment
- Use `getTranslations({ locale })` in Server Components; `useTranslations()` in Client Components
- Route groups do **not** affect the URL — `(admin)/[locale]/dashboard` → `/en/dashboard`

## Real-Time (SSE)

- Push updates flow over SSE via `/api/tickets/[id]` and `/api/orders/[id]`
- Use `ReadableStream` / `TransformStream` on the server; never WebSockets
- Client hooks live in `src/hooks/`

## Testing

- Unit tests: `src/**/__tests__/*.test.ts(x)` with Vitest; use fixtures from `src/lib/fixtures/demo.ts`
- BDD scenarios: `features/**/*.feature` with Cucumber + Playwright
- Run: `pnpm test` (unit), `pnpm test:e2e` (E2E)
- `pnpm lint && pnpm typecheck` before committing

## Code Style

- Prettier: single quotes, semi, 100-char width, 2-space indent, trailing commas
- ESLint: no unused vars (prefix `_` to suppress), no `any` without explicit disable
- No comments explaining _what_ the code does — only _why_ when non-obvious
- No barrel re-exports unless the pattern already exists

## Workflow

1. Check `prisma/schema.prisma` before adding new entities or fields
2. After schema changes: `pnpm prisma migrate dev` then `pnpm prisma generate`
3. Read `node_modules/next/dist/docs/` before using any Next.js API — this version may differ from training data
4. Verify UI changes with the preview tools before marking complete
