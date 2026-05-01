# Testing Strategy — Gherkin/Cucumber (Phases 1–9)

## Goals

- Express every meaningful behaviour as a **Gherkin scenario** that non-engineers can read.
- Run the same `.feature` files at **two speeds**: fast integration (direct API calls, in-memory store) and slow e2e (real browser via Playwright).
- Keep integration tests under 30 s; keep e2e tests to the critical happy paths only.

---

## Tooling

| Concern               | Tool                                                              |
| --------------------- | ----------------------------------------------------------------- |
| Feature files         | `.feature` (Gherkin syntax)                                       |
| Step runner           | `@cucumber/cucumber`                                              |
| Integration world     | Direct Next.js route handler calls + in-memory store              |
| E2E world             | `@playwright/test` wrapped in a Cucumber World                    |
| TypeScript support    | `ts-node` + `@cucumber/cucumber` native TS loader                 |
| Assertions            | `expect` from `vitest` (integration) / Playwright built-ins (e2e) |
| SSE spy (integration) | `vi.spyOn(sse, 'broadcast')`                                      |
| Payment stub          | `FakePaymentProvider` implementing `IPaymentProvider`             |
| TicketBAI stub        | `MockTicketBaiProvider` implementing `ITicketBaiProvider`         |

> The existing Vitest unit/store tests (`src/lib/store/__tests__/`, component tests) are **kept as-is** and continue to run via `vitest run`. Cucumber handles integration and e2e exclusively.

---

## Directory structure

```
features/
  public/
    txosna-menu.feature          # Phase 1
    order-status.feature         # Phase 4
  counter/
    create-order.feature         # Phase 2
  kds/
    ticket-lifecycle.feature     # Phase 3
  customer/
    self-service-order.feature   # Phase 5
  admin/
    volunteer-management.feature # Phase 6
    txosna-settings.feature      # Phase 7
    reports.feature              # Phase 8
  payments/
    online-payment.feature       # Phase 9
  tracking/
    mobile-tracking.feature      # Phase 12
  ticketbai/
    fiscal-invoice.feature       # Phase 13
  step-definitions/
    integration/
      world.ts                   # in-memory store + direct handler calls
      shared.steps.ts            # Given/When/Then reused across domains
      txosna.steps.ts
      orders.steps.ts
      tickets.steps.ts
      volunteers.steps.ts
      settings.steps.ts
      reports.steps.ts
      payments.steps.ts
      ticketbai.steps.ts
    e2e/
      world.ts                   # Playwright browser + page objects
      shared.steps.ts
      txosna.steps.ts
      orders.steps.ts
      tickets.steps.ts
  support/
    hooks.ts                     # Before/After hooks (resetStore, browser teardown)
cucumber.js                      # Profile configuration
```

---

## Cucumber profiles (`cucumber.js`)

```js
const common = {
  format: ['progress-bar', 'html:reports/cucumber.html'],
  publishQuiet: true,
};

module.exports = {
  // Fast — no network, no browser
  integration: {
    ...common,
    require: ['features/step-definitions/integration/**/*.ts', 'features/support/hooks.ts'],
    requireModule: ['ts-node/register'],
    paths: ['features/**/*.feature'],
    tags: 'not @e2e-only',
  },

  // Slow — real browser against running Next.js dev server
  e2e: {
    ...common,
    require: ['features/step-definitions/e2e/**/*.ts', 'features/support/hooks.ts'],
    requireModule: ['ts-node/register'],
    paths: ['features/**/*.feature'],
    tags: '@smoke or @e2e',
  },
};
```

**Package scripts to add:**

```json
"test:integration": "cucumber-js --profile integration",
"test:e2e":         "cucumber-js --profile e2e",
"test:all":         "vitest run && npm run test:integration"
```

---

## Tag conventions

| Tag                 | Meaning                                                  |
| ------------------- | -------------------------------------------------------- |
| `@smoke`            | Runs in **both** profiles — critical happy path          |
| `@integration-only` | Skipped by e2e profile (verifies internal logic, not UI) |
| `@e2e-only`         | Skipped by integration profile (needs a real browser)    |
| `@wip`              | Work in progress — excluded from CI                      |
| `@slow`             | Long-running — excluded from fast CI, runs nightly       |

---

## World classes

### Integration world (`features/step-definitions/integration/world.ts`)

```typescript
import { setWorldConstructor, World } from '@cucumber/cucumber';
import { resetStore } from '@/test/store-setup';
import * as sse from '@/lib/sse';
import { vi } from 'vitest';

export class IntegrationWorld extends World {
  broadcastSpy = vi.spyOn(sse, 'broadcast');
  lastResponse: Response | null = null;
  lastBody: unknown = null;

  async callRoute(
    handler: (req: Request, ctx: unknown) => Promise<Response>,
    method: string,
    url: string,
    body?: unknown,
    headers?: Record<string, string>
  ) {
    const req = new Request(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    this.lastResponse = await handler(req, this.routeContext(url));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
    return this.lastResponse;
  }

  private routeContext(url: string) {
    // Extract [slug], [id] etc. from URL and return as params
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    return { params: { slug: parts[2], id: parts[3] } };
  }
}

setWorldConstructor(IntegrationWorld);
```

### E2E world (`features/step-definitions/e2e/world.ts`)

```typescript
import { setWorldConstructor, World } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from 'playwright';

export class E2EWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
}

setWorldConstructor(E2EWorld);
```

### Shared hooks (`features/support/hooks.ts`)

```typescript
import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { resetStore } from '@/test/store-setup';
import { chromium } from 'playwright';
import { IntegrationWorld } from '../step-definitions/integration/world';
import { E2EWorld } from '../step-definitions/e2e/world';

// Integration: reset in-memory store before each scenario
Before({ tags: 'not @e2e-only' }, async function (this: IntegrationWorld) {
  resetStore();
  this.broadcastSpy.mockClear();
});

// E2E: open browser before suite, new context per scenario
BeforeAll(async function () {
  // browser started in world constructor or here
});

Before({ tags: '@e2e or @smoke' }, async function (this: E2EWorld) {
  this.browser = await chromium.launch();
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
});

After({ tags: '@e2e or @smoke' }, async function (this: E2EWorld) {
  await this.context?.close();
  await this.browser?.close();
});
```

---

## Feature files

### Phase 1 — Txosna menu (`features/public/txosna-menu.feature`)

```gherkin
Feature: Public txosna menu
  As a customer
  I want to see the txosna menu and its status
  So that I can decide what to order

  Background:
    Given the txosna "aste-nagusia" exists and is OPEN

  @smoke
  Scenario: Customer loads an open txosna
    When I request the txosna details for slug "aste-nagusia"
    Then the response status is 200
    And the response includes the txosna name and status "OPEN"

  @integration-only
  Scenario: Unknown slug returns 404
    When I request the txosna details for slug "does-not-exist"
    Then the response status is 404

  @smoke
  Scenario: Catalog groups products by category
    When I request the catalog for "aste-nagusia"
    Then the response contains at least 1 category with nested products

  @integration-only
  Scenario: Unavailable products are excluded from catalog
    Given product "prod-hidden" has available set to false
    When I request the catalog for "aste-nagusia"
    Then product "prod-hidden" is not in the response

  @integration-only
  Scenario: Sold-out products appear flagged
    Given product "prod-burger" has soldOut set to true
    When I request the catalog for "aste-nagusia"
    Then product "prod-burger" appears in the response with soldOut true
```

---

### Phase 2 — Counter order creation (`features/counter/create-order.feature`)

```gherkin
Feature: Counter order creation
  As a volunteer at the counter
  I want to create orders on behalf of customers
  So that their food and drink are prepared immediately

  Background:
    Given the txosna "aste-nagusia" exists and is OPEN
    And I am authenticated as a volunteer

  @smoke
  Scenario: Volunteer creates a counter order
    When I submit a COUNTER order for "aste-nagusia" with:
      | customerName | Gorka  |
      | paymentMethod| CASH   |
      | productId    | prod-1 |
      | quantity     | 2      |
    Then the response status is 201
    And the order status is "CONFIRMED"
    And the order has an order number
    And a "order:created" SSE event is broadcast to "aste-nagusia"

  @integration-only
  Scenario: Order is rejected when txosna is PAUSED
    Given the txosna "aste-nagusia" is PAUSED
    When I submit a COUNTER order for "aste-nagusia"
    Then the response status is 409

  @integration-only
  Scenario: Order is rejected for a sold-out product
    Given product "prod-1" has soldOut set to true
    When I submit a COUNTER order for "aste-nagusia" with product "prod-1"
    Then the response status is 422

  @integration-only
  Scenario: Food and drinks are split into separate tickets
    When I submit a COUNTER order with one food product and one drinks product
    Then the order has 2 tickets
    And one ticket has counterType "FOOD"
    And one ticket has counterType "DRINKS"

  @integration-only
  Scenario: Food lines split into kitchen post tickets when posts are configured
    Given the txosna "aste-nagusia" has kitchen posts "griddle" and "fryer"
    And product "prod-burger" has kitchenPost "griddle"
    And variant option "opt-fries" has kitchenPost "fryer"
    And variant option "opt-salad" has kitchenPost null
    When I submit a COUNTER order for "prod-burger" with variant "opt-fries"
    Then the order has 2 FOOD tickets
    And one ticket has kitchenPost "griddle"
    And one ticket has kitchenPost "fryer"

  @integration-only
  Scenario: Variant with null kitchenPost does not add an extra ticket
    Given the txosna "aste-nagusia" has kitchen posts "griddle" and "fryer"
    And product "prod-burger" has kitchenPost "griddle"
    And variant option "opt-salad" has kitchenPost null
    When I submit a COUNTER order for "prod-burger" with variant "opt-salad"
    Then the order has 1 FOOD ticket
    And that ticket has kitchenPost "griddle"

  @integration-only
  Scenario: Food order without post tags produces a single general ticket
    Given the txosna "aste-nagusia" has no kitchen posts configured
    When I submit a COUNTER order with two food products
    Then the order has 1 FOOD ticket
    And that ticket has kitchenPost null

  @integration-only
  Scenario: Order numbers are sequential and unique per txosna
    When I submit 2 COUNTER orders for "aste-nagusia"
    Then the second order has an order number greater than the first
```

---

### Phase 3 — KDS ticket lifecycle (`features/kds/ticket-lifecycle.feature`)

```gherkin
Feature: KDS ticket lifecycle
  As kitchen or bar staff
  I want to advance tickets through preparation states
  So that customers are notified when their order is ready

  Background:
    Given the txosna "aste-nagusia" exists and is OPEN
    And a confirmed order exists with a ticket in status "RECEIVED"

  @smoke
  Scenario: Staff advances a ticket to IN_PREPARATION
    When I PATCH ticket status to "IN_PREPARATION"
    Then the response status is 200
    And the ticket status is "IN_PREPARATION"
    And a "ticket:status_changed" SSE event is broadcast

  @integration-only
  Scenario: Backwards transition is rejected
    Given the ticket is in status "IN_PREPARATION"
    When I PATCH ticket status to "RECEIVED"
    Then the response status is 422

  @integration-only
  Scenario: All tickets ready triggers order:ready broadcast
    Given all tickets in the order are in status "RECEIVED"
    When I advance all tickets to "READY"
    Then a "order:ready" SSE event is broadcast to "aste-nagusia"

  @integration-only
  Scenario: KDS filters by counterType and status
    Given there are FOOD tickets in "RECEIVED" and DRINKS tickets in "IN_PREPARATION"
    When I request tickets for "aste-nagusia" with counterType "FOOD" and status "RECEIVED"
    Then only FOOD tickets in RECEIVED status are returned

  @integration-only
  Scenario: KDS filters by kitchen post
    Given the txosna "aste-nagusia" has kitchen posts "griddle" and "assembly"
    And a confirmed order exists with a "griddle" post ticket and an "assembly" post ticket
    When I request tickets for "aste-nagusia" with counterType "FOOD" and kitchenPost "griddle"
    Then only the griddle post ticket is returned

  @integration-only
  Scenario: order:ready fires only when all post-tickets are READY
    Given the txosna "aste-nagusia" has kitchen posts "griddle" and "assembly"
    And a confirmed order exists with a "griddle" post ticket and an "assembly" post ticket both in "RECEIVED"
    When I advance the "griddle" post ticket to "READY"
    Then no "order:ready" SSE event is broadcast
    When I advance the "assembly" post ticket to "READY"
    Then a "order:ready" SSE event is broadcast to "aste-nagusia"
```

---

### Phase 4 — Customer order status (`features/public/order-status.feature`)

```gherkin
Feature: Customer order status
  As a customer
  I want to check my order status
  So that I know when to collect my food

  @smoke
  Scenario: Customer retrieves order by id
    Given a confirmed order exists with id "order-abc"
    When I request order "order-abc"
    Then the response status is 200
    And the response includes orderNumber and verificationCode

  @integration-only
  Scenario: Unknown order returns 404
    When I request order "order-does-not-exist"
    Then the response status is 404

  @integration-only
  Scenario: Wrong verification code returns 403
    Given an order exists with verificationCode "AB-1234"
    When I request the order by txosnaId, orderNumber, and verificationCode "ZZ-9999"
    Then the response status is 403
```

---

### Phase 5 — Self-service order (`features/customer/self-service-order.feature`)

```gherkin
Feature: Self-service order
  As a customer at the festival
  I want to place my own order and pay with cash
  So that I can skip the queue at the counter

  Background:
    Given the txosna "aste-nagusia" exists and is OPEN

  @smoke
  Scenario: Customer places a self-service order
    When I submit a SELF_SERVICE order for "aste-nagusia" with paymentMethod "CASH"
    Then the response status is 201
    And the order status is "PENDING_PAYMENT"
    And no tickets are created yet

  @integration-only
  Scenario: Volunteer confirms cash payment
    Given a PENDING_PAYMENT order exists
    And I am authenticated as a volunteer
    When I POST to confirm the order
    Then the order status is "CONFIRMED"
    And tickets are created
    And a "order:confirmed" SSE event is broadcast

  @integration-only
  Scenario: Expired order cannot be confirmed
    Given a PENDING_PAYMENT order exists with expiresAt in the past
    And I am authenticated as a volunteer
    When I POST to confirm the order
    Then the response status is 409

  @integration-only
  Scenario: Order can be cancelled with a reason
    Given a PENDING_PAYMENT order exists
    When I POST to cancel the order with reason "CUSTOMER"
    Then the order status is "CANCELLED"
    And the cancellation reason is "CUSTOMER"
    And a "order:cancelled" SSE event is broadcast

  @e2e @smoke
  Scenario: Customer completes self-service order flow in browser
    Given the txosna "aste-nagusia" is open
    When I navigate to the menu for "aste-nagusia"
    And I add "Burgerra" to my cart
    And I fill in my name "Amaia" and submit the order
    Then I see the order confirmation page with an order number
```

---

### Phase 6 — Volunteer management (`features/admin/volunteer-management.feature`)

```gherkin
Feature: Volunteer management
  As an association admin
  I want to manage volunteers
  So that I can control who has access to the txosna tools

  Background:
    Given I am authenticated as an ADMIN for association "elkartea-1"

  @smoke
  Scenario: Admin creates a volunteer
    When I POST a new volunteer with email "berri@test.com" and password "secure123"
    Then the response status is 201
    And the stored volunteer has a hashed password (not plaintext)

  @integration-only
  Scenario: Volunteer cannot create other volunteers
    Given I am authenticated as a VOLUNTEER
    When I POST a new volunteer
    Then the response status is 403

  @integration-only
  Scenario: Admin soft-deletes a volunteer
    Given volunteer "vol-1" exists and is active
    When I DELETE volunteer "vol-1"
    Then volunteer "vol-1" has active set to false

  @integration-only
  Scenario: PIN authentication succeeds with correct PIN
    Given the txosna "aste-nagusia" has PIN "1234"
    When I POST to /auth/pin with slug "aste-nagusia" and pin "1234"
    Then the response status is 200
    And the body contains valid: true

  @integration-only
  Scenario: Wrong PIN returns invalid without leaking status
    When I POST to /auth/pin with slug "aste-nagusia" and pin "0000"
    Then the response status is 200
    And the body contains valid: false
```

---

### Phase 7 — Txosna settings (`features/admin/txosna-settings.feature`)

```gherkin
Feature: Txosna settings management
  As an association admin
  I want to configure my txosna
  So that I can control its availability and payment options

  Background:
    Given I am authenticated as an ADMIN
    And the txosna "aste-nagusia" exists

  @smoke
  Scenario: Admin sets txosna to PAUSED
    When I PATCH settings for "aste-nagusia" with status "PAUSED"
    Then the response status is 200
    And fetching the txosna returns status "PAUSED"
    And a "txosna:status_changed" SSE event is broadcast

  @integration-only
  Scenario: Volunteer cannot change settings
    Given I am authenticated as a VOLUNTEER
    When I PATCH settings for "aste-nagusia" with status "OPEN"
    Then the response status is 403

  @integration-only
  Scenario: Invalid status value is rejected
    When I PATCH settings for "aste-nagusia" with status "MAYBE"
    Then the response status is 422
```

---

### Phase 8 — Reports (`features/admin/reports.feature`)

```gherkin
Feature: Txosna daily and weekly reports
  As an association admin
  I want to view order summaries
  So that I can track revenue and product performance

  Background:
    Given I am authenticated as an ADMIN
    And the txosna "aste-nagusia" has 10 confirmed orders and 2 cancelled orders today

  @smoke
  Scenario: Admin views today's report
    When I request reports for "aste-nagusia" with period "today"
    Then the response status is 200
    And ordersTotal is 12
    And ordersConfirmed is 10
    And ordersCancelled is 2

  @integration-only
  Scenario: Revenue includes variant and modifier price deltas
    Given an order contains a product with a variant adding €1.50
    When I request the report
    Then revenue reflects the variant price delta

  @integration-only
  Scenario: Period=today filters out yesterday's orders
    Given there are 5 orders created yesterday
    When I request reports with period "today"
    Then ordersTotal does not include yesterday's orders
```

---

### Phase 9 — Online payments (`features/payments/online-payment.feature`)

```gherkin
Feature: Online payment via Stripe
  As a customer
  I want to pay for my order online
  So that it is confirmed automatically

  Background:
    Given the txosna "aste-nagusia" exists and is OPEN
    And the payment provider is the FakePaymentProvider

  @smoke
  Scenario: Customer initiates an online payment session
    Given a PENDING_PAYMENT order "order-pay-1" exists
    When I POST to /payments/session with orderId "order-pay-1"
    Then the response status is 200
    And the response contains a redirectUrl
    And the order has a paymentSessionId stored

  @integration-only
  Scenario: Stripe webhook confirms order on successful checkout
    Given order "order-pay-1" has paymentSessionId "sess-abc"
    When I POST a Stripe webhook event "checkout.session.completed" for session "sess-abc"
    Then the order status is "CONFIRMED"
    And tickets are created for the order

  @integration-only
  Scenario: Stripe webhook cancels order on expired checkout
    Given order "order-pay-1" has paymentSessionId "sess-abc"
    When I POST a Stripe webhook event "checkout.session.expired" for session "sess-abc"
    Then the order status is "CANCELLED"
    And the cancellation reason is "TIMEOUT"

  @integration-only
  Scenario: Webhook with invalid signature is rejected
    When I POST a Stripe webhook with an invalid stripe-signature header
    Then the response status is 400

  @e2e @smoke
  Scenario: Customer pays online and sees confirmation
    Given the txosna "aste-nagusia" is open
    When I navigate to the menu and place an order with online payment
    Then I am redirected to the payment page
    And after payment the order status page shows "CONFIRMED"
```

---

### Phase 13 — TicketBAI fiscal invoices (`features/ticketbai/fiscal-invoice.feature`)

```gherkin
Feature: TicketBAI fiscal invoice issuance
  As an association admin
  I want every confirmed order to produce a fiscal invoice
  So that we comply with Basque Country tax regulations

  Background:
    Given the association has TicketBAI enabled with series "TB"
    And the MockTicketBaiProvider is active
    And the txosna "aste-nagusia" exists and is OPEN

  @smoke
  Scenario: Confirmed order triggers invoice issuance
    Given a PENDING_PAYMENT order "order-fiscal-1" exists
    When the volunteer confirms order "order-fiscal-1"
    Then a TicketBAI invoice is created for "order-fiscal-1"
    And the invoice has series "TB" and invoiceNumber 1
    And the invoice status is "MOCK"
    And order "order-fiscal-1" has a fiscalReceiptRef set

  @integration-only
  Scenario: Second invoice references first in the chain
    Given order "order-fiscal-1" has been confirmed and has invoice with chainId "abc123"
    When a second order "order-fiscal-2" is confirmed
    Then the second invoice's previousChainId equals "abc123"

  @integration-only
  Scenario: TicketBAI failure does not block confirmation
    Given the MockTicketBaiProvider is configured to throw an error
    When the volunteer confirms order "order-fiscal-1"
    Then the order status is "CONFIRMED"
    And no TicketBAI invoice is created

  @integration-only
  Scenario: No invoice when TicketBAI is disabled
    Given the association has TicketBAI disabled
    When the volunteer confirms an order
    Then no TicketBAI invoice is created

  @integration-only
  Scenario: Admin retrieves config
    When I GET /api/associations/{id}/ticketbai
    Then the response status is 200
    And the response includes series "TB"

  @integration-only
  Scenario: Unauthorized access is rejected
    Given I am not authenticated
    When I GET /api/associations/{id}/ticketbai
    Then the response status is 401

  @e2e @smoke
  Scenario: Customer sees fiscal invoice on tracking page
    Given a counter order has been confirmed and a TicketBAI invoice issued
    When the customer visits the tracking page with the verification code
    Then the "Txartel argia / Faktura" section is visible
    And the invoice reference and QR link are shown
```

---

## CI pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  1. lint + typecheck                                            │
├─────────────────────────────────────────────────────────────────┤
│  2. vitest run            (unit + store + component tests)      │
├─────────────────────────────────────────────────────────────────┤
│  3. cucumber --profile integration   (all phases, <30 s)        │
├─────────────────────────────────────────────────────────────────┤
│  4. next build                                                  │
├─────────────────────────────────────────────────────────────────┤
│  5. next start (bg) + cucumber --profile e2e  (@smoke only)     │
└─────────────────────────────────────────────────────────────────┘
```

Steps 2 and 3 run in parallel. Step 5 runs only on PRs targeting `main`.

Nightly build runs step 5 with `@e2e or @smoke` (all e2e scenarios, including `@slow`).

---

## Coverage targets

| Layer                   | Target                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| Vitest unit/store tests | 100% branch coverage on `src/lib/store/`; 100% on `src/lib/ticketbai/` |
| Cucumber integration    | Every route from phases 1–13 has ≥1 `@smoke` scenario                  |
| Cucumber e2e            | Happy path per user role: customer, volunteer, admin                   |
| React components        | Snapshot regression only (Vitest)                                      |

---

## New dependencies to add

```bash
npm install --save-dev \
  @cucumber/cucumber \
  @playwright/test \
  playwright \
  ts-node
```

`playwright install chromium` in CI before step 5.
