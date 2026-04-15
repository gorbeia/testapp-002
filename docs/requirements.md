# Txosna App — Requirements Document

_Session 17 — April 2026_

---

## 1. Project Overview

An application to manage food and drink ordering at **txosnak** — temporary stalls set up at local festivals by volunteer associations for fundraising purposes.

The application is **multitenant** — a single instance serves multiple associations, each managing their own data independently.

---

## 2. Context & Constraints

- Run by **volunteers** with varying levels of technical experience — the UI must be simple and fast
- Operates in a **festival environment**: potentially noisy, outdoors, busy
- Internet access is assumed to be available at the venue
- Associations have very different resources — from a single phone to tablets and large screens
- **All screens must work on small phone displays as the baseline**, scaling up gracefully (responsive, mobile-first design)
- **Customers do not need to register or create an account** — no login, no friction
- The application is **free to use** — no billing or subscription features required at this stage
- The app must be **accessible** — semantic HTML, screen reader support, sufficient colour contrast, large touch targets
- The app must be **multilingual** — Basque, Spanish, French, and English; user-selectable

---

## 3. Actors

| Actor             | Access method                  | Description                                                                                                               |
| ----------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Association admin | Email + password               | Full access: association configuration, payment providers, menu, events, txosnak, volunteer management; can also perform all volunteer operational tasks |
| Volunteer         | Email + password + session PIN | Operational access: food counter, drinks counter, kitchen, status overview                                                |
| Customer          | No account                     | Places and edits phone orders, receives notifications, shows pickup proof, downloads receipt                              |

> **Volunteer management is association-level only.** Volunteers have access to all txosnak in their association; there is no per-txosna volunteer assignment.

---

## 4. Multitenancy

- Single instance serves multiple associations
- Data isolated by filtering — no cross-association access
- All data belongs to an association

---

## 5. Association Self-Registration & Onboarding

### Registration

1. Representative fills in association name, email, and password
2. Account created with Admin role — first admin of the association
3. Admin is taken directly into the **onboarding guide**

### Onboarding guide

- A checklist-style guided setup flow shown to new admins after registration
- Walks the admin through: create first event, set up txosna, build menu, invite volunteers
- Step-by-step, skippable, and resumable — stays visible until all steps are completed
- Designed for non-technical volunteers

---

## 6. Access Model

### Roles

| Role      | Access                                                                           |
| --------- | -------------------------------------------------------------------------------- |
| Admin     | Full configuration and management + all operational screens                      |
| Volunteer | Operational screens only: food counter, drinks counter, kitchen, status overview |

### Volunteer accounts

- Personal email and password per volunteer
- Access to all txosnak in the association
- Admin manages accounts (create, deactivate)

### Device login flow

**Step 1 — Device login:** personal email and password
**Step 2 — Session PIN:** selects food counter, drinks counter, or kitchen mode

### Password reset

- Volunteer requests a password reset from the login screen
- Reset link sent by email; volunteer sets a new password
- Standard email-based flow; link expires after a short period

### Counter mode is a view filter, not an access restriction

- Default view shows the current counter's tickets only
- Cross-counter access always available but not prominently displayed
- Supports flexible volunteer coverage in a volunteer-run organisation

---

## 7. Infrastructure

### Cloud hosting

- No festival-side server needed; accessible from any browser-capable device with Internet
- Connectivity indicator on all screens; auto-reload of active order state on reconnection

### Real-time communication

- **Server-Sent Events (SSE)** for all real-time updates: order status, stock changes, pause/close events

### Device access & accessibility

- Any modern browser, any device — mobile-first, responsive design is a hard requirement
- Semantic HTML, screen reader support, high colour contrast for outdoor use, large touch targets

### Localisation

- Basque, Spanish, French, English — user-selectable
- All UI text, notifications, and receipts translatable

---

## 7a. Association Configuration

The following are configured once at association level and shared across all txosnak in the association:

| Setting                  | Notes                                                                        |
| ------------------------ | ---------------------------------------------------------------------------- |
| Association name         | Displayed throughout the admin UI                                            |
| Contact email            | Administrative contact for the association                                   |
| Payment providers        | Configure Stripe and/or Redsys credentials once; each provider can be enabled or disabled |
| Volunteer management     | Create, deactivate, and manage roles for all volunteers in the association   |

### Payment providers

- An association can configure one or more payment providers (Stripe, Redsys)
- Each provider stores its credentials (encrypted, AES-256-GCM) and a test-mode flag
- Individual txosnak select which of the association's enabled providers they accept
- If no provider is configured at association level, a txosna cannot accept online payments
- Credentials are masked in the UI; only administrators can view/update them
- Webhook URLs are displayed for each configured provider

### Provider credentials

| Provider | Fields                                          |
| -------- | ----------------------------------------------- |
| Stripe   | `publishableKey`, `secretKey`, `webhookSecret`  |
| Redsys   | `merchantCode` (FUC), `secretKey`, `terminal`   |

---

## 8. Txosna Configuration

Each txosna is independently configurable:

| Setting                   | Options                                                                    |
| ------------------------- | -------------------------------------------------------------------------- |
| Counter setup             | SINGLE or SEPARATE — whether food and drinks share a counter               |
| Enabled ordering channels | COUNTER, PHONE_TO_COUNTER, SELF_SERVICE (future)                           |
| Enabled payment methods   | CASH, ONLINE                                                               |
| Enabled payment providers | Select from providers configured at association level                      |
| Notification modes        | display, push, manual                                                      |
| QR validation             | On/off                                                                     |
| Pending payment timeout   | Minutes before unclaimed phone orders are auto-cancelled                   |
| Printing                  | On/off                                                                     |
| Demo mode                 | On/off — marks txosna as a sandbox for testing; never visible to customers |

### Payment provider selection

- Txosnak cannot configure payment credentials directly
- They select from the pool of providers configured at association level
- At least one payment provider must be enabled for card/online payments to work
- If no providers are configured at association level, the txosna shows a prompt linking to association settings

### Public URL

- Each txosna has a **unique public URL** (e.g. via subdomain: `elkartea.txosna.app`)
- Used to access the order board and customer ordering screens without login
- Admin displays or shares this URL/QR at the stall

---

## 9. Demo Txosna

- Admin can create a **demo txosna** — a sandbox for testing the full setup before a real event
- Demo txosnak are clearly marked throughout the app
- Admin can place test orders, verify the KDS, test QR scanning, and check notifications
- Demo txosnak are **never visible to customers** — the public URL is not active for demo txosnak
- Once the setup is validated, the admin can **copy the demo txosna's configuration** to a real txosna

### Cloning any txosna

- Any txosna (not just demo) can be cloned from the txosnak overview page via a "Klonatu" button
- Admin provides a new name for the clone
- The following are copied to the new txosna:
  - Counter setup (SINGLE/SEPARATE)
  - Enabled ordering channels
  - Enabled payment methods and selected providers
  - Notification modes
  - QR validation setting
  - Pending payment timeout
  - All TxosnaProduct entries (price overrides, availability, instruction overrides)
- The clone is created with status CLOSED — admin opens it when ready
- A new slug and PIN are generated for the clone
- The clone belongs to the same event and association as the original

---

## 10. Menu Management

### Master menu

- Defined at association level; shared across all txosnak
- Contains: categories (FOOD or DRINKS), products, variants, modifiers, images, preparation instructions, ingredients, display order, allergens, dietary flags

### Categories

- Admin defines categories with a **type**: FOOD or DRINKS
- Category type drives routing to the correct counter when separate counters are enabled
- Categories and products have **manually configurable display order**

### Product fields

| Field                    | Notes                                                        |
| ------------------------ | ------------------------------------------------------------ |
| Name                     | Required                                                     |
| Category                 | Required; determines FOOD or DRINKS routing                  |
| Default price            | Required                                                     |
| Description              | Optional                                                     |
| Customer-facing image    | Optional                                                     |
| Allergens                | Multi-select from 14 standard EU allergens                   |
| Dietary flags            | Vegetarian, vegan, gluten-free                               |
| Age-restricted           | Drink requires ID verification at counter before serving     |
| Splittable               | For food products ordered in multiple units                  |
| Requires preparation     | For drink products needing active preparation (e.g. mojito)  |
| Display order            | Within its category                                          |
| Ingredients list         | Simple text reference for volunteers; not used for inventory |
| Preparation instructions | Markdown with embedded images; general method                |

### Variant groups

- Required choices per product; each option has name, price delta, allergens
- Drinks counter UI simplified for speed

### Modifiers

- Optional additions/removals; each has name, price, allergens

### Effective order line price

```
base price (or override) + sum of variant deltas + sum of modifier prices
```

### Allergens

- Effective allergens = union of product + selected variants + selected modifiers
- Shown in real time as customer configures each order line

### Preparation instructions

- Two levels: product-level (master menu) and txosna-level override (event-specific)
- Shown on counter/KDS screens on demand — one tap per ticket card

### Per-txosna configuration (TxosnaProduct)

- Price override, available flag, preparation instructions override, sold out flag
- Admin can copy TxosnaProduct entries from a previous txosna or from a demo txosna

### Screens

**Master menu management** (`/admin/[locale]/menu`)

- Lists all association categories and their products
- Full CRUD on categories, products, variant groups/options, modifiers
- Display order configurable per category and per product
- Association-wide — not tied to any specific txosna

**Txosna product selection** (`/admin/[locale]/txosnak/[id]/products`)

- Shows the full master catalog grouped by category
- Toggle switch per product: enabled at this txosna / not offered
- When enabled: optional price override and preparation instructions override fields
- Sold out flag is operational (managed at the counter) — not editable here
- Writes only to `TxosnaProduct`; master catalog is read-only from this screen

---

## 11. Age Verification

- Drink products flagged as age-restricted trigger a **volunteer ID check prompt** at the counter
- Phone orders include a **customer declaration checkbox**
- Physical verification always performed by the volunteer at the counter

---

## 12. Order Tickets and Counter Routing

### Single counter

- One ticket per order; full RECEIVED → IN_PREPARATION → READY → COMPLETED lifecycle
- Customer picks up everything together

### Separate counters

- Order split into food ticket and drinks ticket on confirmation
- Each ticket has its own independent lifecycle
- Customer picks up food and drinks separately; notified independently per ticket
- Pickup proof shows which ticket is ready and at which counter

### Drinks ticket lifecycle

- Full lifecycle if any product has `requires_preparation = true`; otherwise RECEIVED → READY → COMPLETED
- Volunteer can always manually move to IN_PREPARATION

### Drinks counter interface

- Optimised for speed — a two-beer order in two taps
- Different measures are separate products in the master menu

---

## 13. QR Code Validation

- Configurable per txosna; QR shown on pickup proof
- Volunteer scans to confirm ticket validity, txosna membership, and READY status
- Also speeds up phone-to-counter payment flow
- Fallback: visual verification code and name check

---

## 14. Stock Management — Sold Out Products

- Counter or kitchen staff mark products as sold out; reactivatable at any time
- All screens update immediately via SSE
- Pending payment orders with sold out products cannot be accepted — must be cancelled
- Already-paid orders flagged; resolved in person

---

## 15. Order Notes and Item Splitting

- **Order notes**: free text per order; customer or volunteer; shown on ticket cards
- **Item splitting**: for splittable food products with quantity > 1; shown on ticket cards

---

## 16. Order Editing

- **Customer**: editable while PENDING PAYMENT only; clearly indicated in UI
- **Counter volunteer**: editable in RECEIVED or IN_PREPARATION; prices recalculated; editing IN_PREPARATION triggers order changed alert on kitchen screen
- READY or COMPLETED tickets cannot be edited
- Wrong item handed out: resolved manually in person

---

## 17. Cash Payment & Change Calculator

- Volunteer optionally enters amount given; app calculates change due
- Not stored on the order

---

## 18. Wait Time Estimate

- Rolling average preparation time from current session; shown to customers
- Only after minimum 5 completed tickets; updates in real time

---

## 19. Order Recovery

- Browser local storage links device to active orders; auto-retrieved on refresh
- Customer name required for phone orders — primary fallback

---

## 20. Cancellation Notifications

- All phone order cancellations notify customer with reason
- Via push if granted; otherwise via in-app message on next open

---

## 21. Customer Receipt

- Downloadable PDF after all tickets completed on customer's phone
- Contains: txosna name, event, date, order number, items, variants, modifiers, prices, total
- Not a fiscal document (TicketBAI is future)

---

## 22. Counter and Kitchen Pause

- Any logged-in volunteer can pause with a confirmation step
- Blocks new orders; existing tickets continue; resumable with single tap
- Counter pause and kitchen pause are independent controls

---

## 23. Pending Payment Timeout

- Configurable per txosna; auto-cancels unclaimed phone orders
- Customer notified; volunteer can also cancel manually

---

## 24. Slow Order Detection

- Rolling average IN_PREPARATION time per counter type; activates after 5 completed tickets
- Tickets at 2x average visually highlighted; no external alert

---

## 25. Status Overview Screen

- Any logged-in volunteer; real-time via SSE
- Shows tickets by counter type: pending payment, in preparation, ready, flagged, txosna status

---

## 26. End of Service

- Any logged-in volunteer; confirmation step required
- All open orders and tickets auto-cancelled; customers notified
- Txosna moves to CLOSED
- Admin can **reopen** a closed txosna — returns to OPEN; cancelled orders are not restored

---

## 27. Event Report

- Available to the admin after a txosna closes
- Shows: total orders, total revenue, breakdown by product, cancellation summary, busiest periods
- Downloadable as PDF
- Intended as a simple post-event summary for the association; not complex analytics

---

## 28. Fiscal Receipts — Future

- TicketBAI integration planned; `fiscal_receipt_ref` reserved on Order

---

## 29. Features Evaluated and Deferred

| Feature                               | Status                                         |
| ------------------------------------- | ---------------------------------------------- |
| Portion size and yield                | Deferred                                       |
| Preparation time per product          | Deferred                                       |
| Time-based product availability       | Deferred                                       |
| Serving temperature flags             | Deferred                                       |
| More than two counter types           | Deferred                                       |
| Pre-preparation vs made-to-order flag | Deferred                                       |
| Packaging and presentation notes      | Deferred                                       |
| Last orders announcement              | Deferred                                       |
| Running tabs                          | Out of scope                                   |
| Alcohol content information           | Deferred                                       |
| Drink temperature preferences         | Deferred                                       |
| Waste and leftover tracking           | Out of scope                                   |
| Stock quantity tracking               | Out of scope                                   |
| Cross-event analytics                 | Deferred — per-event report sufficient for now |
| Data retention policy                 | Not defined — no policy for now                |

---

## 30. Ordering Channels

### Channel 1 — Counter

1. Volunteer logs in → PIN → counter mode
2. Customer tells volunteer what they want; pays cash
3. Volunteer configures order; age prompt if applicable; optionally calculates change
4. Order confirmed; tickets routed to correct counter(s)

### Channel 2 — Phone to counter

1. Customer selects language; browses menu with full product details
2. Configures items; age declaration if applicable; enters name; optionally allows push notifications
3. Sees wait time estimate; confirms order as PENDING PAYMENT
4. Goes to counter; volunteer confirms payment (QR scan or manual); tickets routed

### Channel 3 — Self-service online (future)

1. Customer places and pays online; tickets routed immediately

---

## 31. Order and Ticket Lifecycle

```
[Phone-to-counter only]
PENDING PAYMENT ──→ timeout / sold out / paused ──────────────→ CANCELLED + notification
      │ ──→ customer edits order
      │
      │ volunteer confirms payment
      ↓
CONFIRMED → tickets created and routed by category type
      │
      ├── FOOD TICKET
      │     RECEIVED → IN_PREPARATION → READY → COMPLETED
      │     ↘ sold out → flagged → manual → CANCELLED/COMPLETED
      │     ↘ end of service → CANCELLED + notification
      │     ↘ counter edits → order changed alert
      │     ↘ preparation instructions on demand
      │
      └── DRINKS TICKET
            RECEIVED → (IN_PREPARATION if requires_preparation) → READY → COMPLETED
            ↘ same exception flows as food ticket

Each ticket READY → customer notified separately → pickup proof (QR if enabled)
All tickets COMPLETED → receipt available for download
[Counter and self-service go directly to CONFIRMED]
```

---

## 32. Screens Overview

| Screen                 | Used by                  | Device                     | Notes                                                                                             |
| ---------------------- | ------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------- |
| Registration              | First admin              | Any                        | One-time setup                                                                                                                          |
| Onboarding guide          | First admin              | Any                        | Checklist-style setup walkthrough                                                                                                       |
| Association settings      | Admin                    | Any                        | Association name, payment providers (Stripe/Redsys credentials), volunteer management                                                  |
| Master menu management    | Admin                    | Any                        | Association-level catalog: categories, products, variants, modifiers, allergens, dietary flags, preparation instructions, display order |
| Txosna configuration      | Admin                    | Any                        | Per-txosna config (counter setup, channels, enabled providers from association, QR, demo mode)                                         |
| Txosna product selection  | Admin                    | Any                        | Per-txosna: toggle which master catalog products to serve; optionally override price and preparation instructions                       |
| Volunteer login           | Any volunteer            | Any                        | Email + password; password reset available                                                                                              |
| Session PIN entry      | Any volunteer            | Any                        | Selects food counter, drinks counter, or kitchen                                                  |
| Menu & ordering        | Customer                 | Their phone                | Images, allergens, dietary flags, variants, age declaration, wait time; public URL                |
| Food counter screen    | Volunteer (food mode)    | Any                        | Food tickets primary; drinks accessible; change calculator; age prompt; pause                     |
| Drinks counter screen  | Volunteer (drinks mode)  | Any                        | Drinks tickets primary; food accessible; speed-optimised; age prompt; pause                       |
| Kitchen screen (KDS)   | Volunteer (kitchen mode) | Any                        | All tickets; preparation instructions on demand; sold out; slow order highlights; pause and close |
| Status overview        | Any logged-in volunteer  | Any                        | Live snapshot; handover tool                                                                      |
| Order board            | Everyone                 | Any (best on large screen) | Live ticket status; accessible via public txosna URL                                              |
| Pickup proof           | Customer                 | Their phone                | Per ticket; QR if enabled; counter type shown; high contrast                                      |
| Order status / receipt | Customer                 | Their phone                | Current ticket statuses; PDF download when all completed                                          |
| Event report           | Admin                    | Any                        | Post-event summary; downloadable PDF                                                              |

---

## 33. Open Questions

1. Should allergens on variant options and modifiers affect dietary flags?
2. Does the system need to handle refunds (future, for online payments)?
3. Which online payment provider will be used (future)?
4. What is the default pending payment timeout duration?

---

_Last updated: session 17_
