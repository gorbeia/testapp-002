# Txosna App — Test Plan

_Session 18 — April 2026_

---

## Guiding Principles

The app has three distinct runtime contexts that each carry different risk profiles: **operational screens** (high frequency, low tolerance for errors — a wrong order or missed sold-out flag has immediate real-world consequences), **customer screens** (high exposure, zero friction tolerance), and **admin screens** (low frequency, high complexity). Tests should reflect this — operational and customer paths deserve the most thorough coverage at every level.

Real-time correctness (SSE propagation) and multitenancy isolation are the two systemic risks that cut across all features. Both need explicit test surface at every level.

---

## Unit Tests

Unit tests cover pure logic: calculations, state machines, business rules, and data transformations. No database, no network.

### Pricing & Order Line Calculation

- Effective order line price = base price + variant deltas + modifier prices, with all permutations
- Price override on TxosnaProduct replaces default price correctly
- Zero-delta variants do not change the price
- Negative prices are rejected (validation)
- Prices captured at order time; subsequent menu price changes do not affect the captured value

### Effective Allergens

- Union of product + selected variant options + selected modifier allergens
- No duplicates in the union
- Empty product allergens + allergen-carrying modifier produces correct result
- All 14 EU allergens representable

### Orderable Rule

The boolean predicate `available AND NOT sold_out AND txosna.status = OPEN AND NOT is_demo AND channel in enabled_channels` should be unit-tested exhaustively across all flag combinations. Eight combinations of the boolean flags, plus channel filtering.

### Order & Ticket Lifecycle State Machine

- Valid transitions: PENDING_PAYMENT → CONFIRMED, CONFIRMED → ticket statuses, each ticket status forward
- Invalid transitions rejected (e.g. READY → IN_PREPARATION, COMPLETED → any)
- CANCELLED is terminal — no further transitions
- Drinks ticket: RECEIVED → READY when `requires_preparation = false`; full lifecycle when true

### Cancellation Reason Assignment

- TIMEOUT fires when `expires_at` is in the past
- SOLD_OUT assigned when a pending order contains a now-sold-out product
- END_OF_SERVICE assigned to all open orders on txosna close
- VOLUNTEER and CUSTOMER reasons only assignable via explicit action

### Wait Time Estimate

- Not emitted until 5 completed tickets in the current session
- Rolling average only considers IN_PREPARATION duration of the current session
- Slow order threshold: ticket time > 2× current rolling average
- Session boundary: new session (new PIN entry) resets the average

### Verification Code Generation

- Codes are alphanumeric, correct length
- No ambiguous characters (0/O, 1/l/I) — check character set
- Codes are unique within a txosna session (collision resistance test with large sample)

### Pending Payment Timeout

- `expires_at` is set correctly based on `pending_payment_timeout` configuration
- Auto-cancel logic fires at or after `expires_at`, never before
- Already-cancelled orders are not cancelled again

### Slug Validation

- Slug is URL-safe (no spaces, special characters)
- Slug uniqueness enforced within the system
- Slug used correctly to construct public URL

### Counter Routing

- FOOD category type → food ticket
- DRINKS category type → drinks ticket
- SINGLE counter → one ticket with all lines
- SEPARATE counters → two tickets, lines split by category type

### Multitenancy Filtering

Unit-test the query-building layer: every entity query must include `associationId`. Test that a query built for association A cannot return data belonging to association B, even if IDs are guessed.

### Password Reset Token

- Token is single-use: second use of same token is rejected
- Token expiry enforced: expired token is rejected
- Valid token within expiry is accepted

---

## Integration Tests

Integration tests verify that components work correctly together, with a real database (test instance) and real application logic, but without a running browser or end-to-end UI.

### Authentication & Access Control

- Login with valid credentials returns session
- Login with invalid credentials is rejected
- Expired session is rejected on protected routes
- Admin role can access configuration endpoints; Volunteer role cannot
- Volunteer can access operational endpoints; unauthenticated requests cannot
- Customer-facing routes (public txosna URL) are accessible without auth
- Cross-tenant access: volunteer from association A cannot read orders from association B, even with a valid session

### PIN Entry

- Correct PIN grants access to the selected mode
- Incorrect PIN is rejected
- PIN is hashed — raw PIN is not stored or returned in any response

### Order Creation (Phone-to-Counter)

- Order created with correct status PENDING_PAYMENT
- `expires_at` set from txosna configuration
- `local_storage_key` stored correctly
- Order with age-restricted product accepted; age declaration field present
- Order with disabled product is rejected
- Order with sold-out product is rejected
- Order with demo txosna returns error (not visible to customers)
- Order placed on a PAUSED txosna is rejected
- Order placed on a CLOSED txosna is rejected

### Order Confirmation (Counter)

- Confirming a PENDING_PAYMENT order transitions it to CONFIRMED
- Tickets created with correct counter_type routing
- Confirming a PENDING_PAYMENT order that has a sold-out product: order flagged, not confirmed
- Confirming an already-confirmed order is idempotent (no duplicate tickets)
- Confirming an expired order is rejected

### Ticket Lifecycle Transitions

- Each valid transition persists the correct status and timestamp
- `ready_at` set when transitioning to READY
- `completed_at` set when transitioning to COMPLETED
- Invalid transition returns 4xx
- Transitioning food ticket does not affect drinks ticket state (and vice versa)

### Sold Out Propagation

- Marking a product sold out updates the TxosnaProduct record
- Existing PENDING_PAYMENT orders with that product are flagged for cancellation
- Already-confirmed, in-preparation orders are flagged (not auto-cancelled)
- Reactivating a sold-out product clears the flag

### Order Editing

- Editing a RECEIVED ticket recalculates prices correctly
- Editing an IN_PREPARATION ticket sets `order_changed_alert` flag on the ticket
- Editing a READY or COMPLETED ticket is rejected
- Price difference is returned in the edit response

### Menu & TxosnaProduct

- Product created at association level is available to all txosnak in the association
- TxosnaProduct price override takes precedence over default price
- Disabling a product (available = false) excludes it from the orderable set
- Copying TxosnaProduct entries from a demo txosna to a real txosna copies all fields correctly
- Deleting a category cascades correctly (products, variants, modifiers)

### Event Report Generation

- Report only accessible after txosna is CLOSED
- Report totals match the sum of completed orders in the database
- Cancelled orders excluded from revenue totals
- Busiest period calculation reflects actual order timestamps
- PDF generation produces a valid PDF file

### Txosna Status Transitions

- OPEN → PAUSED: new orders rejected; existing tickets continue
- PAUSED → OPEN: orders accepted again
- OPEN/PAUSED → CLOSED: all open orders cancelled with END_OF_SERVICE reason; notifications queued
- CLOSED → OPEN (reopen): txosna accepts orders again; previously cancelled orders remain cancelled

### SSE Broadcast

Integration-test the broadcast layer without a real browser: after a ticket status change, the correct SSE event is emitted to all registered clients for that txosnaId. Verify that clients registered for txosna B do not receive events from txosna A.

### Password Reset Flow

- Request reset: token created, email queued
- Valid token within expiry: password updated, token invalidated
- Expired token: rejected
- Already-used token: rejected
- New password works for login; old password does not

### Multitenancy Isolation (Database Layer)

- Query for orders with association A's session cannot return association B's orders, even with crafted IDs
- TxosnaProduct entries are scoped correctly to the owning association
- Category and product queries return only the requesting association's data

---

## End-to-End Tests

E2E tests run a real browser against a running instance. Use Playwright. Test the flows that matter most to real users under realistic conditions. Organised by actor.

### Customer — Phone-to-Counter Ordering

**Happy path:**

1. Customer visits public txosna URL; language selection works
2. Menu renders with correct categories, products, prices, dietary flags, allergen icons
3. Sold-out products are visually greyed out and unorderable
4. Tapping a product opens the detail sheet; variant selector is required; Add to Order disabled until variant selected
5. Cart accumulates correctly; floating "View order" bar appears
6. Order summary shows correct totals; name field is required
7. Placing order transitions to post-order screen; order number shown; next steps clear
8. Order status screen shows PENDING_PAYMENT; updates to RECEIVED in real time when volunteer confirms
9. Status updates to IN_PREPARATION, then READY in real time — no page refresh required
10. Pickup proof screen shows order number, verification code, QR (if enabled), counter indicator
11. Screen does not dim (WakeLock)
12. All tickets COMPLETED → receipt download available as PDF

**Edge cases:**

- Age-restricted product: age declaration checkbox required; cannot place order without it
- Order placed; product sold out before volunteer confirms: cancellation notification displayed
- Pending payment timeout expires: cancellation notification with TIMEOUT reason displayed
- Page refresh during active order: order recovered from local storage
- Push notification permission granted: confirmation displayed; notification received when order is READY

### Volunteer — Food Counter

**Happy path:**

1. Login with email and password
2. PIN entry selects food counter mode
3. Pending phone orders list shows all PENDING_PAYMENT orders; time elapsed visible
4. Tapping a pending order: full detail with items, variants, modifiers, notes shown
5. Age-restricted product: age verification prompt shown and must be acknowledged
6. Cash amount field calculates correct change
7. Confirm payment: order moves to RECEIVED; disappears from pending list
8. Registering a counter order: browse menu, select product, configure variants, add to order, confirm
9. Quick-add buttons show recently ordered products
10. New counter order creates ticket immediately in RECEIVED state
11. READY orders section shows tickets ready for pickup; customer name visible

**Edge cases:**

- Editing an IN_PREPARATION ticket: order changed alert visible on kitchen screen
- Pausing: new orders rejected; resume restores ordering
- Cross-counter access tab: drinks tickets visible and actionable

### Volunteer — Drinks Counter

1. PIN entry selects drinks counter mode
2. Product grid renders; one tap adds product to running order
3. Order tally updates; total calculated correctly
4. Variant-required product: bottom sheet shown with variant options only; dismisses after selection
5. Age-restricted product: Confirm replaced with "Verify ID & Confirm"; cannot bypass
6. Confirm sends order; grid clears for next order
7. Pending phone order badge shows count; tapping allows quick payment confirmation
8. Pause button blocks new orders

### Volunteer — Kitchen (KDS)

1. PIN entry selects kitchen mode
2. Tickets appear in RECEIVED column on order confirmation
3. "→ Start" button transitions to IN_PREPARATION
4. "→ Ready" transitions to READY; customer notified
5. Ticket in IN_PREPARATION for > 2× average: slow order indicator (⏱) shown
6. Order changed alert (🔔) visible if counter edited the ticket while in preparation
7. Preparation instructions: book icon opens full-screen overlay; dismisses on tap
8. Sold out management: one tap marks product sold out; propagates to order screen immediately
9. Closing the txosna: confirmation required; all open tickets cancelled

**Layout:**

- Tablet landscape: three-column Kanban
- Phone portrait: single column with status filter tabs

### Customer — Order Board

1. Order board accessible via public txosna URL without login
2. IN_PREPARATION orders show with name/order number
3. READY orders appear in READY column with green background; slide transition from IN_PREPARATION column plays
4. Slow orders highlighted in amber in IN_PREPARATION column
5. Wait time estimate shown after 5 completed tickets; updates in real time
6. Board readable at distance (visual check — large text, high contrast)
7. Txosna PAUSED or CLOSED: appropriate message shown; no menu visible

### Admin — Configuration

1. Self-registration: fill name/email/password; onboarding guide shown immediately
2. Onboarding guide: each step links to correct screen; completion state persists; dismissible after all steps done
3. Create event; create txosna with slug; public URL constructed correctly
4. Demo txosna: is_demo flag set; public URL not active; test orders placeable
5. Copy demo configuration to real txosna: all TxosnaProduct entries transferred
6. Menu management: add category (FOOD/DRINKS), add product, set variants and modifiers, reorder via drag-and-drop
7. Allergen selector: visual grid; selected allergens appear on product
8. Preparation instructions: Markdown editor with preview; images embeddable
9. Price override on TxosnaProduct: overrides default price in ordering flow
10. Volunteer management: add volunteer; volunteer can log in; deactivate volunteer; login rejected after deactivation
11. Event report: available after txosna closed; correct totals; downloadable PDF

### Cross-cutting — Real-time & SSE

1. Two browser sessions open (volunteer counter + customer order screen): status change in one updates the other within 2 seconds
2. Client disconnects and reconnects: SSE reconnects; state is consistent with current server state
3. Connectivity indicator shows "Reconnecting..." during disconnect; clears on reconnect

### Cross-cutting — Multitenancy

1. Admin from association A cannot access any screens, orders, or menu data belonging to association B, even by manipulating URLs or IDs
2. Volunteer from association A's session token cannot be used to call association B's API endpoints

### Cross-cutting — Localisation

1. Switching language (EU/ES/FR/EN) updates all visible UI strings including: product names, status labels, error messages, notifications
2. Language preference persisted in URL locale prefix (volunteer) and browser storage (customer)
3. Basque and French locales render correctly (special characters: ñ, ü, ç, etc.)

### Cross-cutting — Accessibility

1. Full customer ordering flow completable using keyboard only
2. Pickup proof screen passes automated contrast checker (WCAG AAA)
3. All form fields have associated labels (no placeholder-only labelling)
4. Screen reader announces ticket status changes on order status screen
5. Touch targets on operational screens visually ≥ 56px

---

## Test Data & Environment Notes

- Each test suite should run against a seeded test database with at least two associations, confirming isolation
- SSE tests require a persistent HTTP connection — ensure the test runner does not time out long-lived connections
- Playwright tests for operational screens should simulate a portrait phone viewport (375×812) as baseline, with a second pass at tablet (1024×768 landscape) for the KDS three-column layout
- PDF generation tests (receipts, event reports) should validate that the file is a valid PDF and contains expected text — full visual regression is optional
- The drinks counter speed tests should be measured: a two-product order should be completable in ≤ 4 taps from a cold screen

---

_Last updated: session 18_
