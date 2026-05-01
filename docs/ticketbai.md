# TicketBAI — Fiscal Invoice System

_Session 18 — April 2026_

---

## What is TicketBAI?

TicketBAI (TBAI) is a mandatory fiscal regulation in the Basque Country (Spain) that requires every sale to generate a digitally signed, chained invoice and submit it to the regional tax authority (Hacienda Vasca). The regulation applies to any business operating in Bizkaia, Gipuzkoa, or Álava.

Key obligations:

- Every sale must produce a signed invoice record
- Each invoice must cryptographically reference the previous one (hash chain), making it impossible to delete or reorder invoices without detection
- A QR code must appear on each receipt, linking to the tax authority's verification portal
- Invoices must be submitted to Hacienda Vasca in near real-time

---

## Architecture

### Provider abstraction

The implementation follows the same pattern as `src/lib/payments/`:

```
src/lib/ticketbai/
  types.ts      ← ITicketBaiProvider interface + input/result types
  mock.ts       ← MockTicketBaiProvider (dev and test)
  index.ts      ← createTicketBaiProvider(config) factory
  service.ts    ← issueTicketBaiInvoice() orchestrator
```

The `ITicketBaiProvider` interface is the only contract application code depends on:

```typescript
interface ITicketBaiProvider {
  issue(input: IssueInvoiceInput): Promise<IssueInvoiceResult>;
  validate(): Promise<{ ok: boolean; error?: string }>;
}
```

### Invoice ledger

The system maintains a provider-independent ledger (`TicketBaiInvoice` in the store). This is the compliance record — it is preserved even if the association switches API providers or terminates a contract. The ledger stores:

- Full invoice data (lines, VAT breakdown, totals)
- Provider reference and QR URL returned by the external API
- The raw XML payload when the provider returns one
- The invoice's position in the chain (`chainId`, `previousChainId`)

### Hash chain

Each invoice's `chainId` is a SHA-256 hash over:

```
series | invoiceNumber | sellerCif | total | issuedAt | previousChainId
```

For the first invoice in a series, `previousChainId` is substituted with the literal `FIRST`. This deterministic computation means the chain can be verified independently of any external system.

### Integration points

Invoice issuance is triggered from two places in the order confirmation flow:

1. **`src/lib/confirm-order.ts`** — when a volunteer confirms a phone-to-counter order
2. **`src/app/api/handlers/txosna-orders.ts`** — when a counter order is created directly as CONFIRMED

Both call `issueTicketBaiInvoice(order, associationId).catch(() => {})`. The `.catch()` ensures that a TicketBAI failure never blocks order confirmation — the order always goes through.

---

## Data flow

```
Order confirmed
      │
      ▼
issueTicketBaiInvoice(order, associationId)    src/lib/ticketbai/service.ts
      │
      ├─ Check association.ticketBaiEnabled — skip if false
      ├─ ticketBaiConfigRepo.findByAssociation() — skip if no config
      ├─ ticketBaiInvoiceRepo.nextInvoiceNumber() + getLastByAssociation()
      ├─ Build IssueInvoiceInput (lines from ticketRepo, seller from associationRepo)
      ├─ createTicketBaiProvider(config).issue(input)
      ├─ ticketBaiInvoiceRepo.create(result)
      └─ orderRepo.update(orderId, { fiscalReceiptRef: invoice.id })
```

---

## Adding a new provider

1. **Implement `ITicketBaiProvider`** in a new file, e.g. `src/lib/ticketbai/argi.ts`:

   ```typescript
   import type { ITicketBaiProvider, IssueInvoiceInput, IssueInvoiceResult } from './types';

   export class ArgiTicketBaiProvider implements ITicketBaiProvider {
     constructor(private credentials: Record<string, string>) {}

     async validate() {
       // call provider's ping/health endpoint
       return { ok: true };
     }

     async issue(input: IssueInvoiceInput): Promise<IssueInvoiceResult> {
       // build XML, sign it, submit to Hacienda Vasca via provider's API
       return {
         providerRef: '...',
         qrUrl: '...',
         xmlPayload: '...',
         chainId: '...',
         status: 'SUBMITTED',
       };
     }
   }
   ```

2. **Add the new type** to `TicketBaiProviderType` in `src/lib/store/types.ts`:

   ```typescript
   export type TicketBaiProviderType = 'MOCK' | 'ARGI';
   ```

3. **Add a case** in `src/lib/ticketbai/index.ts`:

   ```typescript
   case 'ARGI':
     return new ArgiTicketBaiProvider(config.credentials);
   ```

4. **Extend the PATCH route** (`src/app/api/associations/[associationId]/ticketbai/route.ts`) to accept the new `providerType` value and validate any required credential fields.

5. **Add the new type** to the Prisma schema enum `TicketBaiProviderType` and run `pnpm prisma migrate dev`.

6. Update the admin settings UI to expose the new provider's credential fields.

---

## API routes

| Method | Route                                       | Auth  | Description                              |
| ------ | ------------------------------------------- | ----- | ---------------------------------------- |
| GET    | `/api/associations/[id]/ticketbai`          | ADMIN | Get config (or defaults if none set)     |
| PATCH  | `/api/associations/[id]/ticketbai`          | ADMIN | Update series, providerType, credentials |
| POST   | `/api/associations/[id]/ticketbai`          | ADMIN | Validate credentials against provider    |
| GET    | `/api/associations/[id]/ticketbai/invoices` | ADMIN | List all invoices for the association    |
| GET    | `/api/orders/[orderId]/ticketbai-invoice`   | None  | Get invoice for a specific order         |

The orders endpoint is intentionally unauthenticated — the `orderId` is the customer's credential (it is not guessable).

---

## Admin UI

**Settings → BEZ tab** (`/[locale]/settings`)

- Toggle: "TicketBAI gaitu" — enables invoice issuance for all confirmed orders
- When enabled, a config panel appears:
  - Series prefix (default `TB`)
  - Provider type selector
  - Test connection button (calls POST route)
  - Save button
  - Link to the invoice ledger

**Invoice ledger** (`/[locale]/ticketbai`)

- Lists all issued invoices in order
- Columns: invoice number (formatted), order number, date, total, status, QR link
- Accessible to ADMIN role only

---

## Customer UI

The "Txartel argia / Faktura" section appears whenever an order has a `fiscalReceiptRef`. It is shown in two places:

**Phone-order customers** (`/[locale]/order/[id]`): The order status page includes the fiscal invoice section below the ticket status cards.

**Counter-order customers** (`/[locale]/[slug]/track/[code]`): The public tracking page — accessed via the handoff code displayed at the counter — renders the same fiscal invoice section above the receipt download button.

Both views show:

- Formatted invoice reference (`{series}-{invoiceNumber zero-padded to 8 digits}`)
- Issue date
- A link opening the QR URL in a new tab (Hacienda Vasca's verification portal)

The **printable receipt** (`/[locale]/[slug]/track/[code]/receipt`) conditionally renders the full fiscal section when an invoice exists; when no invoice is present it shows "Ez da zerga-dokumentua" (not a fiscal document).

---

## Invoice number format

Invoice numbers are sequential per `(associationId, series)`. The formatted reference shown in the UI and in the QR URL is:

```
{series}-{year}-{invoiceNumber zero-padded to 8 digits}
```

Example: `TB-2026-00000001`

---

## Mock provider

`MockTicketBaiProvider` is used in development and tests. It:

- Always returns `{ ok: true }` from `validate()`
- Computes a real SHA-256 `chainId` using the same algorithm as production providers
- Returns `status: 'MOCK'` so mock invoices are distinguishable in the ledger
- Records every issued `IssueInvoiceInput` in `provider.issued[]` for test assertions

---

_Last updated: session 20_
