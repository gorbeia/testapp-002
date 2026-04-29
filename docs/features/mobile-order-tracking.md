# Mobile Order Tracking & Ticket Download

_Session 18 — April 2026_

---

## 1. Overview

Customers who place orders at the counter can receive a short verification code. They enter this code on their phone to watch the order status in real time and download a receipt when the order is complete.

The feature is **optional** — disabled by default, enabled per txosna in its settings.

---

## 2. Motivation

Counter orders today are opaque to the customer after the volunteer takes their payment. The customer has no way to know when their food is ready without watching the physical board. This feature closes that gap without requiring customers to create accounts or install anything.

The verification code already exists on every `Order` (`verificationCode` field). This feature surfaces it to the customer and builds the lookup experience around it.

---

## 3. Scope

| What changes                                    | Notes                                                            |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| New txosna setting: `mobileTrackingEnabled`     | Disabled by default; admin enables per txosna                    |
| Counter screen: code handoff step               | Shown after order confirmation when feature is enabled           |
| New public page: `/[slug]/track`                | Customer enters their code                                       |
| New public page: `/[slug]/track/[code]`         | Real-time order status view                                      |
| New API: `GET /orders/lookup?slug=…&code=…`     | Public, unauthenticated lookup by verification code              |
| Ticket download for all order types             | Available once order is CONFIRMED; replaces phone-order-only PDF |

Out of scope for this feature:
- Push notifications (already handled by the existing notification subsystem)
- Fiscal receipts / TicketBAI (reserved, no change)
- Self-service channel (future)

---

## 4. Feature Flag

### Schema addition

```prisma
model Txosna {
  // … existing fields …
  mobileTrackingEnabled Boolean @default(false)
}
```

### Behaviour when disabled

- Counter screen shows no code after order placement
- `/[slug]/track` and `/[slug]/track/[code]` return 404
- Lookup API returns 404

### Behaviour when enabled

All flows described in sections 5–8 are active.

---

## 5. Counter Screen — Code Handoff

After a volunteer confirms a counter order, a **handoff card** appears on the counter screen (food counter and drinks counter both). The service can pause here — the volunteer shows the QR to the customer and waits for them to scan before dismissing.

```
┌─────────────────────────────────────────────┐
│  Order #42 confirmed                        │
│                                             │
│  Give this code to the customer:            │
│                                             │
│         ┌───────────────┐                   │
│         │   H4 - 7K9    │   [QR]            │
│         └───────────────┘                   │
│                                             │
│  Or they can type it later at:              │
│  txosna.app/eu/demo-janaria/track           │
│                                             │
│                        [Dismiss]            │
└─────────────────────────────────────────────┘
```

- The code displayed is `Order.verificationCode`, formatted with a dash in the middle for readability (`H4-7K9` not `H47K9`); monospaced font
- The QR encodes the **full direct tracking URL**: `/{locale}/{slug}/track/{code}` — scanning takes the customer straight to their order status, no code entry required
- The secondary text reminds the customer they can also visit the entry page and type the code later if they prefer
- The volunteer taps **Dismiss** manually when done — there is no auto-dismiss; the queue does not continue until the volunteer is ready
- If `printingEnabled` is also on, the code and QR are included on the printed slip (no change to printing logic needed — the field is already on the order)

### Verification code format

The `verificationCode` field is already populated on every order. If the existing format is not human-friendly (e.g. a UUID), it should be replaced with a **6-character alphanumeric code** (upper-case letters + digits, excluding ambiguous characters: 0, O, I, 1) generated at order creation time, unique within the txosna for the current day.

> **Open question for implementation:** confirm whether the current `verificationCode` value is already short and human-readable, or whether it needs to be regenerated in a friendlier format. Check `src/lib/store/memory.ts` or the order creation handler.

### Completed orders panel (food counter & drinks counter)

When `mobileTrackingEnabled` is on, the counter screen gains a **"Bukatutako eskaerak"** (Completed orders) section. A customer who missed the handoff moment, or who wants to download their receipt later, can approach the counter and ask the volunteer to look up their order.

The panel is collapsed by default and toggled open with a single tap — it does not compete with the active order queue.

```
┌─────────────────────────────────────────────────┐
│  ▸ Bukatutako eskaerak  (3)          [Ireki ▾]  │
└─────────────────────────────────────────────────┘

When open:

┌─────────────────────────────────────────────────┐
│  ▾ Bukatutako eskaerak  (3)          [Itxi ▴]  │
│                                                 │
│  #42  Gorka      18:33   H4 - 7K9   [QR] [↗]   │
│  #39  —          18:21   R2 - M3X   [QR] [↗]   │
│  #37  Amaia      18:14   T9 - 6LP   [QR] [↗]   │
│                                                 │
│  (Shows last 20 completed orders this session)  │
└─────────────────────────────────────────────────┘
```

- Each row shows: order number, customer name (or dash if not set), confirmation time, verification code, a small QR the customer can scan on the spot, and an external link icon `[↗]` that opens the tracking URL in a new tab (useful when the volunteer wants to show the customer on a shared screen)
- QR expands to full-screen on tap for easy scanning
- List is scoped to the current session (resets on PIN re-entry) and capped at the last 20 orders to keep the list short
- Only orders routed to this counter's type are shown (food counter shows food orders, drinks counter shows drinks orders); if SINGLE setup, all orders are shown

---

## 6. Customer Tracking Pages

### 6a. Code entry page — `/[locale]/[slug]/track`

- Lives in the `(public)` route group
- A single input field labelled "Zure kodea" (Your code) and a submit button
- Validates that the code is non-empty and matches the expected format before submitting
- On submit: navigates to `/[locale]/[slug]/track/[code]`
- If `mobileTrackingEnabled` is false for this txosna: renders a 404

```
┌──────────────────────────────────────────┐
│  🍔  Demo Janaria                        │
│                                          │
│  Sartu zure kodea                        │
│  Enter your order code                   │
│                                          │
│  ┌──────────────────────────┐            │
│  │  H4-7K9                  │            │
│  └──────────────────────────┘            │
│                                          │
│  [Bilatu / Find order]                   │
└──────────────────────────────────────────┘
```

### 6b. Order status page — `/[locale]/[slug]/track/[code]`

- Fetches the order via the lookup API (see section 7)
- If code not found: shows a friendly "Code not found" message with a link back to the entry page
- If found: shows real-time order status, identical in layout to the existing `/order/[id]` page
- Subscribes to the same SSE stream as the authenticated order page (`/api/orders/[orderId]`) — the SSE endpoint does not require auth, only the order ID; the lookup resolves code → order ID server-side

**Status display:**

```
┌──────────────────────────────────────────┐
│  Eskaera #42                             │
│  Demo Janaria · Apirilak 29              │
│                                          │
│  🍔 Janaria                              │
│  ████████████░░  Prestatzen              │
│  IN_PREPARATION                          │
│                                          │
│  🍺 Edariak                              │
│  ████████████████  Prest!               │
│  READY → joan edarietara                │
│                                          │
│  [Deskargatu txartela ↓]                │
└──────────────────────────────────────────┘
```

- Ticket download button is always visible (see section 8)
- Status updates in real time without page refresh
- No authentication required — the verification code is the customer's credential

---

## 7. Lookup API

### Endpoint

```
GET /api/txosnak/[slug]/orders/lookup?code={verificationCode}
```

### Auth

None. The verification code is the customer's credential. Rate-limiting should be applied to prevent brute-force enumeration (e.g. 10 requests per minute per IP per slug).

### Response (200)

```json
{
  "orderId": "clxxx",
  "orderNumber": 42,
  "customerName": "Gorka",
  "status": "CONFIRMED",
  "createdAt": "2026-04-29T18:32:00Z",
  "confirmedAt": "2026-04-29T18:33:00Z",
  "tickets": [
    {
      "id": "clyyy",
      "counterType": "FOOD",
      "status": "IN_PREPARATION"
    },
    {
      "id": "clzzz",
      "counterType": "DRINKS",
      "status": "READY"
    }
  ]
}
```

The response deliberately omits order lines and prices — those are included in the ticket download (section 8), not the live status view.

### Response (404)

```json
{ "error": "not_found" }
```

Returned when:
- Code does not match any order in this txosna
- `mobileTrackingEnabled` is false for this txosna

### Repository change

`OrderRepository` gains a new method:

```ts
findByVerificationCode(txosnaId: string, code: string): Promise<StoredOrder | null>
```

---

## 8. Ticket Download

### Availability

The download button is available once the order is `CONFIRMED` (payment collected, tickets created). It does **not** wait for COMPLETED — customers should be able to save a receipt immediately after paying.

This applies to all ordering channels: COUNTER, PHONE_TO_COUNTER, and future SELF_SERVICE.

Previously the requirements (section 21) scoped receipt download to after all tickets completed and to phone orders only. This feature removes both restrictions.

### Endpoint

```
GET /api/orders/[orderId]/receipt
```

- Returns a printable HTML page (not a PDF library) — simpler, fully translatable, works on all devices
- The browser's native print/save-as-PDF renders the receipt
- Auth: either a valid session OR the `code` query param matching `Order.verificationCode`

```
GET /api/orders/[orderId]/receipt?code={verificationCode}
```

### Receipt contents

| Field         | Value                                              |
| ------------- | -------------------------------------------------- |
| Txosna name   | `Txosna.name`                                      |
| Event name    | `Event.name`                                       |
| Date          | `Order.confirmedAt` (or `createdAt` if not set)    |
| Order number  | `Order.orderNumber`                                |
| Customer name | `Order.customerName` (if set)                      |
| Items         | Product name, variants, modifiers, qty, unit price |
| Total         | Computed from order lines                          |
| Footer note   | "Ez da zerga-dokumentua" (Not a fiscal document)   |

No logo, no barcode. Clean, printable layout. Locale derived from the URL segment.

---

## 9. Settings Integration

### Txosna settings page (`/[locale]/txosnak/[id]/settings`)

Add a new **"Jarraipen mugikorra"** (Mobile tracking) section:

```
Mobile tracking
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Enable mobile order tracking
[ ] Customers can check their order status by entering
    a code shown at the counter.

    Tracking URL:
    txosna.app/eu/[slug]/track       [Copy link]
```

- Toggle on/off
- When enabled: shows the tracking URL the admin can display or print as a QR at the stall entrance
- Persisted to `Txosna.mobileTrackingEnabled`

### API

`PUT /api/txosnak/[slug]/settings` already exists. Add `mobileTrackingEnabled` to the accepted body and the `StoredTxosna` type.

---

## 10. i18n Keys (new)

```
tracking.title                Jarraitu zure eskaera
tracking.code_label           Zure kodea
tracking.submit               Bilatu
tracking.not_found            Ez da aurkitu koderik
tracking.order_number         Eskaera #{number}
tracking.status.confirmed     Baieztatuta
tracking.status.in_prep       Prestatzen
tracking.status.ready         Prest — joan {counter}era
tracking.status.completed     Bukatua
tracking.download_receipt     Deskargatu txartela
tracking.receipt_footer       Ez da zerga-dokumentua
settings.mobile_tracking      Jarraipen mugikorra
settings.mobile_tracking_desc Bezeroak beren eskaeraren egoera ikusi dezakete kontragailuan emandako kode baten bidez.
counter.handoff_title         Eman kode hau bezeroari
counter.handoff_url           Jarraipen URL-a
counter.handoff_dismiss       Itxi
```

All four locales (eu, es, fr, en) required.

---

## 11. Implementation Phases

### Phase A — Schema & settings (prerequisite)

1. Add `mobileTrackingEnabled Boolean @default(false)` to `Txosna` in `prisma/schema.prisma`
2. Run `pnpm prisma migrate dev` and `pnpm prisma generate`
3. Add `mobileTrackingEnabled` to `StoredTxosna` in `src/lib/store/types.ts`
4. Update the memory store and settings handler to read/write the new field
5. Add the toggle to the txosna settings page

### Phase B — Lookup API

1. Add `findByVerificationCode` to `OrderRepository` interface and memory implementation
2. Create `GET /api/txosnak/[slug]/orders/lookup` route
3. Add basic IP-based rate limiting (use the `next/server` middleware or a simple in-memory counter for now)

### Phase C — Tracking pages

1. Create `(public)/[locale]/[slug]/track/page.tsx` — code entry form
2. Create `(public)/[locale]/[slug]/track/[code]/page.tsx` — status view
3. Wire SSE subscription from the status page using the existing `orderId` returned by lookup
4. Add all i18n keys

### Phase D — Counter handoff card

1. After order confirmation on the food counter and drinks counter screens, display the handoff card
2. Guard behind `txosna.mobileTrackingEnabled`
3. Render the QR (use an existing QR library if one is already in the project; otherwise add `qrcode.react`)

### Phase E — Ticket download

1. Create `GET /api/orders/[orderId]/receipt` route with dual auth (session or code param)
2. Create the receipt HTML template as a React Server Component (print stylesheet included)
3. Add "Deskargatu txartela" button to both the tracking status page and the existing `/order/[id]` page

---

## 12. Security Considerations

| Risk                                 | Mitigation                                                            |
| ------------------------------------ | --------------------------------------------------------------------- |
| Code enumeration                     | Rate-limit lookup API; use 6-char codes (36^6 ≈ 2 billion space)     |
| Receipt access without auth          | Code param accepted on receipt endpoint; rate limit applies           |
| Exposing order details to wrong user | Lookup scoped to `txosnaId`; response omits sensitive payment fields  |
| Demo txosna leakage                  | Demo txosnak return 404 on the tracking page (same as closed txosnak) |

---

## 13. Open Questions

1. **Verification code format**: Is the current `verificationCode` value human-readable? If it is a full CUID/UUID it needs to be replaced or supplemented with a short display code. Confirm before implementing Phase B.
2. **QR + tracking coexistence**: When both `qrValidationEnabled` and `mobileTrackingEnabled` are on, should the pickup-proof QR (volunteer scan) and the tracking QR (customer self-check) be the same code or different URLs? Recommended: same code, different scan context — volunteer scanning leads to validation flow, customer scanning leads to tracking page.
3. **Ticket download timing**: Requirements section 21 says "after all tickets completed." This spec proposes allowing download immediately after CONFIRMED. Confirm stakeholder preference.
4. **Receipt format**: Printable HTML is simpler and more accessible than PDF. Confirm this is acceptable, or whether a true PDF (e.g. via Puppeteer or a PDF library) is required.

---

_Last updated: session 18_
