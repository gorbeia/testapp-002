# Txosna App — Domain Model
*Session 17 — April 2026*

---

## Entities

### Association (Tenant)

| Attribute | Type | Notes |
|-----------|------|-------|
| name | text | Name of the association |
| created_at | datetime | When the association registered |

---

### Volunteer

| Attribute | Type | Notes |
|-----------|------|-------|
| name | text | Full name |
| email | text | Used for login; unique within the system |
| password | hashed text | Personal login credential |
| password_reset_token | text | Short-lived token for email-based password reset; null when not active |
| password_reset_expires_at | datetime | Expiry time for the reset token |
| role | enum | ADMIN or VOLUNTEER |
| association | Association | Which association they belong to |
| active | boolean | Whether the account is active |
| created_at | datetime | When the account was created |

**Role permissions:**

| Permission | Volunteer | Admin |
|-----------|-----------|-------|
| Food counter, drinks counter, kitchen screens | ✓ | ✓ |
| Status overview | ✓ | ✓ |
| Menu management | | ✓ |
| Event and txosna management | | ✓ |
| Volunteer account management | | ✓ |
| Association configuration | | ✓ |

---

### Event

| Attribute | Type | Notes |
|-----------|------|-------|
| name | text | e.g. "Aste Nagusia 2026" |
| date | date | |
| location | text | |
| association | Association | The association running txosnak at this event |

---

### Category

| Attribute | Type | Notes |
|-----------|------|-------|
| name | text | e.g. "Food", "Drinks", "Cocktails" |
| type | enum | FOOD or DRINKS — determines counter routing |
| display_order | integer | Position within the menu |
| association | Association | Owner |

---

### Product (Master Menu Item)

| Attribute | Type | Notes |
|-----------|------|-------|
| name | text | e.g. "Burger", "Mojito" |
| category | Category | Determines FOOD or DRINKS routing |
| default_price | decimal | Base price before variant deltas and modifier prices |
| description | text | Optional short description |
| customer_image | file | Optional photo shown to customers |
| allergens | list | Multi-select from 14 standard EU allergens |
| dietary_flags | list | Vegetarian, vegan, gluten-free |
| age_restricted | boolean | Drink requires ID verification at counter before serving |
| splittable | boolean | Food product that can be split across multiple units |
| requires_preparation | boolean | Drink needing active preparation; drives full lifecycle on drinks ticket |
| display_order | integer | Position within its category |
| ingredients | text | Simple reference list for volunteers; not used for inventory |
| preparation_instructions | markdown | General method; applies to all txosnak; may include embedded images |
| association | Association | Owner |

---

### VariantGroup

| Attribute | Type | Notes |
|-----------|------|-------|
| product | Product | Which product this group belongs to |
| name | text | e.g. "Side", "Size" |
| display_order | integer | Position among variant groups on the product |

---

### VariantOption

| Attribute | Type | Notes |
|-----------|------|-------|
| variant_group | VariantGroup | Which group this belongs to |
| name | text | e.g. "Chips", "Salad" |
| price_delta | decimal | Amount added to base price; zero or positive |
| allergens | list | Allergens introduced by this option |
| display_order | integer | Position within the group |

---

### Modifier

| Attribute | Type | Notes |
|-----------|------|-------|
| product | Product | Which product this modifier belongs to |
| name | text | e.g. "Extra sauce", "No onion" |
| price | decimal | Amount added to base price; zero or positive |
| allergens | list | Allergens introduced by this modifier |
| display_order | integer | Position among modifiers on the product |

---

### Txosna (Stall)

| Attribute | Type | Notes |
|-----------|------|-------|
| name | text | Name of the stall |
| event | Event | Which event it operates at |
| association | Association | Which association runs it |
| slug | text | URL-safe identifier; used in the public subdomain/URL |
| pin | hashed text | Session selector PIN |
| counter_setup | enum | SINGLE or SEPARATE |
| enabled_channels | list | COUNTER, PHONE_TO_COUNTER, SELF_SERVICE |
| enabled_payment_methods | list | CASH, ONLINE |
| notification_modes | list | display, push, manual |
| qr_validation_enabled | boolean | Whether QR codes are shown and used for validation |
| printing_enabled | boolean | Whether ticket printing is available |
| status | enum | OPEN, PAUSED, CLOSED |
| is_demo | boolean | Whether this is a demo/sandbox txosna; never visible to customers |
| pending_payment_timeout | integer | Minutes before unclaimed phone order is auto-cancelled |

**Public URL:** each txosna has a unique public URL derived from its slug (e.g. `elkartea.txosna.app`). Used for the order board and customer ordering screens. Not active for demo txosnak.

---

### TxosnaProduct

| Attribute | Type | Notes |
|-----------|------|-------|
| txosna | Txosna | The stall this applies to |
| product | Product | The product being configured |
| price_override | decimal | Optional; overrides product.default_price |
| available | boolean | Admin-set — whether offered at this txosna |
| sold_out | boolean | Counter or kitchen staff set — stock has run out; reactivatable |
| preparation_instructions | markdown | Optional; overrides product instructions for this txosna |

**Effective base price:** `price_override` if set, otherwise `product.default_price`.

**Effective instructions:** `TxosnaProduct.preparation_instructions` if set, otherwise `product.preparation_instructions`.

**Orderable rule:** `available = true` AND `sold_out = false` AND `txosna.status = OPEN` AND `txosna.is_demo = false` AND channel in `txosna.enabled_channels`.

---

### Order

| Attribute | Type | Notes |
|-----------|------|-------|
| order_number | integer | Sequential per txosna; used for pickup identification |
| verification_code | text | Short alphanumeric (e.g. "AX47"); encoded in QR if enabled |
| status | enum | PENDING_PAYMENT, CONFIRMED, CANCELLED |
| cancellation_reason | enum | CUSTOMER, SOLD_OUT, TIMEOUT, END_OF_SERVICE, VOLUNTEER |
| channel | enum | COUNTER, PHONE_TO_COUNTER, SELF_SERVICE |
| payment_method | enum | CASH, ONLINE |
| created_at | datetime | When the order was placed |
| confirmed_at | datetime | When confirmed and tickets created |
| expires_at | datetime | For PENDING_PAYMENT orders; auto-cancel time |
| txosna | Txosna | Which stall this order belongs to |
| registered_by | Volunteer | Volunteer who confirmed; null for self-service |
| customer_name | text | Required for phone orders |
| notification_token | text | Optional; browser push notification token |
| local_storage_key | text | Links order to customer's browser local storage |
| notes | text | Optional free text instructions |
| fiscal_receipt_ref | text | Future; TicketBAI reference; null until built |
| tickets | list of OrderTicket | One per counter type present in the order |

---

### OrderTicket

| Attribute | Type | Notes |
|-----------|------|-------|
| order | Order | Which order this ticket belongs to |
| counter_type | enum | FOOD or DRINKS |
| status | enum | RECEIVED, IN_PREPARATION, READY, COMPLETED, CANCELLED |
| requires_preparation | boolean | True if any line has requires_preparation = true |
| flagged | boolean | True if ticket contains a sold out product after payment |
| created_at | datetime | When the ticket was created |
| ready_at | datetime | When marked READY |
| completed_at | datetime | When customer picked up this ticket |
| lines | list of OrderLine | The items in this ticket |

---

### OrderLine

| Attribute | Type | Notes |
|-----------|------|-------|
| ticket | OrderTicket | Which ticket this line belongs to |
| product | Product | Which product was ordered |
| unit_price | decimal | Effective price at time of order; updated on edit |
| quantity | integer | How many |
| split_instructions | text | Optional; for splittable food products |
| selected_variants | list of SelectedVariant | One per variant group |
| selected_modifiers | list of SelectedModifier | Zero or more |

---

### SelectedVariant

| Attribute | Type | Notes |
|-----------|------|-------|
| order_line | OrderLine | Which line this belongs to |
| variant_option | VariantOption | Which option was selected |
| price_delta | decimal | Captured at time of order |

---

### SelectedModifier

| Attribute | Type | Notes |
|-----------|------|-------|
| order_line | OrderLine | Which line this belongs to |
| modifier | Modifier | Which modifier was selected |
| price | decimal | Captured at time of order |

---

## Design Decisions

### Multitenancy by filtering
All queries scoped to the association. Single database; isolation enforced at application layer.

### Volunteer accounts and roles
- ADMIN and VOLUNTEER roles; Admin is a superset
- Volunteers access all txosnak in their association
- Two-step access: device login then session PIN

### Password reset
- Standard email-based flow
- `password_reset_token` and `password_reset_expires_at` on Volunteer
- Token is single-use and short-lived

### Onboarding guide
- Shown to new admins after registration
- Checklist-style; skippable and resumable
- Tracks completion per admin

### Public txosna URL
- Each txosna has a unique `slug` used to construct a public URL
- Format: subdomain (e.g. `elkartea.txosna.app`) or path (e.g. `txosna.app/t/elkartea`)
- Used for: order board, customer ordering screen
- Not active for demo txosnak (`is_demo = true`)

### Demo txosna
- Marked with `is_demo = true`; never visible to customers
- Public URL not active; orders placed in demo are test orders only
- Admin can copy demo configuration to a real txosna
- Copying transfers: counter setup, enabled channels, payment methods, notification modes, QR settings, pending timeout, all TxosnaProduct entries

### Txosna reopening
- Admin can reopen a CLOSED txosna — status returns to OPEN
- Orders and tickets cancelled on closure remain cancelled; they are not restored
- Simple and intentional — reopening is a fresh start for that txosna session

### Counter setup and ticket routing

| Setup | Tickets per order | Customer pickup |
|-------|------------------|-----------------|
| SINGLE | One ticket (all lines) | Everything together |
| SEPARATE | Food ticket + drinks ticket | Food and drinks independently |

Lines assigned based on `product.category.type`.

### Drinks ticket lifecycle
- Full lifecycle if `requires_preparation = true` on any line
- Otherwise RECEIVED → READY → COMPLETED

### Age verification
- `age_restricted = true` on Product triggers volunteer ID prompt at counter
- Phone orders include customer declaration checkbox

### Effective order line price
```
unit_price = effective_base_price
           + sum(selected_variant.price_delta)
           + sum(selected_modifier.price)
```

### Effective allergens
Union of product + selected variant options + selected modifiers allergens. Shown in real time.

### Prices captured at order time
`unit_price`, `price_delta`, and modifier `price` captured at ordering. Menu changes do not affect existing orders.

### Preparation instructions — two levels

| Level | Set by | Scope | Overrides |
|-------|--------|-------|-----------|
| Product-level | Admin (master menu) | All txosnak | — |
| Txosna-level | Admin (per txosna) | One txosna | Replaces product-level entirely |

### Event report
- Generated per txosna after closure
- Contains: total orders, total revenue, product breakdown, cancellation summary, busiest periods
- Downloadable as PDF
- No complex cross-event analytics at this stage

### Cancellation reasons

| Reason | Trigger |
|--------|---------|
| CUSTOMER | Manual cancellation |
| SOLD_OUT | Product sold out; pending order cannot be accepted |
| TIMEOUT | Pending payment not claimed in time |
| END_OF_SERVICE | Txosna closed |
| VOLUNTEER | Operational decision |

### Features evaluated and deferred

| Feature | Status |
|---------|--------|
| Portion size and yield | Deferred |
| Preparation time per product | Deferred |
| Time-based availability | Deferred |
| Serving temperature flags | Deferred |
| More than two counter types | Deferred |
| Pre-preparation vs made-to-order | Deferred |
| Packaging and presentation notes | Deferred |
| Last orders announcement | Deferred |
| Running tabs | Out of scope |
| Alcohol content information | Deferred |
| Drink temperature preferences | Deferred |
| Waste and leftover tracking | Out of scope |
| Stock quantity tracking | Out of scope |
| Cross-event analytics | Deferred |
| Data retention policy | Not defined |

---

## Relationships

```
Association
  ├── has many → Volunteers
  ├── has many → Events
  ├── has many → Categories (FOOD or DRINKS)
  │     └── has many → Products
  │           ├── has many → VariantGroups → VariantOptions
  │           └── has many → Modifiers
  └── has many → Txosnak
        ├── has many → TxosnaProducts (references Products)
        └── has many → Orders
              └── has many → OrderTickets (FOOD and/or DRINKS)
                    └── has many → OrderLines
                          ├── has many → SelectedVariants
                          └── has many → SelectedModifiers
```

---

## Order and Ticket Lifecycle

```
PENDING_PAYMENT (phone-to-counter only)
  ↘ timeout / sold out / paused → CANCELLED + notification
  ↘ customer edits
  ↓ volunteer confirms

CONFIRMED — tickets created and routed
  │
  ├── FOOD TICKET
  │     RECEIVED → IN_PREPARATION → READY → COMPLETED
  │     ↘ sold out → flagged → manual → CANCELLED/COMPLETED
  │     ↘ end of service → CANCELLED + notification
  │     ↘ counter edits → order changed alert
  │
  └── DRINKS TICKET
        RECEIVED → (IN_PREPARATION if requires_preparation) → READY → COMPLETED
        ↘ same exception flows as food ticket

Each ticket READY → customer notified separately
All tickets COMPLETED → receipt available for download
```

---

## Txosna Status

| Status | Set by | Meaning |
|--------|--------|---------|
| OPEN | Admin / on creation / on reopen | Normal operation |
| PAUSED | Any logged-in volunteer | Temporarily not accepting new orders |
| CLOSED | Any logged-in volunteer | End of service; all open orders cancelled; reopenable by admin |

---

## Screens Overview

| Screen | Used by | Device | Notes |
|--------|---------|--------|-------|
| Registration | First admin | Any | One-time setup |
| Onboarding guide | First admin | Any | Checklist-style setup walkthrough |
| Admin configuration | Admin | Any | Full txosna config, menu, volunteers, demo txosna, event report |
| Volunteer login | Any volunteer | Any | Email + password; password reset available |
| Session PIN entry | Any volunteer | Any | Selects food counter, drinks counter, or kitchen |
| Menu & ordering | Customer | Their phone | Public txosna URL; images, allergens, dietary flags, variants, age declaration, wait time |
| Food counter screen | Volunteer (food mode) | Any | Food tickets primary; drinks accessible; change calculator; age prompt; pause |
| Drinks counter screen | Volunteer (drinks mode) | Any | Speed-optimised; drinks primary; food accessible; age prompt; pause |
| Kitchen screen (KDS) | Volunteer (kitchen mode) | Any | All tickets; preparation instructions on demand; sold out; slow order highlights; pause and close |
| Status overview | Any logged-in volunteer | Any | Live snapshot; handover tool |
| Order board | Everyone | Any (best on large screen) | Live ticket status; public txosna URL |
| Pickup proof | Customer | Their phone | Per ticket; QR if enabled; counter type shown; high contrast |
| Order status / receipt | Customer | Their phone | Current statuses; PDF download when all completed |
| Event report | Admin | Any | Post-event summary; downloadable PDF |

---

## Open Questions

1. Should allergens on variant options and modifiers affect dietary flags?
2. Does the system need to handle refunds (future, for online payments)?
3. Which online payment provider will be used (future)?
4. What is the default pending payment timeout duration?

---

*Last updated: session 17*
