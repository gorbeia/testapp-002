# E2E Coverage Analysis

_Session 21 — May 2026_

---

## 1. Test Infrastructure Overview

The project runs three distinct test layers:

| Layer       | Tool                                              | Profile                 | Speed   |
| ----------- | ------------------------------------------------- | ----------------------- | ------- |
| Unit        | Vitest                                            | `pnpm test`             | < 10 s  |
| Integration | Cucumber (direct handler calls, in-memory store)  | `pnpm test:integration` | < 30 s  |
| E2E         | Cucumber + Playwright (real browser, real server) | `pnpm test:e2e`         | minutes |

Integration tests call route handlers directly without a browser — they are the fastest way to verify business logic, API contracts, and SSE broadcasts. E2E tests run a full browser against a live Next.js dev server and cover the UI flows that matter most to real users.

---

## 2. Current Coverage Map

### 2.1 Feature files (28 total)

#### Admin (8 files)

| Feature                 | Integration | E2E (browser)                                        |
| ----------------------- | ----------- | ---------------------------------------------------- |
| admin-login             | —           | smoke: login flow, association selection             |
| admin-pages             | —           | smoke: products, settings, reports, volunteers pages |
| reports                 | 3 scenarios | —                                                    |
| ticketbai-ledger        | —           | smoke: ledger renders, invoice table                 |
| ticketbai-settings      | —           | smoke: BEZ tab, toggle, VAT types                    |
| txosna-settings         | 2 scenarios | smoke: pause txosna                                  |
| txosna-settings-kitchen | —           | smoke: kitchen posts tab                             |
| volunteer-management    | 4 scenarios | smoke: create volunteer                              |
| volunteer-update        | 5 scenarios | smoke: update name/role/status                       |

#### Customer / Public (9 files)

| Feature             | Integration | E2E (browser)                                          |
| ------------------- | ----------- | ------------------------------------------------------ |
| public-menu         | 2 scenarios | smoke: categories, product cards, switching            |
| checkout-flow       | —           | smoke: add to cart, checkout, cash payment             |
| order-tracking      | —           | smoke: entry page, wrong code, correct lookup, invoice |
| order-status        | —           | smoke: status page, TicketBAI section                  |
| order-board         | —           | smoke: board with status columns                       |
| pickup-proof        | —           | smoke: proof page with QR                              |
| self-service-order  | 4 scenarios | **@wip** browser scenario only                         |
| public/order-status | 3 scenarios | —                                                      |
| public/txosna-menu  | 5 scenarios | —                                                      |

#### Volunteer (7 files)

| Feature               | Integration | E2E (browser)                                |
| --------------------- | ----------- | -------------------------------------------- |
| pin-access            | —           | smoke: 7 scenarios (UI, routing, errors)     |
| kitchen-manager       | —           | smoke: coordinator view                      |
| kds                   | —           | smoke: columns, post name                    |
| food-counter          | —           | smoke: main view, form, variants, submission |
| drinks-counter        | —           | smoke: renders                               |
| status-overview       | —           | smoke: stat cards                            |
| counter/create-order  | 8 scenarios | —                                            |
| counter/order-listing | 4 scenarios | —                                            |

#### KDS (1 file)

| Feature          | Integration | E2E (browser) |
| ---------------- | ----------- | ------------- |
| ticket-lifecycle | 8 scenarios | —             |

#### Payments (2 files)

| Feature                 | Integration | E2E (browser)                  |
| ----------------------- | ----------- | ------------------------------ |
| online-payment (Stripe) | 4 scenarios | **@wip** browser scenario only |
| redsys-payment          | 4 scenarios | **none**                       |

#### Security (1 file)

| Feature          | Integration | E2E (browser) |
| ---------------- | ----------- | ------------- |
| tenant-isolation | 8 scenarios | —             |

### 2.2 Unit tests (18 test files, ~4 200 lines)

- Memory store adapter — comprehensive
- Cart context — comprehensive
- API routes: txosnak orders/settings/reports, associations volunteers/ticketbai/payment-provider-validate
- Payment routes: Stripe and Redsys webhook handling
- Components: button, confirm-dialog, status-badge, ticket-card
- Hooks: use-product-config
- TicketBAI mock provider

---

## 3. Gap Analysis

### P0 — Revenue path: no browser-level test exists

**Self-service order (cash)**
The browser scenario in `self-service-order.feature` is tagged `@wip` and excluded from CI. No browser test verifies the full customer journey: browse menu → add to cart → fill name → place order → see order confirmation page.

**Self-service order (online payment / Redsys)**
There is no browser test for the online payment funnel at all. The four scenarios in `redsys-payment.feature` are `@integration-only`. The `@wip` scenario in `online-payment.feature` covers Stripe only. Redsys has zero browser coverage.

### P1 — Operational path: real-time chain untested end-to-end

**Counter order → KDS ticket visible**
The food counter has browser smoke tests for submitting an order. The KDS has browser smoke tests for rendering. But no test verifies that submitting a counter order causes a ticket to appear in the KDS — the SSE chain between them is untested in a browser.

**Order confirmed → customer order screen updates**
The order status page has a smoke test that it renders. No test verifies that a real-time `order:confirmed` SSE event updates the page without a refresh.

### P2 — UI correctness gaps

**Wrong PIN / repeated failures**
`pin-access.feature` tests routing after a correct PIN. No test asserts the error state UI for a wrong PIN.

**Locale rendering**
`next-intl` with `[locale]` routing is a core structural choice. No test verifies that the UI renders correctly in `eu` / `es` / `en`, or that switching locale does not break navigation.

**Product change propagates to customer menu**
Admin can disable/enable a product. No test verifies the customer menu immediately reflects that change.

**Session expiry mid-flow**
No test covers session expiry while an admin is on a protected page.

### P3 — Reliability edge cases

**SSE reconnect**
Client-side SSE reconnection after a disconnect is not tested in any layer. A silent failure here means customers see stale order state.

**Webhook idempotency**
Stripe has an `@integration-only` test for duplicate webhooks; Redsys does not. Double-confirmation could cause duplicate tickets.

**Demo reset reachable in production**
`POST /api/demo/reset` is used to seed integration tests. No guard test verifies it is blocked in production mode.

---

## 4. Plan: Self-Service + Redsys E2E Tests

This section defines the scenarios to add and the implementation approach for the two highest-priority gaps.

### 4.1 Scope

Two feature files receive new browser scenarios:

- `features/customer/self-service-order.feature` — cash and Redsys online payment flows
- `features/payments/redsys-payment.feature` — Redsys-specific browser flow

### 4.2 Scenarios to add

#### `features/customer/self-service-order.feature`

**Scenario A — Cash self-service (promotes existing @wip)**

```gherkin
@e2e @smoke
Scenario: Customer completes cash self-service order in browser
  Given the txosna "aste-nagusia" is open
  When I navigate to the menu for "aste-nagusia"
  And I add "Burgerra" to my cart
  And I fill in my name "Amaia" and submit the order
  Then I see the order confirmation page with an order number
  And the order status is "PENDING_PAYMENT"
```

**Scenario B — Online payment (Redsys) self-service**

```gherkin
@e2e @smoke
Scenario: Customer completes self-service order with Redsys online payment
  Given the txosna "aste-nagusia" is open and accepts online payments via Redsys
  When I navigate to the menu for "aste-nagusia"
  And I add "Burgerra" to my cart
  And I choose to pay online
  Then I am redirected to the Redsys payment page
  When the Redsys payment succeeds for my order
  Then the order status page shows "CONFIRMED"
```

**Scenario C — Failed Redsys payment leaves order pending**

```gherkin
@e2e
Scenario: Customer sees pending state when Redsys payment is cancelled
  Given the txosna "aste-nagusia" is open and accepts online payments via Redsys
  When I navigate to the menu for "aste-nagusia"
  And I add "Burgerra" to my cart
  And I choose to pay online
  Then I am redirected to the Redsys payment page
  When the Redsys payment is cancelled for my order
  Then I see the order has been cancelled
```

#### `features/payments/redsys-payment.feature`

**Scenario E — Redsys redirect page renders correct signed form**

```gherkin
@e2e @smoke
Scenario: Redsys redirect page renders a signed payment form
  Given a PENDING_PAYMENT order exists with id "order-redsys-e2e"
  And a Redsys payment provider is configured for the txosna
  When I GET /api/payments/redsys/redirect with a valid session payload
  Then the page auto-submits a form to the Redsys TPV endpoint
  And the form contains Ds_SignatureVersion, Ds_MerchantParameters, and Ds_Signature fields
```

### 4.3 Implementation approach

#### Mock strategy for external Redsys redirect

Redsys E2E tests cannot use the real TPV. The approach avoids any external network call:

**Step 1 — Seed a Redsys provider using FakePaymentProvider**

The integration test world already uses `FakePaymentProvider`. The E2E world must do the same. Before the scenario, insert a payment provider record that resolves to `FakePaymentProvider` (identified by a test-only `providerType` value, or by setting `FAKE_PAYMENT_PROVIDER=redsys` in the test environment).

**Step 2 — Intercept the Redsys redirect URL at the browser level**

When the customer taps "Pay online", the app calls `POST /api/payments/session` and receives a `redirectUrl`. That URL points to `/api/payments/redsys/redirect?...`, which renders an HTML page with an auto-submitting `<form action="https://sis-t.redsys.es/...">`.

Use Playwright `page.route()` to intercept the outbound POST to the Redsys TPV host and abort it. The step definition captures the `sessionId` from the redirect URL's query parameters before the intercept fires.

```typescript
// In E2E step definition
await this.page.route('https://sis-t.redsys.es/**', (route) => route.abort());
```

**Step 3 — Simulate the webhook from inside the step definition**

After capturing the `sessionId`, the step definition posts a fake Redsys webhook notification directly to the app:

```typescript
const webhookBody = buildFakeRedsysNotification(sessionId, 'succeeded');
await fetch(`${this.baseUrl}/api/payments/webhook/redsys`, {
  method: 'POST',
  body: webhookBody,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});
```

`buildFakeRedsysNotification` constructs a valid `Ds_MerchantParameters` + `Ds_Signature` using the test signing key configured for the FakePaymentProvider. This tests the real webhook signature verification path.

**Step 4 — Navigate to the return URL and assert**

After the webhook completes, navigate to the order status page and assert that the order shows `CONFIRMED`. The page must update without a full refresh (SSE path) or the step must explicitly wait for the status element to change.

#### Step definitions needed

**New E2E steps (add to `features/step-definitions/e2e/customer.steps.ts`):**

```
Given the txosna {string} is open and accepts online payments via Redsys
When I choose to pay online
Then I am redirected to the Redsys payment page
When the Redsys payment succeeds for my order
When the Redsys payment is cancelled for my order
Then the order status page shows {string}
Then I see the order has been cancelled
```

**New shared helper (`features/step-definitions/e2e/payments.steps.ts`):**

```
Given a Redsys payment provider is configured for the txosna
When I GET /api/payments/redsys/redirect with a valid session payload
Then the page auto-submits a form to the Redsys TPV endpoint
And the form contains {string}, {string}, and {string} fields
```

**Helper functions needed:**

- `buildFakeRedsysNotification(sessionId, status)` — constructs `Ds_MerchantParameters` Base64 JSON with `Ds_Order = sessionId`, `Ds_Response = '0000'` for success or `'0190'` for failure, plus valid HMAC-SHA256 signature using test key
- `extractSessionIdFromRedsysRedirect(url)` — parses the redirect URL to extract `sessionId` from query params or the redirect page's form fields

#### Required test environment setup

The following must be set before the E2E suite starts:

```
PROTO_MODE=true              # skip NextAuth session checks in API routes
FAKE_PAYMENT_PROVIDER=true   # use FakePaymentProvider for Redsys routes
BASE_URL=http://localhost:3000
```

The `FakePaymentProvider` must be extended (or a `FakeRedsysProvider` created) that:

- Returns a `redirectUrl` pointing to `/api/payments/redsys/redirect?sessionId=...`
- Uses a known test signing key (`REDSYS_TEST_KEY`) for HMAC verification
- Returns `{ url, sessionId }` from `createSession()` so the E2E step can capture the `sessionId`

#### Acceptance criteria for Scenario A (cash)

- [ ] Menu page loads at `/en/aste-nagusia`
- [ ] Product "Burgerra" can be added to cart
- [ ] Checkout page shows order summary with correct total
- [ ] Name field is required (order cannot submit without it)
- [ ] After submission, redirect to `/en/order/[id]`
- [ ] Order number is displayed
- [ ] Status shows `PENDING_PAYMENT`

#### Acceptance criteria for Scenario B (Redsys success)

- [ ] After choosing online payment, browser navigates to `/api/payments/redsys/redirect`
- [ ] Redirect page contains the auto-submit form (Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature)
- [ ] Playwright route intercept blocks outbound POST to Redsys TPV
- [ ] Step definition posts a success webhook with valid signature
- [ ] Order status page transitions to `CONFIRMED` within 3 seconds (SSE)
- [ ] No page refresh required for the status update

#### Acceptance criteria for Scenario C (Redsys cancel)

- [ ] Step definition posts a failure webhook (`Ds_Response` not `0000`)
- [ ] Order status transitions to `CANCELLED`
- [ ] Customer sees appropriate cancellation message

### 4.4 Sequencing

These scenarios depend on each other being stable in this order:

1. **Scenario A (cash)** — validates that the menu → cart → checkout → confirmation UI works without payment complexity. Unblocks all Redsys scenarios because it proves the ordering flow itself is solid.
2. **Scenario E (redirect form)** — validates that the Redsys redirect page renders a correctly signed form before attempting the full flow.
3. **Scenario B (Redsys success)** — end-to-end happy path.
4. **Scenario C (Redsys cancel)** — failure path; only add after B is green.

### 4.5 Files to create or modify

| File                                              | Change                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| `features/customer/self-service-order.feature`    | Promote @wip scenario to @e2e @smoke; add Scenarios B and C       |
| `features/payments/redsys-payment.feature`        | Add Scenario E                                                    |
| `features/step-definitions/e2e/customer.steps.ts` | Add online payment step definitions                               |
| `features/step-definitions/e2e/payments.steps.ts` | New file: Redsys redirect form assertions                         |
| `features/step-definitions/e2e/world.ts`          | Add `capturedSessionId` and Playwright route intercept helpers    |
| `src/lib/payments/fake-redsys-provider.ts`        | New: FakeRedsysProvider with test signing key and session capture |

---

## 5. Remaining Gap Backlog (post-Redsys)

After the self-service + Redsys scenarios are green, the next highest-value additions are:

| Priority | Scenario                                                    | Effort                   |
| -------- | ----------------------------------------------------------- | ------------------------ |
| P1       | Counter order → ticket appears on KDS (SSE chain)           | Medium                   |
| P1       | Order confirmed SSE → customer page updates without refresh | Medium                   |
| P2       | Wrong PIN shows error UI                                    | Small                    |
| P2       | Locale smoke (eu/es/en): key pages render without raw keys  | Small                    |
| P2       | Admin product disable → customer menu reflects it           | Medium                   |
| P3       | SSE reconnect after disconnect                              | Large                    |
| P3       | Redsys webhook idempotency                                  | Small (integration test) |
| P3       | Demo reset blocked in production mode                       | Small (unit test)        |

---

_Last updated: session 21_
