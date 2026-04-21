# Txosna App — Architecture & Technology Stack

_Session 18 — April 2026_

---

## 1. Hosting

The application runs on an existing **VPS (Virtual Private Server)** already operated by the association. This brings the marginal cost of hosting to essentially zero and reuses existing infrastructure.

### Why VPS over managed platforms

- No additional hosting cost — VPS already paid for
- Full control over configuration and data
- SSE (long-lived HTTP connections) works naturally on a persistent server — no serverless constraints
- Simple to understand and maintain for volunteer developers

---

## 2. Architecture Overview

```
Browser (customer / volunteer / admin)
        ↓ HTTPS
Nginx
  ├── Serves Next.js frontend (static + SSR)
  ├── Proxies API requests to Next.js server
  └── proxy_buffering off  ←── required for SSE routes

Next.js (Node.js process, managed by PM2)
  ├── App Router pages     ←── all frontend screens
  ├── Route Handlers       ←── REST API + SSE endpoints
  ├── Server Actions       ←── form submissions and mutations
  └── Background jobs      ←── pending payment timeout, PDF generation

Prisma ORM
        ↓
PostgreSQL database
        ↓
Local file storage (or Cloudflare R2 for images/PDFs)
```

### Key architectural principles

- **One codebase, one process** — Next.js handles both frontend and backend; no separate API server
- **One deployment** — build once, deploy once, one thing to monitor
- **Type safety end to end** — shared TypeScript types across frontend, API, and database via Prisma

---

## 3. Technology Stack

| Layer                    | Technology                   | Notes                                                                                  |
| ------------------------ | ---------------------------- | -------------------------------------------------------------------------------------- |
| Language                 | TypeScript                   | Used throughout frontend, backend, and shared code                                     |
| Framework                | Next.js (App Router)         | Frontend + backend in one; Route Handlers for API and SSE                              |
| ORM                      | Prisma                       | TypeScript-first; schema maps directly to domain model                                 |
| Database                 | PostgreSQL                   | Relational; runs on the same VPS                                                       |
| Styling                  | Tailwind CSS                 | Mobile-first utility classes; responsive design                                        |
| Component library        | Shadcn/ui                    | Accessible components built on Radix UI; code owned by the project                     |
| Accessibility primitives | Radix UI                     | Included via Shadcn; WAI-ARIA compliant                                                |
| Internationalisation     | next-intl                    | Next.js App Router native; TypeScript-first; supports Basque, Spanish, French, English |
| Real-time                | Native SSE (Web Streams API) | Built into Next.js Route Handlers; no external library needed                          |
| Process manager          | PM2                          | Keeps Node.js running; restarts on crash; zero-downtime deploys                        |
| Reverse proxy            | Nginx                        | HTTPS termination, static file serving, SSE proxy                                      |
| SSL                      | Let's Encrypt (Certbot)      | Free; auto-renewal                                                                     |
| Deployment               | GitHub Actions → SSH → PM2   | Push to main branch triggers deploy                                                    |
| File storage             | Local VPS or Cloudflare R2   | R2 preferred for product images and PDFs — free egress, cheap storage                  |
| Email                    | Resend or Nodemailer + SMTP  | Password reset emails                                                                  |
| PDF generation           | pdf-lib or Puppeteer         | Customer receipts and event reports                                                    |

---

## 4. Project Structure

A single repository with clearly separated concerns:

```
txosna/
  app/                          ←── Next.js App Router
    (public)/                   ←── public routes (no auth)
      [slug]/                   ←── txosna public URL (order board, ordering)
        page.tsx
        events/route.ts         ←── SSE: order board real-time updates
    (customer)/                 ←── customer-facing screens
      order/[id]/
        page.tsx                ←── order status + pickup proof
    (volunteer)/                ←── volunteer operational screens
      counter/page.tsx
      kitchen/page.tsx
      overview/page.tsx
    (admin)/                    ←── admin configuration screens
      [locale]/
        settings/page.tsx       ←── association-level settings (name, payment providers)
        txosna/page.tsx         ←── per-txosna configuration
        txosnak/
          page.tsx              ←── txosna list with clone functionality
          [id]/
            settings/page.tsx   ←── per-txosna settings
        menu/page.tsx
        volunteers/page.tsx
        reports/page.tsx
    api/                        ←── Route Handlers (REST API + SSE)
      orders/route.ts
      tickets/[id]/route.ts
      txosna/[id]/events/route.ts  ←── SSE: kitchen/counter real-time
      auth/[...nextauth]/route.ts
  components/                   ←── shared React components
    ui/                         ←── Shadcn/ui components (owned by project)
    screens/                    ←── screen-specific components
      kds/                      ←── Kitchen Display System
      counter/
      pickup-proof/
      order-board/
  lib/                          ←── shared utilities
    sse.ts                      ←── SSE client registry and broadcast
    auth.ts                     ←── authentication helpers
    pdf.ts                      ←── receipt and report generation
  prisma/
    schema.prisma               ←── database schema (maps to domain model)
    migrations/
  messages/                     ←── i18n translation files
    eu.json                     ←── Basque
    es.json                     ←── Spanish
    fr.json                     ←── French
    en.json                     ←── English
  middleware.ts                 ←── auth checks, locale routing
```

---

## 5. Real-time Architecture (SSE)

SSE is implemented as a simple client registry in the backend. When an order status changes, all relevant connected clients are notified instantly.

```typescript
// lib/sse.ts — simplified illustration
const clients = new Map<string, Set<ReadableStreamDefaultController>>();

export function registerClient(txosnaId: string, controller: ReadableStreamDefaultController) {
  // add client to registry for this txosna
}

export function broadcast(txosnaId: string, event: string, data: unknown) {
  // send event to all connected clients for this txosna
}

// app/api/txosna/[id]/events/route.ts
export async function GET(request: Request, { params }) {
  const stream = new ReadableStream({
    start(controller) {
      registerClient(params.id, controller);
      request.signal.addEventListener('abort', () => {
        // remove client on disconnect
      });
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

**Nginx configuration for SSE routes:**

```nginx
location /api/txosna/ {
    proxy_pass http://localhost:3000;
    proxy_buffering off;
    proxy_cache off;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding on;
}
```

---

## 6. Authentication

- Volunteer and admin login uses **NextAuth.js** (now Auth.js) with a credentials provider
- Sessions stored in the database via Prisma adapter
- Password hashing with **bcrypt**
- Password reset uses a short-lived token stored on the Volunteer record
- Customer-facing screens (order board, ordering, pickup proof) require no authentication — accessed via the public txosna URL
- Middleware protects volunteer and admin routes

---

## 7. Database

PostgreSQL running on the same VPS as the application. Prisma manages the schema and migrations.

**Key Prisma schema conventions:**

- All entities from the domain model map to Prisma models
- Enums (OrderStatus, CounterType, etc.) defined in Prisma schema
- Soft deletes not used — records are cancelled, not deleted
- `created_at` and `updated_at` on all models via `@default(now())` and `@updatedAt`
- Multi-tenancy enforced at application layer — all queries include `associationId` filter

**Backups:**

- Daily PostgreSQL dumps via cron job on the VPS
- Stored locally and optionally synced to Cloudflare R2

---

## 8. Frontend Design Principles

### Mobile-first with Tailwind

All components designed for small screens first. Tailwind utilities make responsive breakpoints explicit and readable.

### Accessible components via Shadcn/ui + Radix

- All interactive components (buttons, dialogs, dropdowns) use Radix UI primitives
- WAI-ARIA attributes handled automatically
- Focus management and keyboard navigation included

### Operational screens are purpose-built

The KDS, counter screens, pickup proof, and order board are **not** generic web app UI. They are designed specifically for their context:

| Screen                | Design priority                                                              |
| --------------------- | ---------------------------------------------------------------------------- |
| Kitchen Display (KDS) | Large text, high contrast, minimal tap area, readable from 1 metre           |
| Drinks counter        | Maximum speed — product in 1-2 taps, no unnecessary steps                    |
| Pickup proof          | Glanceable in 2 seconds, outdoor-readable contrast, screen stays active      |
| Order board           | Airport departures style — clear status, auto-updating, readable at distance |
| Customer ordering     | Clear product information, allergens prominent, no friction                  |

### Internationalisation via next-intl

- Language stored in URL locale prefix (e.g. `/eu/`, `/es/`) for volunteer/admin screens
- Customer screens detect browser language but allow manual override
- All UI strings, notifications, and error messages translated
- Supported: Basque (`eu`), Spanish (`es`), French (`fr`), English (`en`)

---

## 9. Deployment

### Process

1. Developer pushes to `main` branch on GitHub
2. GitHub Action SSHs into VPS
3. Pulls latest code
4. Runs `npm install` and `npm run build`
5. Runs `npx prisma migrate deploy` (applies any new database migrations)
6. Restarts the Next.js process via PM2: `pm2 restart txosna`

### Zero-downtime

PM2 supports zero-downtime restarts — the old process continues serving requests while the new one starts up.

### Environment variables

Stored in `.env` on the VPS (not in the repository). Contains: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY`, `R2_*` credentials.

---

## 10. Cost Estimate

| Item                                   | Cost                                            |
| -------------------------------------- | ----------------------------------------------- |
| VPS (shared with existing application) | €0 marginal cost                                |
| Domain / subdomain                     | €0 (subdomain of existing domain)               |
| SSL certificate                        | €0 (Let's Encrypt)                              |
| Cloudflare R2 (images + PDFs)          | €0 (free tier: 10GB storage, 1M requests/month) |
| Email (Resend free tier)               | €0 (100 emails/day free)                        |
| **Total monthly**                      | **€0**                                          |

If the application grows significantly: Resend paid plan starts at ~€15/month; Cloudflare R2 paid is $0.015/GB — both very unlikely to be needed at txosna scale.

---

## 11. Security & Multitenancy

### Multitenancy Model

Txosna is a **multitenant** application where a single deployment serves multiple associations (elkarteak). Each association is the root tenant boundary; all data is partitioned by `associationId`.

**Tenant isolation enforced at:**

- **Database schema**: Every tenant-aware model (Volunteer, Category, VatType, Txosna, Event, etc.) has an explicit `associationId` field
- **JWT session**: Every user's session token includes `token.associationId`
- **Application layer**: Every API endpoint must verify the user's `associationId` matches the data they are accessing

### Authentication & Authorization

- **Login**: NextAuth.js credentials provider (email + password) for volunteers and admins
- **Session**: JWT stored in httpOnly cookie; includes `user.id`, `user.role` (ADMIN or VOLUNTEER), and `user.associationId`
- **Roles**:
  - **ADMIN**: Full access to their association's configuration (menu, volunteers, VAT types, settings)
  - **VOLUNTEER**: Access to operational screens (counter, kitchen, reports) for their association's txosnak
- **Public routes** (e.g., customer ordering, pickup proof): No authentication required; scoped by txosna slug

### Tenant Isolation Check Pattern

Every protected API endpoint must verify the user is acting within their own association. The canonical pattern:

```typescript
const session = await auth();
if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

const { associationId: sessionAssociationId } = session.user as any;

// For admin routes, verify role
if (session.user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 });

// Load entity and verify associationId
const entity = await entityRepo.findById(id);
if (!entity || entity.associationId !== sessionAssociationId)
  return Response.json({ error: 'Forbidden' }, { status: 403 });

// Proceed with operation
```

Reference implementation: `src/app/api/txosnak/[slug]/reports/route.ts`

### Public vs Protected Endpoints

| Route                                | Method    | Auth     | Scope                | Note                                                                                                                                                            |
| ------------------------------------ | --------- | -------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/txosnak/[slug]`            | GET       | None     | Public               | Txosna metadata (name, status, channels)                                                                                                                        |
| `GET /api/txosnak/[slug]/catalog`    | GET       | None     | Public               | Menu visible to customers                                                                                                                                       |
| `GET /api/txosnak/[slug]/events`     | GET (SSE) | None     | Public               | Real-time order/ticket events (scoped by txosnaId)                                                                                                              |
| `POST /api/txosnak/[slug]/orders`    | POST      | Optional | By slug              | Self-service orders (SELF_SERVICE, PHONE_TO_COUNTER channels) don't require auth; counter orders (COUNTER channel) require volunteer auth + associationId check |
| `GET /api/orders/[orderId]`          | GET       | None     | By verification code | Customers access their order via verification code secret                                                                                                       |
| `GET /api/txosnak/[slug]/tickets`    | GET       | Required | Volunteer            | Requires volunteer session; verified to belong to caller's association                                                                                          |
| `PATCH /api/tickets/[id]`            | PATCH     | Required | Volunteer            | Requires volunteer session; ticket verified to belong to caller's association                                                                                   |
| `POST /api/orders/[orderId]/confirm` | POST      | Required | Volunteer            | Requires volunteer session; order's txosna verified to belong to caller's association                                                                           |
| `POST /api/orders/[orderId]/cancel`  | POST      | Optional | By caller type       | Customers can cancel PENDING_PAYMENT orders; volunteers can cancel any order but must belong to their association                                               |
| `GET /api/txosnak/[slug]/reports`    | GET       | Required | ADMIN                | Requires ADMIN role; txosna verified to belong to caller's association                                                                                          |
| `PATCH /api/vat-types/[vatTypeId]`   | PATCH     | Required | ADMIN                | Requires ADMIN role; VAT type verified to belong to caller's association                                                                                        |
| `DELETE /api/vat-types/[vatTypeId]`  | DELETE    | Required | ADMIN                | Requires ADMIN role; VAT type verified to belong to caller's association                                                                                        |

### PROTO_MODE

The environment variable `PROTO_MODE=true` bypasses authentication on certain endpoints for development and testing:

- `POST /api/txosnak/[slug]/orders` (counter channel)
- `POST /api/orders/[orderId]/confirm`
- `POST /api/orders/[orderId]/cancel`

**CRITICAL**: `PROTO_MODE` must **never** be set in production. It breaks all tenant isolation. If set in production by mistake, any volunteer can confirm/cancel orders on any association's txosna.

To verify PROTO_MODE is not enabled in production:

```bash
echo $PROTO_MODE  # should be empty or unset
```

---

## 12. Open Questions

1. Is Cloudflare R2 accessible from the existing VPS, or is local file storage simpler?
2. Which email provider is already in use for the other application on the VPS? Reusing it would simplify setup.
3. Should the txosna public URL use a subdomain of an existing domain (e.g. `txosna.elkartea.eus`) or a dedicated domain?

---

_Last updated: session 18_ (Security section added in session 19)
