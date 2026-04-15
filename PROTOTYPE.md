# Txosnabai — Prototype Reference

## Domain Model

### Product (`MockProduct`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `categoryId` | string | Parent category |
| `name` | string | Display name |
| `description` | string \| null | Short description shown on menu |
| `price` | number | Base price in € |
| `imageUrl` | string \| null | Optional image |
| `allergens` | string[] | Allergen codes: gluten, laktosa, arrautzak, fruitu lehorrak, soja, krustazeoak, arrain, sesamo |
| `dietaryFlags` | ("V"\|"VG"\|"GF"\|"HL")[] | V=Begetariano, VG=Begano, GF=Gluten gabe, HL=Halal |
| `ageRestricted` | boolean | +18 product (alcohol) |
| `requiresPreparation` | boolean | Sent to KDS / kitchen screen |
| `available` | boolean | Visible in menu |
| `soldOut` | boolean | Visible but cannot be ordered |
| `variantGroups` | VariantGroup[] | Mutually-exclusive choice groups (e.g. side dish). Exactly one option must be selected per group. |
| `modifiers` | Modifier[] | Optional add-ons with an extra price (e.g. extra sauce +0.50 €) |
| `removableIngredients` | string[] | Named ingredients that can be removed at order time (e.g. letxuga, tipula). No price change. |
| `splitAllowed` | boolean | Whether this item can be split among multiple people |
| `splitMaxWays` | number | Maximum number of ways to split (1 = no split) |
| `preparationInstructions` | string \| null | Markdown instructions shown on KDS |

### VariantGroup / VariantOption

- A product can have zero or more **VariantGroups** (e.g. "Albokoa: Patata / Entsalada").
- Each group requires exactly **one option** to be selected.
- Options may carry a `priceDelta` (positive or negative) that adjusts the unit price.

### Modifier

- Optional extras the customer may add.
- Each modifier has a `price` (0 = free).
- Multiple modifiers can be active simultaneously.

### Removable Ingredients

- Named components of the product that the customer can ask to remove.
- Shown as toggle chips in the order configuration UI.
- Selected removals are encoded in the order line notes as `Kendu: X, Y`.
- Appear on the kitchen ticket so staff know what to omit.

### Split

- Configured per product: `splitAllowed` and `splitMaxWays`.
- At order time, the volunteer selects how many ways to split (1 = no split, up to `splitMaxWays`).
- The per-person price is displayed live: `(unitPrice × qty) / splitWays`.
- Split info is stored in `MockOrderLine.splitInstructions` as `"Ntan banatu"`.

---

## Order Line (`MockOrderLine`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | |
| `productId` | string | |
| `productName` | string | Snapshot of name at time of order |
| `quantity` | number | |
| `unitPrice` | number | Computed: base + variant delta + modifier prices |
| `selectedVariant` | string \| null | Name of selected variant option |
| `selectedModifiers` | string[] | Names of active modifiers |
| `splitInstructions` | string \| null | e.g. "3tan banatu" |

---

## Ticket (`MockTicket`)

Tickets are the kitchen-facing view of an order line group.

| Status | Meaning |
|--------|---------|
| `RECEIVED` | Order confirmed, waiting to start |
| `IN_PREPARATION` | Kitchen is preparing |
| `READY` | Ready for pick-up |
| `COMPLETED` | Delivered |
| `CANCELLED` | Cancelled |

---

## Screens

| Route | Role | Description |
|-------|------|-------------|
| `/[locale]/[slug]` | Customer | Product menu, add to cart |
| `/[locale]/[slug]/checkout` | Customer | Review cart, enter name, submit order |
| `/[locale]/order/[id]` | Customer | Order status tracker (CONFIRMED → READY) |
| `/[locale]/order/[id]/proof` | Customer | Pick-up proof / QR code |
| `/[locale]/counter` | Volunteer | Food counter — manage queue, create orders, mark ready |
| `/[locale]/drinks` | Volunteer | Drinks counter — queue + quick-serve grid |
| `/[locale]/overview` | Volunteer | Cross-counter overview |
| `/[locale]/txosna` | Admin | Txosna settings (general, payment, orders, QR) |
| `/[locale]/menu` | Admin | Product catalogue management |
| `/[locale]/volunteers` | Admin | Volunteer roster |
| `/[locale]/reports` | Admin | Sales reports with date filter |

---

## Settings — Payment

- **Efektiboa** (cash): always available.
- **Txartela** (card): toggle on/off. When enabled, choose processor:
  - **Stripe**: publishable key, secret key, webhook secret + webhook URL hint.
  - **Redsys**: merchant FUC, SHA-256 key, terminal number + notification URL hint.
  - Test mode toggle for both.

## Settings — Orders

- Counter type: SINGLE (one shared queue) or SEPARATE (food / drinks independently).
- Ordering channels: Counter, Phone-to-counter, Self-service.
- Max items per order.
- Kitchen printer (optional): ESC/POS or STAR protocol, IP address, port.

---

## Dietary Flags

| Code | Label | Emoji |
|------|-------|-------|
| V | Begetariano | 🌿 |
| VG | Begano | 🌱 |
| GF | Gluten gabe | 🚫🌾 |
| HL | Halal | ☪️ |

---

## Theme System

- Dark/light mode via `html.dark` CSS class.
- Persisted in `localStorage` under key `txosna-theme`.
- Falls back to `prefers-color-scheme`.
- CSS token namespaces:
  - `--adm-*` — admin pages
  - `--ops-*` — volunteer/ops pages (dark by default)
  - `--cust-*` — customer-facing pages (light)
