# Txosnabai — Documentation Index

## What is Txosnabai?

Txosnabai is a multitenant web application for managing food and drink stalls (_txosnak_) at festivals in the Basque Country. Each _elkartea_ (association) operates its own isolated tenant: it configures a menu, opens a _txosna_ (an event-specific ordering instance), and then customers, volunteers, and admins interact through their respective screens.

The core data flow is: **Association → Txosna → Order → Ticket**. A customer places an order; the system splits it into tickets routed to the right counters (food, drinks); volunteers advance tickets through their lifecycle; the customer gets notified in real time via SSE.

---

## Quick Orientation

| User type | Route group                      | Example screens                                           |
| --------- | -------------------------------- | --------------------------------------------------------- |
| Customer  | `(public)/[locale]/[slug]`       | Menu, checkout, order status, pickup proof                |
| Volunteer | `(volunteer)/[locale]/`          | Counter, drinks, KDS, kitchen manager, overview           |
| Admin     | `(admin)/[locale]/`              | Dashboard, menu, volunteers, settings, reports, TicketBAI |
| Public    | `(public)/[locale]/[slug]/board` | Order board (displayed on a screen in the venue)          |

All pages live under a `[locale]` dynamic segment (e.g. `/eu/`, `/es/`, `/en/`). Route groups do **not** appear in the URL.

---

## Start Here

| I want to…                         | Read                                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------- |
| Run the app locally                | [`docs/local-development.md`](local-development.md)                                           |
| Try the app with test data         | [`DEMO.md`](../DEMO.md)                                                                       |
| Understand the domain model        | [`docs/domain-model.md`](domain-model.md)                                                     |
| Look up all API endpoints          | [`docs/api-reference.md`](api-reference.md)                                                   |
| Know what's built vs. planned      | [`docs/backend-implementation-plan.md`](backend-implementation-plan.md) (status table at top) |
| Add a feature (conventions for AI) | [`CLAUDE.md`](../CLAUDE.md)                                                                   |
| Deploy to a production VPS         | [`docs/ubuntu-vps-install.md`](ubuntu-vps-install.md)                                         |
| Understand the test strategy       | [`docs/testing-strategy.md`](testing-strategy.md)                                             |
| Look up Basque/English terms       | [`docs/glossary.md`](glossary.md)                                                             |

---

## Full Documentation Inventory

### Core design

| File                                 | What it covers                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| [`requirements.md`](requirements.md) | Functional requirements for all three actors (customer, volunteer, admin); scope and non-goals                      |
| [`domain-model.md`](domain-model.md) | All entities, enum values, lifecycle state machines, and entity relationships — read this before adding any feature |
| [`architecture.md`](architecture.md) | Technology stack, auth model, multitenancy isolation, SSE design, PROTO_MODE, deployment target                     |
| [`glossary.md`](glossary.md)         | 180+ Basque/English terms used throughout the codebase and docs                                                     |

### Implementation

| File                                                               | What it covers                                                                                                             |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| [`backend-implementation-plan.md`](backend-implementation-plan.md) | 13-phase delivery roadmap with implementation status; phase-by-phase list of delivered routes, tests, and design decisions |
| [`api-reference.md`](api-reference.md)                             | All 46 API endpoints grouped by resource, with HTTP method, auth requirement, and description                              |
| [`local-development.md`](local-development.md)                     | Local setup (memory mode — no database required), environment variables, running tests                                     |

### Deployment

| File                                             | What it covers                                                                                 |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| [`ubuntu-vps-install.md`](ubuntu-vps-install.md) | Production VPS install: Node.js, Nginx, PM2, PostgreSQL, Let's Encrypt, zero-downtime upgrades |

### Payments and fiscal

| File                                       | What it covers                                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| [`online-payments.md`](online-payments.md) | Stripe and Redsys integration design, webhook reliability, provider abstraction              |
| [`ticketbai.md`](ticketbai.md)             | TicketBAI fiscal invoicing (Basque Country tax regulation), hash chain, provider abstraction |

### UI and testing

| File                                                   | What it covers                                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| [`ui-analysis.md`](ui-analysis.md)                     | UI design specification: colour registers, typography, every screen's layout and interaction model |
| [`test-plan.md`](test-plan.md)                         | Full test plan: unit, integration, and E2E scenarios                                               |
| [`testing-strategy.md`](testing-strategy.md)           | Cucumber/Playwright/Vitest tooling, directory structure, tag conventions, CI pipeline              |
| [`e2e-coverage-analysis.md`](e2e-coverage-analysis.md) | BDD feature coverage gap analysis — P0/P1/P2/P3 priority gaps                                      |

### Feature specs

| File                                                                     | What it covers                                           |
| ------------------------------------------------------------------------ | -------------------------------------------------------- |
| [`features/mobile-order-tracking.md`](features/mobile-order-tracking.md) | Phase 12 feature specification for mobile order tracking |

### Root-level files

| File                        | What it covers                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| [`README.md`](../README.md) | Quick start and links to this index                                                                     |
| [`DEMO.md`](../DEMO.md)     | Demo credentials, pre-loaded test data, and test URLs for both associations                             |
| [`CLAUDE.md`](../CLAUDE.md) | Coding conventions and rules for AI assistants (references `AGENTS.md`)                                 |
| [`AGENTS.md`](../AGENTS.md) | Warning: this is Next.js 16 with breaking changes — read the local docs before writing any Next.js code |

---

## Key Conventions for AI Assistants

These are the must-know patterns before writing any code. See [`CLAUDE.md`](../CLAUDE.md) for the full authoritative rules.

1. **Repository pattern** — Import from `@/lib/store`, never directly from `@/lib/store/memory.ts`. Keeps handlers storage-agnostic.
2. **Response format** — Always `NextResponse.json(data, { status })`, never `Response.json`.
3. **Auth** — `const session = await auth()` from `next-auth`; return 401 if no session when required. Skip auth checks when `process.env.PROTO_MODE === 'true'`.
4. **Tenant scope** — Never hard-code `associationId`; always derive it from the session or the test context.
5. **Real-time** — Server-Sent Events via `ReadableStream` only. No WebSockets.
6. **Locale** — All user-facing strings via `useTranslations()` (client) or `getTranslations({ locale })` (server). Never hard-code display text.
7. **Types** — `StoredXxx` types (from `src/lib/store/types.ts`) are plain JS — no Prisma `Decimal` or `DateTime` should leak into handlers or components.

---

## Implementation Status Summary

Phases 0–9 and 11–13 are implemented and covered by tests. Phase 10 (Prisma storage backend) is the active work — the ORM adapter exists but the default storage is still `STORAGE_BACKEND=memory`. See [`backend-implementation-plan.md`](backend-implementation-plan.md) for the full phase-by-phase status table.
