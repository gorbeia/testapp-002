# Txosna App — Online Payments

_Session 19 — April 2026_

---

## 1. Design Principles

The app never handles money. Each association configures their own payment provider using their own merchant credentials. The app integrates with those providers to initiate and verify payments, but settlement flows directly between the customer and the association's merchant account.

Consequences of this model:

- The app has no PCI-DSS scope beyond transmitting card data to a hosted provider form
- No cross-association financial data; each set of credentials is scoped to one association
- Associations are responsible for their own provider contracts, fees, and reconciliation
- The app must store provider credentials securely (encrypted at rest, server-side only)

---

## 2. Supported Providers

A txosna can have **multiple active payment providers simultaneously**. For example, an association may configure both Stripe (for card payments and Apple/Google Pay) and Redsys (for Bizum via their bank). The customer sees all enabled methods on the payment screen and chooses.

### 2.1 Stripe

The recommended default path for new associations. Self-service onboarding, no bank visit required, excellent developer API.

**Why it fits:**

- Fully online signup — no branch visit, no guarantees deposit
- Single integration covers cards, Apple Pay, Google Pay, and Bizum (where supported)
- EEA domestic card fee: 1.5% + €0.25 per transaction
- Sandbox environment available before going live
- Webhooks for reliable payment confirmation

**What the association configures:**

- Stripe Publishable Key (client-side)
- Stripe Secret Key (server-side only, encrypted at rest)
- Stripe Webhook Secret (for verifying incoming events)

**Integration mode:** Stripe Payment Intents via redirect to Stripe Checkout, or embedded Payment Element. Redirect is simpler and keeps PCI scope minimal. Payment Element gives a more native feel — tradeoff to decide during implementation.

**Bizum via Stripe:** Available as a payment method within the Stripe Payment Element. The customer selects Bizum and is redirected to their bank app. Not all Spanish banks support it yet — worth testing coverage before recommending it as the primary Bizum path.

---

### 2.2 Redsys (Bank TPV Virtual)

The dominant online payment infrastructure in Spain. Most Spanish banks (Kutxabank, BBVA, CaixaBank, Santander, Sabadell, Bankinter, etc.) offer a _TPV Virtual_ (virtual POS) that runs on Redsys rails. Associations that already bank with Kutxabank — the dominant bank in the Basque Country and Navarre — may find this the most natural path.

**Why it fits:**

- Associations likely already have a banking relationship with the issuing bank
- Fees are negotiated directly with the bank: typically 0.4–0.9% for European cards
- Includes native Bizum integration (activated separately with the bank)
- Fully compliant with Spanish banking regulation by construction
- Sandbox environment (Redsys test credentials) available before contracting

**What the association needs to do:**

1. Visit their bank branch (or use the bank's online business portal if available)
2. Request a _TPV Virtual_ for e-commerce
3. Provide proof of activity (association statutes, NIF, bank account)
4. Receive merchant credentials: `Ds_MerchantCode`, `Ds_Terminal`, and the signing key
5. Activate Bizum as an additional payment method if desired

Setup typically takes 1–2 weeks. Some banks require a guarantees deposit for new merchants.

**What the association configures in the app:**

- Merchant Code (`Ds_MerchantCode`)
- Terminal number (`Ds_Terminal`)
- Signing key (HMAC-SHA256, encrypted at rest)
- Whether Bizum is activated on this TPV

**Integration mode:** Redirect. The app constructs a signed Redsys request (JSON params encoded in Base64, signed with HMAC-SHA256), redirects the customer to the Redsys payment page, and handles the return URL callback with signature verification. This keeps the app entirely out of card data handling.

**Kutxabank note:** Kutxabank's TPV Virtual is standard Redsys. No known integration quirks vs. the generic Redsys documentation, but credentials should be tested in the Redsys sandbox before the first live event.

---

### 2.3 Bizum

Bizum is a Spanish instant payment network with over 25 million registered users. It is not a standalone provider — it is offered as an add-on through both Stripe and Redsys. For festivals in the Basque Country, Bizum is a natural fit for local customers who use it daily.

**Constraints:**

- Requires a Spanish phone number and a Spanish bank account
- Not available to tourists or international customers
- Should be offered alongside card payments, not instead of them

**Recommended approach:**

- Bizum via Redsys if the association has a TPV Virtual (most reliable, widest bank coverage)
- Bizum via Stripe as an alternative (newer, coverage still expanding)

---

## 3. Payment Methods Matrix

| Method                            | Provider                      | Typical customer                | Notes                                           |
| --------------------------------- | ----------------------------- | ------------------------------- | ----------------------------------------------- |
| Visa / Mastercard (debit, credit) | Stripe or Redsys              | Any                             | Primary method for tourists and non-Bizum users |
| Apple Pay / Google Pay            | Stripe                        | Mobile-first customers          | Wallet wraps the underlying card                |
| Bizum                             | Redsys (preferred) or Stripe  | Local Spanish customers         | Fastest checkout for locals                     |
| American Express                  | Redsys (if activated by bank) | Less common in festival context | Optional                                        |

---

## 4. Domain Model Changes

### PaymentProvider (new entity)

| Attribute     | Type           | Notes                                                |
| ------------- | -------------- | ---------------------------------------------------- |
| txosna        | Txosna         | Which stall this provider is configured for          |
| provider_type | enum           | STRIPE, REDSYS                                       |
| display_name  | text           | Optional label shown to admin (e.g. "Kutxabank TPV") |
| enabled       | boolean        | Whether this provider is currently active            |
| credentials   | encrypted JSON | Provider-specific credentials — see below            |
| bizum_enabled | boolean        | Whether Bizum is activated on this provider          |
| verified_at   | datetime       | When the test transaction last passed                |
| created_at    | datetime       |                                                      |

**Credential schemas by provider:**

```typescript
// STRIPE
{
  publishable_key: string; // pk_live_...
  secret_key: string; // sk_live_... — encrypted at rest
  webhook_secret: string; // whsec_... — encrypted at rest
}

// REDSYS
{
  merchant_code: string; // Ds_MerchantCode
  terminal: string; // Ds_Terminal
  signing_key: string; // HMAC-SHA256 key — encrypted at rest
}
```

**Credential storage:** All secret values are encrypted using AES-256-GCM with a server-side key stored in environment variables. They are never returned in API responses, never logged, and never included in SSE events.

### Order — updated fields

| Attribute             | Type            | Notes                                                                                      |
| --------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| payment_provider      | PaymentProvider | Which provider processed this payment; null for cash                                       |
| payment_session_id    | text            | Provider-specific session/intent ID; stored for manual refund lookup in provider dashboard |
| payment_method_detail | enum            | CARD, APPLE_PAY, GOOGLE_PAY, BIZUM — captured at payment time                              |

### Txosna — updated `enabled_payment_methods`

The existing `enabled_payment_methods` list (CASH, ONLINE) is kept. ONLINE now means "at least one PaymentProvider is configured and enabled on this txosna." The specific methods available depend on which providers are active.

---

## 5. Provider Credential Validation

Before a txosna can go live with online payments, its configured providers must pass a validation check. This replaces guesswork with a fast, explicit test.

### Validation flow

1. Admin opens txosna payment configuration
2. Admin enters credentials for a provider
3. Admin taps **"Test connection"**
4. The server makes a minimal API call to the provider (e.g. retrieve account info for Stripe; call the Redsys test environment with a dummy transaction)
5. Success: `verified_at` is set; provider shown as ✓ Verified
6. Failure: specific error shown (invalid key, wrong terminal number, etc.)

### Validation checks per provider

**Stripe:**

- `GET /v1/account` using the secret key — confirms the key is valid and the account is active
- Attempt to create and immediately cancel a PaymentIntent for €0.50 in the Stripe test mode if publishable key starts with `pk_test_`, or validate against live mode otherwise
- Verify the webhook secret format (starts with `whsec_`)

**Redsys:**

- Construct a signed test transaction against the Redsys sandbox endpoint (`https://sis-t.redsys.es:25443/sis/rest/trataPeticionREST`)
- A response code of `0000` (authorised) or a recognised test error confirms that credentials and signing are correct
- Note: Redsys sandbox requires specific test card numbers; the app uses a hardcoded test card for the validation call

### Re-validation

Credentials should be re-validated:

- Whenever credentials are updated
- Automatically before the first order of a new event (background check on txosna OPEN)
- Shown as a warning (not a blocker) if `verified_at` is older than 30 days

---

## 6. Payment Flow — Phone-to-Counter with Online Payment

```
Customer places order on phone
  │
  ├── Order created as PENDING_PAYMENT
  │
  │   Customer taps "Pay online"
  │   ↓
  │   App shows available payment methods
  │   (based on active providers on this txosna)
  │   ↓
  │   Customer selects method (card / Bizum / Apple Pay / etc.)
  │   ↓
  │   Server creates payment session with the chosen provider
  │   ↓
  │   Customer redirected to provider payment page
  │   ↓
  │   ┌── Payment successful
  │   │     Provider webhook received → order confirmed → tickets created
  │   │     Customer redirected back to order status screen
  │   │
  │   └── Payment failed / abandoned
  │         Order remains PENDING_PAYMENT until timeout
  │         Customer can retry with a different method
  │
  └── (alternative) Customer goes to counter and pays cash
        Volunteer confirms payment manually → order confirmed
```

**Webhook reliability:** Payment confirmation must arrive via webhook, not only via the redirect return URL. The return URL can be blocked by network issues, browser back-navigation, or app closure. Webhooks are the authoritative signal.

**Polling fallback:** If the customer returns via the success redirect URL and the order is still PENDING_PAYMENT, the server queries the provider for the current session status before rendering the post-order screen. This handles delayed webhooks and server restarts. If the provider confirms the payment succeeded, the order is confirmed immediately and the webhook (when it eventually arrives) is handled idempotently.

**Idempotency:** The webhook handler must be idempotent — processing the same webhook event twice must not confirm the order twice or create duplicate tickets.

**Refunds:** Refunds are always handled in cash at the counter. The `payment_session_id` stored on the order allows the admin to locate the transaction in the provider dashboard (Stripe dashboard or bank TPV backoffice) for reference. No refund API integration.

---

## 7. Customer Payment Screen

The customer payment screen appears after the order summary, before placing the order. It is part of the phone-to-counter ordering flow.

### Layout

```
┌─────────────────────────────┐
│  How would you like to pay? │
├─────────────────────────────┤
│  💳 Card                    │  ← redirects to Stripe or Redsys card form
│  📱 Bizum                   │  ← shown only if Bizum is enabled
│  🍎 Apple Pay               │  ← shown only on Safari / iOS if Stripe enabled
│  G  Google Pay              │  ← shown only on Android Chrome if Stripe enabled
│  ─────────────────────────  │
│  💵 Pay at the counter      │  ← always available if CASH is enabled
│     Go to the stall and     │
│     pay when you pick up    │
└─────────────────────────────┘
```

**Progressive disclosure:** The payment method list is built dynamically from active providers and the customer's device. Apple Pay only shows on iOS Safari; Google Pay only on Android Chrome. Bizum only shows if enabled and (optionally) the device has a Spanish locale or phone number — though this detection is a best-effort hint, not a gate.

**Wait time reminder:** The current wait time estimate is shown again on this screen so the customer knows whether to pay online now or go to the counter.

---

## 8. Admin Configuration Screen — Payments

Located in the txosna configuration, under a **Payments** tab.

### Layout

```
PAYMENT METHODS
─────────────────────────────────────────────────

Cash payments            [● Enabled]
Customers pay at the counter when picking up.

─────────────────────────────────────────────────

ONLINE PAYMENT PROVIDERS

  ┌──────────────────────────────────────────┐
  │  Stripe          ✓ Verified  [● Active]  │
  │  Cards, Apple Pay, Google Pay, Bizum     │
  │  [Edit credentials]  [Test connection]   │
  └──────────────────────────────────────────┘

  ┌──────────────────────────────────────────┐
  │  Redsys / Bank TPV   ⚠ Not verified      │
  │  [● Active]                              │
  │  Cards, Bizum                            │
  │  [Edit credentials]  [Test connection]   │
  └──────────────────────────────────────────┘

  [+ Add payment provider]

─────────────────────────────────────────────────

PENDING PAYMENT TIMEOUT
Auto-cancel unpaid phone orders after:  [ 15 ] minutes
```

### Credential entry form (Stripe)

```
Stripe credentials
─────────────────────────────
Publishable key    [pk_live_...]
Secret key         [sk_live_...] 🔒
Webhook secret     [whsec_...]   🔒

Webhook URL        https://txosna.app/api/payments/webhook/stripe  [Copy]
                   ↑ Register this URL in your Stripe dashboard under
                     Developers → Webhooks before going live.
                     Required events: payment_intent.succeeded,
                     payment_intent.payment_failed

ℹ  The secret key and webhook secret are stored
   encrypted and never shown again after saving.
   To update them, enter new values and save.

[Cancel]                    [Save & test connection]
```

### Credential entry form (Redsys)

```
Redsys / Bank TPV credentials
─────────────────────────────
Bank / label       [Kutxabank TPV]  (your reference only)
Merchant code      [Ds_MerchantCode]
Terminal           [Ds_Terminal]
Signing key        [••••••••••••]   🔒

Bizum              [☐ Activated on this TPV]

ℹ  Request these credentials from your bank branch
   or your bank's online business portal.
   The signing key is stored encrypted and never
   shown again after saving.

[Cancel]                    [Save & test connection]
```

---

## 9. Architecture — Provider Abstraction Layer

```typescript
// lib/payments/types.ts

interface PaymentSession {
  session_id: string;
  redirect_url: string; // where to send the customer
  expires_at: Date;
}

interface PaymentEvent {
  session_id: string;
  status: 'succeeded' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  method: 'CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'BIZUM';
}

interface PaymentProvider {
  validate(): Promise<{ ok: boolean; error?: string }>;
  createSession(order: Order, returnUrl: string): Promise<PaymentSession>;
  verifyWebhook(request: Request): Promise<PaymentEvent>;
}
```

```typescript
// lib/payments/factory.ts
import { StripeProvider } from './stripe';
import { RedsysProvider } from './redsys';

export function getProvider(config: TxosnaPaymentProvider): PaymentProvider {
  switch (config.provider_type) {
    case 'STRIPE':
      return new StripeProvider(config.credentials);
    case 'REDSYS':
      return new RedsysProvider(config.credentials);
  }
}
```

```typescript
// app/api/payments/session/route.ts
// Called by the customer app when they tap a payment method

export async function POST(request: Request) {
  const { orderId, providerType, returnUrl } = await request.json();

  const order = await getOrder(orderId); // validates order is PENDING_PAYMENT
  const provider = await getActiveProvider(order.txosna, providerType);
  const session = await provider.createSession(order, returnUrl);

  await savePaymentSession(order, provider, session);
  return Response.json({ redirect_url: session.redirect_url });
}
```

```typescript
// app/api/payments/webhook/[provider]/route.ts
// One route per provider; called by the provider's servers

export async function POST(request: Request, { params }) {
  const provider = getProviderByType(params.provider); // no credentials needed for webhook
  const event = await provider.verifyWebhook(request);

  if (event.status === 'succeeded') {
    await confirmOrder(event.session_id, event.method); // idempotent
  }

  return new Response('ok', { status: 200 });
}
```

**Redsys redirect signing** uses HMAC-SHA256 over a Base64-encoded JSON parameter block. The key insight is that the signature must be calculated server-side (the signing key never touches the browser), and the return URL response must also be verified before confirming the order. There are maintained Node.js open-source libraries for this (`redsys-easy` is the most commonly used in 2025).

---

## 10. Glossary Additions

| Term                  | English               | Definition                                                                                                                                         |
| --------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| PaymentProvider       | Payment provider      | A configured online payment integration on a txosna; an association can have multiple active providers simultaneously                              |
| TPV Virtual           | Virtual POS           | A virtual point-of-sale contract with a Spanish bank, running on Redsys infrastructure; used for card and Bizum payments                           |
| Redsys                | Redsys                | The dominant Spanish payment processing infrastructure; accessed via a TPV Virtual contracted through a bank                                       |
| Bizum                 | Bizum                 | A Spanish instant payment network offered as a payment method through Redsys and Stripe; requires a Spanish phone number and bank account          |
| Stripe                | Stripe                | An international payment platform supporting cards, Apple Pay, Google Pay, and Bizum; self-service signup, no bank visit required                  |
| Payment session       | Payment session       | A short-lived payment intent created by the app when the customer initiates an online payment; has its own expiry independent of the order timeout |
| Webhook               | Webhook               | An HTTPS callback from the payment provider to the app server confirming payment outcome; the authoritative signal for order confirmation          |
| Credential validation | Credential validation | A test API call confirming that a provider's credentials are correct before the txosna goes live                                                   |
| Payment method detail | Payment method detail | How the specific online payment was made: CARD, APPLE_PAY, GOOGLE_PAY, or BIZUM; captured per order                                                |

---

## 11. Decisions

| #   | Question                                                                             | Decision                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Can the customer switch payment method mid-flow (e.g. card fails, retry with Bizum)? | **Yes.** The order stays PENDING_PAYMENT until timeout, so the customer can return to the payment method screen and try a different method. UX for the retry flow to be designed.                                                                                                                    |
| 2   | Refunds via provider API?                                                            | **Not in scope.** Refunds are always handled in cash at the counter. The `payment_session_id` is stored on the order so the admin can locate the transaction in the provider dashboard if needed. No refund API integration planned.                                                                 |
| 3   | Webhook URL display in admin config?                                                 | **Yes.** The Stripe credential form shows the correct webhook URL as a read-only field with a copy button. Instructions explain that this URL must be registered in the Stripe dashboard before going live. Redsys does not require webhook registration — the return URL is passed per-transaction. |
| 4   | Webhook delay / polling fallback?                                                    | **Yes.** If the customer returns via the success redirect URL and the order is still PENDING_PAYMENT, the server queries the provider for the session status before rendering the post-order screen. This handles restarts and delayed webhooks.                                                     |
| 5   | Multi-currency?                                                                      | **EUR only.** All txosnak price in EUR. No multi-currency support.                                                                                                                                                                                                                                   |

---

_Last updated: session 19_
