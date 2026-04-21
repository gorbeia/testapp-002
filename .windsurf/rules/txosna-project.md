# Txosna App — Project Rules

## Project Overview

Txosna App manages food/drink ordering at **txosnak** (temporary festival stalls) run by volunteer associations for fundraising. It is a **multitenant** application — a single instance serves multiple associations with isolated data.

## Tech Stack

- **Framework**: Next.js 16+ (App Router) — this version has breaking changes from training data; read `node_modules/next/dist/docs/` before writing code
- **Language**: TypeScript throughout
- **Database**: PostgreSQL + Prisma ORM (v7+)
- **Styling**: Tailwind CSS v4 + Shadcn/ui + Radix UI
- **i18n**: next-intl (locales: eu, es, fr, en; Basque is default)
- **Auth**: NextAuth.js v5 (Auth.js) with credentials provider + Prisma adapter
- **Real-time**: Native SSE via Web Streams API (no external library)
- **Payments**: Stripe + Redsys abstraction layer (future)
- **Package manager**: pnpm

## Architecture

- **One codebase, one process** — Next.js handles frontend and backend
- **App Router** with route groups: `(public)`, `(customer)`, `(volunteer)`, `(admin)`
- **Route Handlers** for REST API + SSE endpoints
- **Server Actions** for form submissions and mutations
- **SSE** for all real-time updates (order status, stock, pause/close)
- **Multitenancy** enforced at application layer — all queries include `associationId` filter

## Three Design Registers

1. **Operational screens** (counter, kitchen, drinks bar) — dark theme, high contrast, large touch targets (56px min), speed above everything. No decorative elements.
2. **Customer screens** (ordering, pickup proof, order board) — light warm theme, clear, accessible to tourists, trust and clarity priorities.
3. **Admin screens** (configuration, menu, reports) — standard web app patterns, more complexity acceptable, used before events.

## Critical Design Rules

- **Mobile-first** — all screens must work on small phones as baseline (375px viewport minimum)
- **Glanceable over readable** — if a volunteer needs to read carefully, the design has failed
- **Tap targets**: minimum 48px everywhere; 56px on operational screens
- **Outdoor contrast**: WCAG AA minimum everywhere; AAA on pickup proof and order board
- **Speed over beauty** — drinks counter should feel like a POS terminal, not a web app
- **Progressive disclosure** — show what is needed now; hide complexity behind a single tap
- **No customer accounts** — customers never register or log in
- **Basque default locale** — `eu` is the default language, not `en`

## Colour Palette

**Operational (dark)**:

- Background: `#0f1117`, Surface: `#1a1d27`, Border: `#2a2d3a`
- Primary action: `#e85d2f` (warm orange), Success: `#22c55e`, Warning: `#f59e0b`, Danger: `#ef4444`
- Text primary: `#f8f9fa`, Text secondary: `#9ca3af`

**Customer (light)**:

- Background: `#faf8f5`, Surface: `#ffffff`, Border: `#e5e0d8`
- Primary action: `#e85d2f`, Accent: `#2d5a3d` (deep green)
- Text primary: `#1a1209`, Text secondary: `#6b6460`

**Order status colours** (shared): RECEIVED `#3b82f6`, IN_PREPARATION `#f59e0b`, READY `#22c55e`, CANCELLED `#6b7280`

## Typography

- Display/headings: Nunito or DM Sans (humanist, warm)
- Body/UI: System font stack or DM Sans
- Monospace (order numbers, codes): JetBrains Mono

## Database Conventions

- All entities from domain model map to Prisma models
- Enums defined in Prisma schema (OrderStatus, CounterType, etc.)
- No soft deletes — records are cancelled, not deleted
- `createdAt` and `updatedAt` on all models
- Multi-tenancy: all queries include `associationId` filter at application layer
- Prices captured at order time — menu changes don't affect existing orders

## Security & Multitenancy Requirements

**Critical rule**: Every API endpoint that modifies data or returns association-specific information MUST verify `session.user.associationId` matches the data's `associationId`. Do not assume the router parameter is sufficient; always verify.

**Pattern for every protected endpoint:**

1. Call `const session = await auth()` and check for `401 Unauthorized`
2. Extract `session.user.associationId` (sometimes called `sessionAssociationId` for clarity)
3. Check `session.user.role` if ADMIN-only (e.g., config endpoints)
4. Load the entity from the database using the route parameter (e.g., by ID or slug)
5. Verify `entity.associationId === sessionAssociationId` — return `403 Forbidden` if mismatch
6. Proceed with the operation

**Unsafe pattern** (do not use):

- Loading an entity by ID only, without checking its `associationId`
- Assuming a route parameter like `[slug]` is scoped to the session (slugs are globally unique but not association-locked)
- Casting `session.user as any` then trusting the payload without re-verifying in the database

**Public routes** (customers, no auth):

- `GET /api/txosnak/[slug]` — public metadata
- `GET /api/txosnak/[slug]/catalog` — menu
- `GET /api/txosnak/[slug]/events` — SSE stream (scoped by txosnaId, not associationId)
- `GET /api/orders/[orderId]` — customer uses verification code as secret
- `POST /api/txosnak/[slug]/orders` with `channel=SELF_SERVICE` — self-service (no auth needed)

**Do not add new public endpoints without explicit security review.** Document why no auth is needed.

**PROTO_MODE is for development only.** If it ever becomes enabled in production, tenant isolation is broken. Check production `.env` immediately if suspected.

See `/docs/architecture.md` section 11 for full security & multitenancy documentation.

## Key Domain Concepts

- **Txosna**: A stall at a festival. Has a unique slug for its public URL.
- **Counter setup**: SINGLE (one ticket per order) or SEPARATE (food + drinks tickets)
- **Order lifecycle**: PENDING_PAYMENT → CONFIRMED → tickets (RECEIVED → IN_PREPARATION → READY → COMPLETED)
- **Effective price**: base price + variant deltas + modifier prices
- **Effective allergens**: union of product + selected variants + selected modifiers
- **Orderable rule**: available AND NOT sold_out AND txosna.status=OPEN AND NOT is_demo AND channel IN enabled_channels
- **Demo txosna**: sandbox for testing; never visible to customers; config can be copied to real txosna

## File Structure

```
src/
  app/
    (public)/          ← public routes (no auth) — order board, ordering
    (customer)/        ← customer screens — order status, pickup proof
    (volunteer)/       ← volunteer operational screens — counter, kitchen, overview
    (admin)/           ← admin configuration — menu, txosna, volunteers, reports
    [locale]/          ← i18n locale routing
    api/               ← Route Handlers (REST + SSE)
  components/
    ui/                ← Shadcn/ui components
    screens/           ← screen-specific components (kds/, counter/, pickup-proof/, order-board/)
  lib/
    auth.ts            ← NextAuth configuration
    prisma.ts          ← Prisma client (conditional: mock when no DATABASE_URL)
    sse.ts             ← SSE client registry and broadcast
    payments/          ← payment provider abstraction
    utils.ts           ← shared utilities
  middleware.ts        ← auth checks, locale routing
messages/              ← i18n translation files (eu, es, fr, en)
prisma/
  schema.prisma        ← database schema
```

## Prisma Client — UI Prototyping Mode

The app can run without a database connection for UI prototyping. When `DATABASE_URL` is not set, `prisma` exports `null` and `safePrisma` provides mock methods returning empty data. Use `safePrisma` for code that must work in both modes.

## SSE Implementation

SSE uses native Web Streams API in Route Handlers. Nginx must have `proxy_buffering off` for SSE routes. Client registry is a simple `Map<string, Set<ReadableStreamDefaultController>>`.

## Payment Architecture

- App never handles money directly — associations configure their own providers
- Provider abstraction: `IPaymentProvider` interface with `validate()`, `createSession()`, `verifyWebhook()`
- Supported: Stripe (cards, Apple/Google Pay, Bizum) and Redsys (bank TPV, Bizum)
- Credentials encrypted at rest with AES-256-GCM
- Webhooks are authoritative for payment confirmation (not redirect URLs)
- EUR only, no multi-currency

## Do Not

- Do NOT create customer accounts or login flows for customers
- Do NOT use soft deletes — use cancellation instead
- Do NOT use serverless patterns — this runs on a VPS with persistent connections (SSE)
- Do NOT add decorative elements to operational screens
- Do NOT use English as the default locale — Basque (`eu`) is the default
- Do NOT hardcode prices in UI — always use effective price calculation
- Do NOT expose payment credentials in API responses, logs, or SSE events
