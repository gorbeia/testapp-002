# API Reference

## Conventions

- **Base path:** `/api`
- **Response format:** `NextResponse.json(data, { status })` — all handlers use this; never `Response.json`
- **Error format:** `{ "error": "message" }`
- **Auth:** NextAuth v5 session cookie. Handlers call `await auth()` from `next-auth`.
- **PROTO_MODE:** When `process.env.PROTO_MODE=true`, session checks are bypassed. Integration tests use this. **Never enabled in production.**
- **Tenant isolation:** Every resource is scoped to `associationId`. Handlers derive it from the session; never accept it as user input without verifying it matches the session.

### Auth levels used in this document

| Label         | Meaning                                                              |
| ------------- | -------------------------------------------------------------------- |
| **Public**    | No auth required                                                     |
| **Volunteer** | Requires valid NextAuth session (any role)                           |
| **Admin**     | Requires session with `role === 'ADMIN'`                             |
| **PIN**       | Requires prior PIN verification (`POST /api/auth/pin`)               |
| **Signed**    | Request authenticated by HMAC/signature from the provider (webhooks) |
| **Internal**  | Test/demo environments only — not for production                     |

---

## Authentication

| Method | Path                      | Auth      | Description                                                       |
| ------ | ------------------------- | --------- | ----------------------------------------------------------------- |
| `GET`  | `/api/auth/[...nextauth]` | Public    | NextAuth.js catch-all: session check, sign-in, sign-out           |
| `GET`  | `/api/auth/association`   | Public    | Look up association name by email domain (used during onboarding) |
| `POST` | `/api/auth/pin`           | Volunteer | Verify session PIN; returns txosna config and kitchen post list   |

---

## Associations

| Method  | Path                                | Auth   | Description                                  |
| ------- | ----------------------------------- | ------ | -------------------------------------------- |
| `POST`  | `/api/associations`                 | Public | Create a new association (self-registration) |
| `GET`   | `/api/associations/[associationId]` | Admin  | Get association details                      |
| `PATCH` | `/api/associations/[associationId]` | Admin  | Update association (name, CIF, VAT settings) |

---

## Volunteers

| Method   | Path                                           | Auth   | Description                                       |
| -------- | ---------------------------------------------- | ------ | ------------------------------------------------- |
| `GET`    | `/api/associations/[associationId]/volunteers` | Admin  | List all volunteers for the association           |
| `POST`   | `/api/associations/[associationId]/volunteers` | Admin  | Create a volunteer                                |
| `PATCH`  | `/api/volunteers/[volunteerId]`                | Admin  | Update volunteer (name, email, role, active flag) |
| `DELETE` | `/api/volunteers/[volunteerId]`                | Admin  | Deactivate a volunteer (soft delete)              |
| `POST`   | `/api/volunteers/reset-password`               | Public | Send a password reset email                       |

---

## Txosnak

| Method  | Path                                       | Auth      | Description                                                                    |
| ------- | ------------------------------------------ | --------- | ------------------------------------------------------------------------------ |
| `GET`   | `/api/admin/txosnak`                       | Admin     | List all txosnak for the current user's association                            |
| `POST`  | `/api/txosnak`                             | Admin     | Create a new txosna                                                            |
| `GET`   | `/api/txosnak/[slug]`                      | Public    | Get txosna metadata and current status                                         |
| `GET`   | `/api/txosnak/[slug]/settings`             | Volunteer | Get full txosna settings (counters, channels, payment methods)                 |
| `PATCH` | `/api/txosnak/[slug]/settings`             | Admin     | Update txosna settings                                                         |
| `PATCH` | `/api/txosnak/[slug]/pin`                  | Admin     | Set or rotate the session PIN (stored as bcrypt hash)                          |
| `GET`   | `/api/txosnak/[slug]/catalog`              | Public    | Get product catalog with per-txosna overrides applied (prices, sold-out flags) |
| `GET`   | `/api/txosnak/[slug]/products`             | Admin     | List raw txosna product overrides                                              |
| `PUT`   | `/api/txosnak/[slug]/products/[productId]` | Admin     | Set a txosna product override (price, sold-out, instructions)                  |
| `GET`   | `/api/txosnak/[slug]/events`               | Public    | SSE stream — emits `order` and `ticket` events in real time                    |
| `GET`   | `/api/txosnak/[slug]/reports`              | Admin     | Aggregated sales report for the txosna                                         |

---

## Orders

| Method | Path                                      | Auth      | Description                                                  |
| ------ | ----------------------------------------- | --------- | ------------------------------------------------------------ |
| `GET`  | `/api/txosnak/[slug]/orders`              | Volunteer | List orders (filterable by status)                           |
| `POST` | `/api/txosnak/[slug]/orders`              | Public    | Create an order (counter, self-service, or phone-to-counter) |
| `GET`  | `/api/txosnak/[slug]/orders/lookup`       | Public    | Look up an order by its verification code (rate-limited)     |
| `GET`  | `/api/orders/[orderId]`                   | Public    | Get order status and lines (customer view)                   |
| `POST` | `/api/orders/[orderId]/confirm`           | Volunteer | Confirm a `PENDING_PAYMENT` order (counter cash flow)        |
| `POST` | `/api/orders/[orderId]/cancel`            | Public    | Cancel an order (customer or volunteer)                      |
| `GET`  | `/api/orders/[orderId]/ticketbai-invoice` | Public    | Get the TicketBAI fiscal invoice for a completed order       |

---

## Tickets

Tickets represent the kitchen/counter view of order line groups. One order may produce multiple tickets (food and drinks separately, depending on the txosna's counter setup).

| Method  | Path                          | Auth      | Description                                                                 |
| ------- | ----------------------------- | --------- | --------------------------------------------------------------------------- |
| `GET`   | `/api/txosnak/[slug]/tickets` | Volunteer | List tickets (KDS view; filterable by status, counter type, kitchen post)   |
| `PATCH` | `/api/tickets/[id]`           | Volunteer | Advance a ticket's status (`RECEIVED → IN_PREPARATION → READY → COMPLETED`) |

---

## Catalog (Menu Management)

All catalog routes operate on the current user's association, derived from the session.

### Categories

| Method   | Path                           | Auth  | Description                                   |
| -------- | ------------------------------ | ----- | --------------------------------------------- |
| `GET`    | `/api/categories`              | Admin | List all categories                           |
| `POST`   | `/api/categories`              | Admin | Create a category                             |
| `GET`    | `/api/categories/[categoryId]` | Admin | Get a category                                |
| `PATCH`  | `/api/categories/[categoryId]` | Admin | Update a category (name, type, display order) |
| `DELETE` | `/api/categories/[categoryId]` | Admin | Delete a category                             |
| `POST`   | `/api/categories/reorder`      | Admin | Batch reorder categories                      |

### Products

| Method   | Path                        | Auth  | Description                                             |
| -------- | --------------------------- | ----- | ------------------------------------------------------- |
| `GET`    | `/api/products`             | Admin | List all products (with variants, modifiers, allergens) |
| `POST`   | `/api/products`             | Admin | Create a product                                        |
| `GET`    | `/api/products/[productId]` | Admin | Get a product                                           |
| `PATCH`  | `/api/products/[productId]` | Admin | Update a product                                        |
| `DELETE` | `/api/products/[productId]` | Admin | Delete a product                                        |
| `POST`   | `/api/products/reorder`     | Admin | Batch reorder products within a category                |

### VAT Types

| Method   | Path                         | Auth  | Description                        |
| -------- | ---------------------------- | ----- | ---------------------------------- |
| `GET`    | `/api/vat-types`             | Admin | List VAT types for the association |
| `POST`   | `/api/vat-types`             | Admin | Create a VAT type                  |
| `PATCH`  | `/api/vat-types/[vatTypeId]` | Admin | Update a VAT type                  |
| `DELETE` | `/api/vat-types/[vatTypeId]` | Admin | Delete a VAT type                  |

---

## Payment Providers

| Method   | Path                                                                        | Auth  | Description                                            |
| -------- | --------------------------------------------------------------------------- | ----- | ------------------------------------------------------ |
| `GET`    | `/api/associations/[associationId]/payment-providers`                       | Admin | List configured payment providers (Stripe, Redsys)     |
| `POST`   | `/api/associations/[associationId]/payment-providers`                       | Admin | Add a payment provider and store encrypted credentials |
| `PATCH`  | `/api/associations/[associationId]/payment-providers/[providerId]`          | Admin | Update provider configuration                          |
| `DELETE` | `/api/associations/[associationId]/payment-providers/[providerId]`          | Admin | Remove a payment provider                              |
| `POST`   | `/api/associations/[associationId]/payment-providers/[providerId]/validate` | Admin | Test provider credentials against the live API         |

---

## Payments

| Method | Path                               | Auth   | Description                                                                 |
| ------ | ---------------------------------- | ------ | --------------------------------------------------------------------------- |
| `POST` | `/api/payments/session`            | Public | Create a payment session (Stripe checkout or Redsys redirect params)        |
| `GET`  | `/api/payments/redsys/redirect`    | Public | Auto-submitting HTML form for the Redsys redirect flow                      |
| `POST` | `/api/payments/webhook/[provider]` | Signed | Payment webhook handler (`stripe` or `redsys`); verifies provider signature |

---

## TicketBAI (Fiscal Invoicing)

TicketBAI is the Basque Country's fiscal invoicing regulation. See [`ticketbai.md`](ticketbai.md) for the full design.

| Method  | Path                                                   | Auth  | Description                                                     |
| ------- | ------------------------------------------------------ | ----- | --------------------------------------------------------------- |
| `GET`   | `/api/associations/[associationId]/ticketbai`          | Admin | Get TicketBAI configuration (or defaults if not yet configured) |
| `PATCH` | `/api/associations/[associationId]/ticketbai`          | Admin | Update TicketBAI configuration                                  |
| `POST`  | `/api/associations/[associationId]/ticketbai`          | Admin | Enable and initialise TicketBAI for the association             |
| `GET`   | `/api/associations/[associationId]/ticketbai/invoices` | Admin | List all issued TicketBAI invoices                              |

---

## Demo and Testing

These routes are for development and testing. They should not be exposed in production without the appropriate secret or environment guard.

| Method | Path                | Auth            | Description                                                                               |
| ------ | ------------------- | --------------- | ----------------------------------------------------------------------------------------- |
| `GET`  | `/api/demo/status`  | Public          | Returns whether demo mode is enabled (`DEMO_RESET_SECRET` is set)                         |
| `POST` | `/api/demo/reset`   | Public + secret | Resets the demo association to its fixture state. Requires `?secret=<DEMO_RESET_SECRET>`. |
| `POST` | `/api/e2e/seed`     | Internal        | Seeds a test fixture association. Only works when `NODE_ENV !== 'production'`.            |
| `GET`  | `/api/test-storage` | Internal        | Returns the current storage backend (`memory` or `orm`).                                  |
