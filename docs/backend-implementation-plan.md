# Backend Implementation Plan

## Strategy

All phases use the same **in-memory store** as the storage layer. The in-memory store is the implementation used for integration tests: tests import the store directly, seed it, call API handlers, and assert on store state or HTTP responses — no database required at any point.

When the project is ready for a real database, each repository interface gets a second implementation backed by Prisma. A single environment variable (`STORAGE_BACKEND=memory|prisma`) switches between them. No API handler changes needed.

```
┌─────────────────────────────────────────────────┐
│              API Route Handler                  │
│   (knows nothing about storage technology)      │
└─────────────────────────┬───────────────────────┘
                          │ depends on
              ┌───────────▼────────────┐
              │  Repository Interface   │  ← typed contract per entity
              └──────┬─────────┬───────┘
                     │         │
          ┌──────────▼──┐  ┌───▼──────────┐
          │  In-Memory  │  │    Prisma     │  ← future phase
          │   (Phase 1) │  │  (Phase 10)  │
          └─────────────┘  └──────────────┘
```

The existing product/category API routes were written directly against Prisma. They will be left as-is and migrated to the repository pattern in Phase 10 alongside all other entities.

---

## Phase 0 — Repository contracts and in-memory store ✅

**Goal:** Define the interfaces that every other phase will program against. Establish the in-memory store as a singleton that can be seeded, reset between tests, and read by any route handler.

**Delivered**

| File                                     | Purpose                                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/lib/store/types.ts`                 | `Stored*` entity types + all repository interfaces + input/filter types                                      |
| `src/lib/store/memory.ts`                | In-memory implementation — module-level `Map`s, seeded from `mock-data.ts` on load, `resetStore()` for tests |
| `src/lib/store/index.ts`                 | Re-exports all repositories and types; future home of the `STORAGE_BACKEND` switch                           |
| `src/test/store-setup.ts`                | Test helper: re-exports `resetStore` + all repos for use in `beforeEach`                                     |
| `src/lib/store/__tests__/memory.test.ts` | 45 tests covering all five repositories                                                                      |

**Repository interfaces implemented:**

- `TxosnaRepository` — `findBySlug`, `findById`, `list`, `update`
- `OrderRepository` — `create`, `findById`, `findByNumber`, `listByTxosna`, `update`, `nextOrderNumber`
- `TicketRepository` — `findById`, `listByTxosna`, `listByOrder`, `update`
- `VolunteerRepository` — `findByEmail`, `findById`, `listByAssociation`, `create`, `update`
- `CatalogRepository` — `listCategories`, `listProducts`, `getProduct`, `getProductView`, `listProductViews`

**Key design decisions:**

- `pinHash` stores the plain PIN in the seed (bcrypt added in Phase 6)
- `passwordHash` stores `plain:test1234` sentinel in the seed (bcrypt wired in Phase 6)
- Tickets are stored flat (separate `Map`) and cross-referenced by `orderId`; `OrderRepository.create` creates both order and tickets atomically
- `nextOrderNumber` is a per-txosna atomic counter seeded from the highest mock order number
- Verification codes follow the format `AB-1234` (2 letters, dash, 4 digits)

---

## Phase 1 — Txosna status and menu (public read)

**Goal:** The customer menu page makes two API calls: one for txosna metadata and one for the product catalog. Both must work without auth.

**New routes**

`GET /api/txosnak/[slug]`

- Returns txosna name, status, wait time, counter setup, enabled channels
- 404 if slug not found or txosna is `CLOSED`
- No auth required

`GET /api/txosnak/[slug]/catalog`

- Returns categories with nested products, each annotated with txosna-level overrides (price override, soldOut, available)
- Filters out `available: false` products
- No auth required

**Replace mock data in:** `src/app/(customer)/[locale]/[slug]/page.tsx` and its child components — swap hardcoded `MOCK_PRODUCTS` for a `fetch` to the two routes above.

**Integration tests**

- `GET /api/txosnak/[slug]` → 200 with correct shape; 404 for unknown slug
- `GET /api/txosnak/[slug]/catalog` → products grouped by category; soldOut products present but flagged; unavailable products absent
- Mutate store directly (set `soldOut: true`) and re-fetch → reflected in response

---

## Phase 2 — Counter order creation

**Goal:** Volunteers at food/drinks counters can create orders. Orders begin confirmed (no payment pending) because the volunteer handles cash at the counter.

**New routes**

`POST /api/txosnak/[slug]/orders`

Request body:

```json
{
  "channel": "COUNTER",
  "customerName": "Gorka",
  "notes": null,
  "paymentMethod": "CASH",
  "lines": [
    {
      "productId": "prod-1",
      "quantity": 2,
      "selectedVariantOptionId": "opt-a",
      "selectedModifierIds": [],
      "splitInstructions": null
    }
  ]
}
```

Logic:

1. Validate txosna exists and is OPEN
2. Resolve each product from catalog, apply txosna price override
3. Compute per-line `unitPrice` (base + variant delta + modifiers)
4. Allocate next `orderNumber` (atomic increment per txosna)
5. Generate `verificationCode` (2 letters + 4 digits)
6. Split lines into tickets by `counterType` (FOOD vs DRINKS) based on product category; if the txosna has `kitchenPosts` configured, further split FOOD lines by kitchen post: for each line collect all non-null `kitchenPost` values from `product.kitchenPost`, each selected `variantOption.kitchenPost`, and each selected `modifier.kitchenPost`; de-duplicate; each distinct post value becomes a ticket (lines with an empty set go into a general food ticket with `kitchenPost = null`); lines for the same post across multiple order lines are merged into one ticket
7. Create `StoredOrder` with status `CONFIRMED` + nested tickets (each with `kitchenPost` set or null) with status `RECEIVED`
8. Broadcast SSE event `order:created` to txosna channel
9. Return created order

`GET /api/txosnak/[slug]/orders`

Query params: `status`, `channel`, `counterType`, `since` (ISO timestamp)

Returns orders with their tickets and lines. Used by the counter and KDS screens.

**Volunteer auth:** Both routes require a valid session (NextAuth JWT). The `registeredById` is set from `session.user.id`.

**Integration tests**

- POST valid order → 201, order in store, tickets split correctly
- POST order to txosna with kitchen posts configured → FOOD lines grouped into per-post tickets with correct `kitchenPost` values
- POST order to txosna without kitchen posts → single FOOD ticket with `kitchenPost = null`
- POST with soldOut product → 422
- POST to PAUSED txosna → 409
- GET with `status=CONFIRMED` → returns only confirmed orders
- POST two orders → order numbers are sequential and unique per txosna

---

## Phase 3 — Ticket lifecycle (KDS)

**Goal:** Kitchen staff can advance tickets through their states. Each state change broadcasts an SSE event.

**New routes**

`PATCH /api/tickets/[ticketId]`

Request body: `{ "status": "IN_PREPARATION" | "READY" | "COMPLETED" | "CANCELLED" }`

Logic:

1. Validate transition is forward-only (`RECEIVED → IN_PREPARATION → READY → COMPLETED`)
2. Set `readyAt` when entering READY, `completedAt` when entering COMPLETED
3. If all tickets in the order reach READY → broadcast `order:ready` SSE to txosna
4. If all tickets reach COMPLETED → broadcast `order:completed`
5. Return updated ticket

`GET /api/txosnak/[slug]/tickets`

Query params: `status`, `counterType`, `kitchenPost` (optional — when provided returns only tickets for that post; omit to return all)

Returns tickets with lines and order metadata (customerName, orderNumber, notes). Used by KDS (post-filtered view) and kitchen manager (all posts).

`PATCH /api/tickets/[ticketId]/flag`

Toggles `flagged` boolean. Used by KDS for manual attention markers.

**Integration tests**

- PATCH ticket `RECEIVED → IN_PREPARATION` → status updated, SSE broadcast recorded
- PATCH ticket `IN_PREPARATION → RECEIVED` → 422 (backwards transition rejected)
- All tickets of an order reach READY → order receives `order:ready` broadcast
- Order with two kitchen post-tickets: `order:ready` fires only after both post-tickets are READY
- GET `/tickets?status=RECEIVED&counterType=FOOD` → only food tickets in received state
- GET `/tickets?counterType=FOOD&kitchenPost=griddle` → only griddle post tickets returned
- GET `/tickets?counterType=FOOD` (no kitchenPost) → all FOOD tickets regardless of post

---

## Phase 4 — Order status for customers (read + SSE)

**Goal:** After placing an order the customer sees their order status update live.

**New routes**

`GET /api/orders/[orderId]`

- No auth required
- Returns order status, ticket statuses, customerName, orderNumber, verificationCode
- Customer identifies themselves: either by orderId (from localStorage after order creation) or by `?txosnaId=&orderNumber=&verificationCode=` for shared links

`GET /api/txosnak/[slug]/events` _(already scaffolded in `src/app/api/txosna/[id]/events/route.ts`)_

- SSE stream per txosna
- Client subscribes after placing order; receives `order:ready`, `order:cancelled`, `ticket:status_changed` events
- In-memory SSE registry already implemented in `src/lib/sse.ts` — just wire broadcasts from Phase 2 and 3

**Integration tests**

- GET order by id → 200 with correct status
- GET non-existent order → 404
- Simulate ticket status advance → in-memory SSE broadcast recorded with correct payload
- GET with wrong verificationCode → 403

---

## Phase 5 — Self-service order creation (customer channel)

**Goal:** Customers can place their own orders from the public menu. Differs from counter orders: starts as `PENDING_PAYMENT` for cash (or goes through a payment session for online), and `customerName` comes from checkout form.

**New route**

`POST /api/txosnak/[slug]/orders` _(extends Phase 2 route)_

When `channel: "SELF_SERVICE"`:

- If `paymentMethod: "CASH"` → order status is `PENDING_PAYMENT`, `expiresAt` = now + `pendingPaymentTimeout` minutes
- If `paymentMethod: "ONLINE"` → create a payment session (Phase 8), return `{ orderId, paymentUrl }`
- No volunteer auth required; `registeredById` is null

`POST /api/orders/[orderId]/confirm`

- Called by volunteer when customer arrives and pays cash
- Changes status `PENDING_PAYMENT → CONFIRMED`
- Sets `confirmedAt`, `registeredById` from session
- Creates tickets (same logic as counter path)
- Broadcasts `order:confirmed` SSE

`POST /api/orders/[orderId]/cancel`

Request: `{ "reason": "TIMEOUT" | "SOLD_OUT" | "CUSTOMER" | "VOLUNTEER" }`

- Sets status `CANCELLED`, records reason
- Broadcasts `order:cancelled`

**Expiry sweep:** A lightweight in-process interval (or Next.js route segment config `revalidate`) that cancels orders where `expiresAt < now` and `status = PENDING_PAYMENT`. In production this becomes a cron job or database trigger.

**Integration tests**

- POST self-service order → PENDING_PAYMENT, tickets not yet created
- POST confirm → CONFIRMED, tickets created, SSE broadcast
- POST cancel → CANCELLED, reason stored
- POST confirm after expiry → 409

---

## Phase 6 — Volunteer management

**Goal:** Admins can manage volunteers for their association.

**New routes**

`GET /api/associations/[associationId]/volunteers`
`POST /api/associations/[associationId]/volunteers`
`PATCH /api/volunteers/[volunteerId]`
`DELETE /api/volunteers/[volunteerId]` (soft-delete: sets `active: false`)

All require `role: ADMIN` on the session.

Password hashing uses `bcryptjs` (already a dependency).

`POST /api/auth/pin` _(not NextAuth — separate endpoint)_

- Request: `{ txosnaSlug, pin }`
- Verifies pin against `txosna.pinHash` (bcrypt)
- Returns `{ valid: true, txosnaId, counterSetup, kitchenPosts }` — no session created; PIN auth is ephemeral per device; `kitchenPosts` is included so the PIN entry screen can present post selection when the volunteer chooses kitchen mode

**Integration tests**

- POST volunteer → created, passwordHash stored (not plaintext)
- PATCH volunteer active → reflected in store
- POST `/auth/pin` with correct PIN → 200 valid
- POST `/auth/pin` with wrong PIN → 200 invalid (not 401, to avoid enumeration)
- VOLUNTEER-role session attempting PATCH volunteer → 403

---

## Phase 7 — Txosna settings management

**Goal:** Admins can configure txosna status, wait time, payment methods, and counter setup via the admin panel.

**New routes**

`GET /api/txosnak/[slug]/settings`
`PATCH /api/txosnak/[slug]/settings`

Writable fields: `status`, `waitMinutes`, `counterSetup`, `enabledChannels`, `enabledPaymentMethods`, `printingEnabled`, `pendingPaymentTimeout`

`PATCH /api/txosnak/[slug]/pin`

- Hashes new PIN with bcrypt before storing
- Requires ADMIN role

When `status` changes to `PAUSED` or `CLOSED`:

- Broadcast `txosna:status_changed` SSE to all connected clients
- Customer menu shows "Txosna itxita" overlay in real time

**Integration tests**

- PATCH status OPEN → PAUSED → reflected in `findBySlug`
- PATCH status change → SSE broadcast recorded
- PATCH with VOLUNTEER role → 403
- PATCH invalid status value → 422

---

## Phase 8 — Reports

**Goal:** Admins can view daily and weekly summaries.

**New route**

`GET /api/txosnak/[slug]/reports`

Query param: `period=today|week|all`

Response:

```json
{
  "period": "today",
  "ordersTotal": 42,
  "ordersConfirmed": 40,
  "ordersCancelled": 2,
  "revenue": 387.5,
  "avgOrderValue": 9.69,
  "topProducts": [{ "productId": "…", "name": "Burgerra", "quantitySold": 18, "revenue": 153.0 }],
  "ticketsByStatus": { "COMPLETED": 38, "CANCELLED": 4 }
}
```

Computed from in-memory order and ticket data. In production this is a DB aggregate query; for now it's a reduce over the orders map.

**Integration tests**

- Seed 10 confirmed orders + 2 cancelled → totals match
- `period=today` filters by `createdAt` date
- Revenue calculation includes variant/modifier price deltas

---

## Phase 9 — Online payments (Stripe + Redsys) ✅

**Goal:** Self-service orders can be paid online before the txosna confirms them.

**Routes**

`POST /api/payments/session`

- Accepts optional `providerType: 'STRIPE' | 'REDSYS'`
- Stripe (default): creates a Stripe Checkout session
- Redsys: looks up the association's active Redsys provider via `txosnaRepo` → `paymentProviderRepo`, creates a signed redirect form session
- Records `paymentSessionId` on the order; returns `{ url, sessionId }`

`POST /api/payments/webhook/stripe`

- Verifies `stripe-signature` header
- On `checkout.session.completed` → confirms order (tickets created)
- On `checkout.session.expired` → cancels order with reason `TIMEOUT`

`POST /api/payments/webhook/redsys`

- Two-phase: decodes `Ds_MerchantParameters` (Base64 JSON) to extract `Ds_Order` without a key, looks up the order and its association's Redsys provider, then verifies the HMAC-SHA256 signature
- Response code 0–99 → confirms order; any other code → cancels with `TIMEOUT`

`GET /api/payments/redsys/redirect`

- Intermediate page that auto-submits a signed POST form to the Redsys payment URL
- Validates the `redsysUrl` hostname against an allowlist (`sis-t.redsys.es` / `sis.redsys.es`) before rendering

**Abstraction:** All handlers go through the `IPaymentProvider` interface (`src/lib/payments/types.ts`). `StripePaymentProvider` and `RedsysPaymentProvider` (using `redsys-easy`) both implement it. `FakePaymentProvider` is used in tests.

**Integration tests** (using `FakePaymentProvider`)

Stripe:

- POST payment/session → session created, `paymentSessionId` stored on order
- POST webhook with valid payload → order confirmed, tickets created
- POST webhook with invalid signature → 400
- POST webhook for unknown order → 404

Redsys:

- POST payment/session with `providerType: 'REDSYS'` → session created, `paymentSessionId` stored
- POST redsys webhook with succeeded notification → order confirmed, tickets created
- POST redsys webhook with cancelled notification → order cancelled with `TIMEOUT`
- POST redsys webhook with invalid signature → 400

---

## Phase 10 — Prisma storage backend

**Goal:** Swap the in-memory store for a Prisma-backed implementation, one repository at a time.

**Approach**

1. Implement each repository interface against Prisma (one file per entity)
2. Update `src/lib/store/index.ts` to select the implementation based on `STORAGE_BACKEND` env var
3. Run the same integration test suite against both implementations — tests must pass on both
4. Migrate the existing product/category routes (written directly against Prisma in Phase 0) to go through the `CatalogRepository` interface

**Migration order** (least risky first):

1. `TxosnaRepository` — read-heavy, no complex relations
2. `CatalogRepository` — merges with existing product/category routes
3. `VolunteerRepository` — maps cleanly to single table
4. `OrderRepository` + `TicketRepository` — most complex, do together

**No API changes required.** All handlers already use repository interfaces.

---

## Phase 11 — Demo association provisioning

**Goal:** Provide a fully self-contained demo environment that stakeholders and new associations can use to validate the application with realistic data — without touching any live association's data.

### What "demo" means

A demo association is a real row in the store (or database in Phase 10) with a known slug and a fixed dataset. It differs from the seed data in `mock-data.ts` in two ways:

1. **It is reset on demand** — a single API call restores the demo to its initial state without restarting the server.
2. **It covers all flows** — the dataset is curated to exercise every screen: pending orders, in-preparation tickets, ready orders, a PAUSED txosna, and a full volunteer roster.

### Demo dataset

The demo association ships as a static fixture file at `src/lib/fixtures/demo.ts`, structured identically to the `MOCK_*` exports in `mock-data.ts` but with:

| Entity      | Count | Purpose                                                |
| ----------- | ----- | ------------------------------------------------------ |
| Association | 1     | "Demo Elkartea"                                        |
| Txosnak     | 2     | One OPEN (`demo-janaria`), one PAUSED (`demo-edariak`) |
| Categories  | 2     | Janaria + Edariak                                      |
| Products    | 8     | Mix of food/drinks, some with variants, some soldOut   |
| Volunteers  | 3     | 1 ADMIN + 2 VOLUNTEER (1 inactive)                     |
| Orders      | 6     | PENDING_PAYMENT ×2, CONFIRMED ×3, CANCELLED ×1         |
| Tickets     | 8     | RECEIVED ×2, IN_PREPARATION ×2, READY ×2, COMPLETED ×2 |

The fixture uses deterministic IDs prefixed with `demo-` so they cannot collide with real associations.

### New routes

`POST /api/demo/reset`

- No auth required (protected by a `DEMO_RESET_SECRET` env var passed as a bearer token)
- Calls `resetDemoAssociation()` — clears all demo-prefixed entities and re-seeds from `demo.ts`
- Returns `{ slug: "demo-janaria", pin: "0000" }` so the caller knows where to go

`GET /api/demo/status`

- No auth required
- Returns whether demo mode is enabled (`DEMO_ENABLED=true` env var)
- Used by the prototype navigator to show/hide the demo reset button

### In-memory store changes

`memory.ts` gains a `resetDemoAssociation()` export that:

1. Deletes all entities where `id` starts with `demo-`
2. Re-inserts from `demo.ts`

The store's main `resetStore()` (used in tests) includes demo data in the full reset.

### Integration tests

- POST `/api/demo/reset` without secret → 401
- POST `/api/demo/reset` with secret → 200, demo orders visible via `GET /txosnak/demo-janaria/orders`
- POST reset twice → second reset produces same order numbers as first (counter also reset)
- Demo data does not appear in non-demo txosna queries

---

## Testing strategy

### Layers

```
┌───────────────────────────────────────────────────────────┐
│  Unit tests          src/lib/**/__tests__/*.test.ts       │
│  Pure functions: price calculation, status transitions,   │
│  verification code format, expiry logic.                  │
│  Fast, no I/O, no store required.                         │
├───────────────────────────────────────────────────────────┤
│  Store tests         src/lib/store/__tests__/*.test.ts    │
│  Repository contracts: CRUD correctness, filter logic,    │
│  ordering guarantees, reset/seed behaviour.               │
│  Uses in-memory store directly. No HTTP.                  │
├───────────────────────────────────────────────────────────┤
│  Handler tests       src/app/api/**/__tests__/*.test.ts   │
│  API route handlers called directly as functions          │
│  (Next.js route handlers export plain async functions).   │
│  Builds a Request, calls the handler, asserts Response.   │
│  Uses in-memory store; resetStore() in beforeEach.        │
│  No network, no Next.js server process.                   │
├───────────────────────────────────────────────────────────┤
│  E2E (future)        tests/e2e/**/*.spec.ts               │
│  Playwright against a running Next.js dev server.         │
│  Only for critical happy-path flows (order → KDS → done). │
│  Added after Phase 5 when self-service flow is complete.  │
└───────────────────────────────────────────────────────────┘
```

### Tooling

| Concern                  | Tool                                                        |
| ------------------------ | ----------------------------------------------------------- |
| Test runner              | Vitest (already configured)                                 |
| DOM / React components   | `@testing-library/react` + jsdom (already configured)       |
| HTTP handler tests       | Plain `new Request(…)` + handler function call              |
| SSE broadcast assertions | Spy on `broadcast()` from `src/lib/sse.ts` using `vi.spyOn` |
| Payment provider         | `FakePaymentProvider` implementing `IPaymentProvider`       |
| E2E (Phase 5+)           | Playwright                                                  |

### Conventions

**One `beforeEach(resetStore)`** per handler test file. Never share store state between tests.

**Handler tests follow this shape:**

```typescript
import { POST } from '@/app/api/txosnak/[slug]/orders/route'
import { resetStore, orderRepo } from '@/test/store-setup'

beforeEach(resetStore)

it('creates a counter order', async () => {
  const req = new Request('http://localhost/api/txosnak/aste-nagusia-2026/orders', {
    method: 'POST',
    body: JSON.stringify({ … }),
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer <test-token>' },
  })
  const res = await POST(req, { params: { slug: 'aste-nagusia-2026' } })
  expect(res.status).toBe(201)
  const body = await res.json()
  expect(body.orderNumber).toBeGreaterThan(0)
  // Assert store state directly
  const order = await orderRepo.findById(body.id)
  expect(order!.status).toBe('CONFIRMED')
})
```

**SSE broadcast assertions:**

```typescript
import * as sse from '@/lib/sse';
const broadcastSpy = vi.spyOn(sse, 'broadcast');

// ... call handler ...

expect(broadcastSpy).toHaveBeenCalledWith(
  'txosna-1',
  'order:created',
  expect.objectContaining({ orderNumber: expect.any(Number) })
);
```

**Auth in tests:** Handler tests use a `mockSession()` helper that returns a minimal session object matching the NextAuth shape. Auth is bypassed by injecting the session into the handler — handlers accept an optional `_session` parameter in test builds, or auth is mocked at the `src/lib/auth.ts` module level with `vi.mock`.

### Coverage targets (enforced in CI)

| Layer                      | Target                                        |
| -------------------------- | --------------------------------------------- |
| Store (unit + store tests) | 100% branch coverage                          |
| API handlers               | 90% line coverage                             |
| Business logic utilities   | 100% branch coverage                          |
| React components           | Not enforced (snapshot tests for regressions) |

### CI pipeline

```
lint → typecheck → unit+store tests → handler tests → build
                                                       ↓
                                             (Phase 5+) E2E tests
```

All stages run on every pull request. Handler tests are kept under 30 seconds total by never touching real I/O.

---

## Phase 12 — Mobile order tracking

**Goal:** Allow any customer — regardless of how they paid — to check their order status and download a printable receipt from their phone using a short human-readable code, with no account required.

### Overview

Every `StoredOrder` already carries a `verificationCode` in `AB-1234` format. This phase surfaces that code at the counter, builds a public lookup endpoint around it, and adds per-txosna opt-in configuration.

### Schema change

```prisma
// prisma/schema.prisma — Txosna model
mobileTrackingEnabled Boolean @default(false)
```

Added after `printingEnabled`. Default `false` keeps the feature invisible until an operator enables it.

### Store changes

**`StoredTxosna`** (`src/lib/store/types.ts`):

```ts
mobileTrackingEnabled: boolean;
```

**`OrderRepository`** interface (`src/lib/store/types.ts`):

```ts
findByVerificationCode(txosnaId: string, code: string): Promise<StoredOrder | null>;
```

**`memory.ts`** implementation:

```ts
async findByVerificationCode(txosnaId, code) {
  for (const o of orders.values()) {
    if (o.txosnaId === txosnaId && o.verificationCode === code) return o;
  }
  return null;
},
```

Demo fixture: `mobileTrackingEnabled: true` on `demo-txosna-1` (`demo-janaria`) for easy smoke-testing.

### API changes

**Settings** (`GET/PATCH /txosnak/[slug]/settings`):

- `mobileTrackingEnabled` added to GET response and PATCH whitelist
- No additional validation — boolean toggle

**Lookup** (`GET /txosnak/[slug]/orders/lookup?code=AB-1234`):

- No authentication required (intentionally public)
- 404 if txosna not found or `mobileTrackingEnabled` is false
- In-memory rate limiter: sliding 60s window, max 20 requests per `${ip}:${slug}`; returns 429 if exceeded
- Response:
  ```json
  {
    "orderId": "...",
    "orderNumber": 42,
    "customerName": "Ane",
    "status": "CONFIRMED",
    "confirmedAt": "...",
    "tickets": [{ "id": "...", "counterType": "FOOD", "status": "IN_PREPARATION" }]
  }
  ```

### Frontend changes

**Counter screens** (`(volunteer)/[locale]/counter/page.tsx` and `drinks/page.tsx`):

- After order confirmation, if `mobileTrackingEnabled`: show full-screen handoff card with code + QR pointing directly to `/[slug]/track/[code]`
- Collapsible "Bukatutako eskaerak" panel (session-only, capped at 20): per-row code, 48px QR, external link to tracking page

**Admin settings** (`(admin)/[locale]/txosna/page.tsx` — QR tab):

- `ToggleRow` for "Jarraipen mugikorra"
- When enabled, shows the `/[slug]/track` URL as an info row

**Public tracking pages** (`(public)/[locale]/[slug]/track/`):

- Entry page: code input + submit → navigate to `track/[code]`
- Status page: Server Component fetches initial state; Client Component subscribes to txosna SSE and re-fetches on `ticket:status_changed` / `order:cancelled` / `order:confirmed`
- Receipt page: Server Component rendering full `<html>` document; printable via `window.print()`

### Dependencies

- `qrcode.react` v4 (`QRCodeSVG`) — added to `package.json`

### Testing

| Test                           | What to verify                                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit: `findByVerificationCode` | returns correct order; returns null for wrong txosna; returns null for wrong code                                                                   |
| Handler: lookup GET            | 404 when flag off; 404 when code wrong; 200 + correct shape when found; 429 after 20 requests                                                       |
| Handler: settings PATCH        | `mobileTrackingEnabled` persists; GET returns updated value                                                                                         |
| Manual smoke                   | Enable on demo-janaria → place counter order → handoff card appears → navigate to `/track` → enter code → status updates via SSE → download receipt |

---

## Delivery summary

| Phase | What ships                             | New API surface                                             |
| ----- | -------------------------------------- | ----------------------------------------------------------- |
| 0     | In-memory store, repository interfaces | —                                                           |
| 1     | Txosna metadata + catalog reads        | `GET /txosnak/[slug]`, `GET /txosnak/[slug]/catalog`        |
| 2     | Counter order creation + listing       | `POST /txosnak/[slug]/orders`, `GET /txosnak/[slug]/orders` |
| 3     | KDS ticket lifecycle                   | `PATCH /tickets/[id]`, `GET /txosnak/[slug]/tickets`        |
| 4     | Customer order status + SSE            | `GET /orders/[id]`, `/events` SSE wiring                    |
| 5     | Self-service orders + confirm/cancel   | Extends order POST, adds `/confirm`, `/cancel`              |
| 6     | Volunteer management + PIN auth        | `/volunteers`, `POST /auth/pin`                             |
| 7     | Txosna settings                        | `GET/PATCH /txosnak/[slug]/settings`                        |
| 8     | Reports                                | `GET /txosnak/[slug]/reports`                               |
| 9     | Online payments                        | `POST /payments/session`, `POST /payments/webhook/stripe`   |
| 10    | Prisma backend                         | No new routes — storage swap                                |
| 11    | Demo provisioning                      | `POST /api/demo/reset`, `GET /api/demo/status`              |
| 12    | Mobile order tracking                  | `GET /txosnak/[slug]/orders/lookup`                         |

Each phase can be merged and deployed independently. The front-end prototype continues to run against mock data until the corresponding phase lands; switching a screen to the real API is a one-line change per `fetch` call.
