# Txosna App — UI Analysis & Design Specification

_Session 18 — April 2026_

---

## 1. Design Philosophy

### Context first

The Txosna App operates in one of the most demanding UI environments imaginable — a loud, busy, outdoor festival, with users ranging from stressed kitchen volunteers to customers who have had a few drinks. Every design decision must be justified against this context, not against what looks good on a design portfolio.

### The three design registers

The app has three fundamentally different use contexts, each requiring a different design register:

**Operational screens** (counter, kitchen, drinks bar) — utilitarian, high contrast, large touch targets, speed above everything. No decorative elements. Information density must be high but immediately scannable.

**Customer screens** (ordering, pickup proof, order board) — clear, inviting, accessible to tourists who may not speak the local language. Images and visual cues matter. Trust and clarity are the priorities.

**Admin screens** (configuration, menu, reports) — used before events, not under time pressure. Can afford more complexity and information density. Standard web app patterns are acceptable here.

### Design principles

- **Glanceable over readable** — if a volunteer needs to read carefully, the design has failed
- **Tap targets first** — minimum 48px touch targets on all interactive elements; 56px on operational screens
- **Outdoor contrast** — WCAG AA minimum everywhere; AAA on pickup proof and order board
- **Speed over beauty** — the drinks counter should feel like a POS terminal, not a web app
- **Progressive disclosure** — show what is needed now; hide complexity behind a single tap

### Visual identity

The app serves Basque cultural associations. The visual identity should feel rooted in that context — warm, community-oriented, not corporate. A dark theme for operational screens (better outdoor readability; less eye strain under artificial kitchen light); a warm light theme for customer-facing screens.

---

## 2. Design System

### Colour palette

**Operational theme (dark)** — used on counter, kitchen, and drinks counter screens:

- Background: `#0f1117` (near-black)
- Surface: `#1a1d27` (card backgrounds)
- Border: `#2a2d3a`
- Primary action: `#e85d2f` (warm orange — energetic, visible)
- Success / ready: `#22c55e` (green)
- Warning / flagged: `#f59e0b` (amber)
- Danger / sold out: `#ef4444` (red)
- Text primary: `#f8f9fa`
- Text secondary: `#9ca3af`

**Customer theme (light)** — used on ordering, pickup proof, order board:

- Background: `#faf8f5` (warm off-white)
- Surface: `#ffffff`
- Border: `#e5e0d8`
- Primary action: `#e85d2f` (same warm orange — brand consistency)
- Text primary: `#1a1209`
- Text secondary: `#6b6460`
- Accent: `#2d5a3d` (deep green — Basque landscape reference)

**Shared accents:**

- Order status RECEIVED: `#3b82f6` (blue)
- Order status IN_PREPARATION: `#f59e0b` (amber)
- Order status READY: `#22c55e` (green)
- Order status CANCELLED: `#6b7280` (grey)

### Typography

- **Display / headings**: A humanist sans-serif with character — Nunito or DM Sans. Warm, legible, not corporate.
- **Body / UI**: System font stack for speed, or DM Sans if bundled — reliable, neutral, legible at small sizes.
- **Monospace (order numbers, codes)**: JetBrains Mono — clear distinction between similar characters (0/O, 1/l)

### Spacing scale

Based on 4px grid: 4, 8, 12, 16, 24, 32, 48, 64. Operational screens use larger spacing increments for touch targets.

### Border radius

- Cards: `12px`
- Buttons: `8px`
- Pills / status badges: `full`
- Input fields: `8px`

### Iconography

Lucide icons — consistent, clean, widely understood. Used sparingly on operational screens (text labels always accompany icons on critical actions).

---

## 3. Customer Ordering Screen

### Context

A customer standing at the festival, possibly outdoors in sunlight, on their own phone. They may be a tourist unfamiliar with Basque food names. They want to order quickly and rejoin their group.

### Entry point

The customer scans a QR code or visits the txosna's public URL. No login. Language selection appears first if the browser locale does not match a supported language — a simple four-button full-screen choice (Euskara / Español / Français / English). This choice is remembered.

### Layout structure

**Single scrolling column** on mobile. No tabs, no drawer navigation — the full menu is visible by scrolling.

```
┌─────────────────────────┐
│  Txosna name + status   │  ← sticky header; shows OPEN / PAUSED / CLOSED
│  Wait time estimate     │  ← "Orders ~8 min" — shown after 5 completed
├─────────────────────────┤
│  Category: FOOD         │  ← sticky category headers as user scrolls
│  ┌────────┐  ┌────────┐ │
│  │Product │  │Product │ │  ← 2-column grid on phone; 3-4 on tablet
│  │ card   │  │ card   │ │
│  └────────┘  └────────┘ │
├─────────────────────────┤
│  Category: DRINKS       │
│  ┌────────┐  ┌────────┐ │
│  │        │  │        │ │
│  └────────┘  └────────┘ │
├─────────────────────────┤
│  [View order — 3 items] │  ← floating bottom bar; appears when cart > 0
└─────────────────────────┘
```

### Product card

Each card is compact but carries essential information:

- Product image (or a placeholder with the category icon if no image)
- Product name (large, bold)
- Price
- Dietary flags as small coloured icons (V, VG, GF) — not text labels
- Allergen warning icon if allergens present — tapping expands the list
- Age-restricted badge if applicable
- SOLD OUT overlay when unavailable — greyed out, not removed entirely (so customer knows it exists)

Tapping a product card opens a **product detail sheet** (bottom sheet on mobile, modal on desktop).

### Product detail sheet

Slides up from the bottom. Contains:

- Large product image (if available)
- Product name and description
- Full allergen list with icons
- Dietary flags
- Variant group selector (required — must select before adding)
- Modifier checkboxes (optional)
- Real-time effective allergen summary — updates as variants/modifiers are selected
- Quantity stepper
- Split instructions field (if product is splittable and quantity > 1)
- "Add to order" button — disabled until all required variants are selected

### Order confirmation flow

Tapping "View order" opens the order summary:

- List of all items with variants, modifiers, and prices
- Order total
- Order notes field (single text input)
- Name field (required — clearly explained: "So we can call you when your order is ready")
- Push notification permission toggle ("Notify me when ready") — explains what this means
- Age declaration checkbox if any age-restricted product is in the order
- Wait time estimate repeated here
- "Place order" button — prominent, full-width

### Post-order screen

After placing the order:

- Order number displayed prominently
- Current status with a progress indicator (pending payment / received / in preparation / ready)
- Clear explanation of next steps: "Go to the counter to pay"
- If push notifications are enabled: confirmation that they will be notified

### Kitchen pause / txosna closed state

If the txosna is paused or closed when the customer visits:

- Full-screen clear message: "We are temporarily not taking orders — please come back shortly" (or "We are closed for the evening")
- Txosna name and branding still visible
- No menu shown — avoids frustration of browsing an unavailable menu

---

## 4. Pickup Proof Screen

### Context

The customer's phone screen shown to the volunteer at collection. Must be readable by a third person glancing at it in 2 seconds under any lighting condition.

### Design priorities

- Maximum contrast (dark background, white text)
- Largest possible text for the most important information
- Screen must not lock / dim — use the WakeLock API
- No interaction needed — purely informational

### Layout

```
┌─────────────────────────┐
│  TXOSNA NAME            │  ← small, top
│  ─────────────────────  │
│                         │
│  JOSU                   │  ← customer name — very large, bold
│                         │
│  Order #47              │  ← order number — large
│  Code: AX47             │  ← verification code — monospace, large
│                         │
│  ─────────────────────  │
│  2× Burger (chips)      │  ← order summary — clear list
│  1× Beer (large)        │
│                         │
│  [QR CODE]              │  ← if QR validation enabled; full width
│                         │
│  🍽 FOOD COUNTER        │  ← which counter to go to; icon + text
│                         │
│         READY           │  ← status — large green badge
└─────────────────────────┘
```

### Separate counter mode

When a txosna has separate counters, there are **two separate pickup proof screens** — one for food, one for drinks. The customer sees whichever ticket(s) are ready. A tab or page indicator shows "Food (ready) / Drinks (in preparation)" so the customer understands the full picture.

### Colour coding by status

- READY: dark green background (`#14532d`), white text
- IN_PREPARATION: dark amber background (`#78350f`), white text — customer is waiting
- The screen automatically updates when status changes — no refresh needed

---

## 5. Order Board (Display Screen)

### Context

A large screen (TV, monitor, tablet) at the festival stall showing all active orders. Customers glance at it from a distance of 1-3 metres while waiting. No interaction.

### Design priorities

- Readable from 3 metres
- Updates smoothly in real time without jarring refreshes
- Clear visual hierarchy: READY orders draw the eye immediately
- Works on both large screens (TV landscape) and phones (portrait)

### Layout — large screen (landscape)

```
┌──────────────────────────────────────────────────────┐
│  TXOSNA NAME                          ~8 min wait    │
├──────────────┬───────────────────────────────────────┤
│   READY ✓    │           IN PREPARATION              │
├──────────────┼───────────────────────────────────────┤
│  #34  JOSU   │  #31  MIREN    #32  ANDER    #33  ---│
│  #38  ANE    │  #35  LEIRE    #36  IBAI             │
│  #41  MIKEL  │  #37  ---      #39  AITOR            │
└──────────────┴───────────────────────────────────────┘
```

- READY column: green background, large text, order number and name
- IN_PREPARATION column: neutral background, order numbers and names
- Names show only if provided; otherwise order numbers only
- Slow orders (2x average) subtly highlighted in amber in the IN_PREPARATION column

### Animation

When an order moves to READY, it slides from the IN_PREPARATION column to READY with a smooth transition and a brief pulse animation. This draws the customer's eye without being distracting.

### Layout — phone (portrait)

Stacked: READY orders at the top (full width, high contrast), IN_PREPARATION below in a scrollable list.

---

## 6. Counter Volunteer Screen

### Context

A volunteer registering orders and handling cash payments. One or two people queuing in front of them. Possibly holding a phone in one hand. Must be fast and accurate — mistakes mean incorrect orders or wrong change.

### Entry point

After PIN entry the volunteer selects: Food Counter / Drinks Counter / Kitchen. For a single-counter txosna, Food Counter is the only operational option.

### Layout structure — food counter

```
┌─────────────────────────┐
│  [≡] Aste Nagusia  [⏸]  │  ← header: txosna name, pause button
├─────────────────────────┤
│  PENDING (2)            │  ← phone orders waiting for payment
│  #42 Josu — 2 items   › │
│  #44 Ane  — 1 item    › │
├─────────────────────────┤
│  NEW ORDER              │  ← register a counter order
│  [+ Burger]  [+ Beer]   │  ← quick-add buttons for most recent products
│  [Browse menu ›]        │
├─────────────────────────┤
│  READY (1)              │  ← ready tickets not yet collected
│  #39 Mikel — Food ✓    │
└─────────────────────────┘
```

### Registering a new counter order

Tapping "Browse menu" opens the full menu in a bottom sheet. Same category/product layout as the customer screen but more compact — no images by default (faster to load), dietary info visible, variants and modifiers inline.

Quick-add buttons at the top show the 4-6 most frequently ordered products as one-tap shortcuts — reduces the need to browse for common orders.

### Pending phone orders

Each pending order shows: order number, customer name, items summary, time since placed. Tapping opens the full order detail.

On the order detail:

- Full order with items, variants, modifiers, notes
- Age verification prompt if applicable (must acknowledge before proceeding)
- Amount paid field (optional, for change calculation)
- "Confirm payment" button — large, green
- "Cancel order" button — smaller, requires confirmation

### Order editing

A pencil icon on any RECEIVED or IN_PREPARATION order opens an edit mode. Inline editing of quantities; adding/removing items via the same menu sheet. Price difference shown prominently.

### READY orders section

Compact list of tickets marked ready but not collected. Customer name and order number visible. Tap to view full details if needed. Designed to prompt the volunteer to call out the name.

### Cross-counter access

A small "Drinks counter" tab at the top of the screen gives access to drinks tickets. Not the primary view but always accessible. Same layout, different ticket type.

---

## 7. Drinks Counter Screen

### Context

The most speed-critical screen in the app. A volunteer at a busy bar serving beer, wine, and soft drinks rapidly. Customers call out orders verbally. The volunteer needs to register and confirm in under 5 seconds.

### Design philosophy

This screen should feel like a **POS (point of sale) terminal** — a grid of large product buttons, minimal navigation, immediate feedback. Not a web app.

### Layout

```
┌─────────────────────────────────────────┐
│  [≡] Bar              [⏸]  Orders: 12  │
├─────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ Zurito │ │  Caña  │ │ Pinta  │      │  ← large tap buttons
│  │  €1.50 │ │  €2.00 │ │  €3.00 │      │     one tap = add to current order
│  └────────┘ └────────┘ └────────┘      │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │  Txak. │ │Kalimotx│ │  Agua  │      │
│  │  €2.50 │ │  €2.00 │ │  €1.00 │      │
│  └────────┘ └────────┘ └────────┘      │
├─────────────────────────────────────────┤
│  Current order:  Caña ×2  Txak. ×1     │  ← running tally
│  Total: €6.50   [✕ Clear]  [✓ Confirm] │
└─────────────────────────────────────────┘
```

### Interaction model

- **One tap** adds one unit of a product to the current order
- **Long press** or **tap the item in the tally** to adjust quantity or remove
- **Confirm** sends the order to the drinks ticket lifecycle and clears the current order
- No name required by default for drinks-only counter orders (but available as an option)
- No navigation away from this screen during service

### Products with variants (e.g. mojito)

Products that require variants show a small indicator. Tapping them opens a minimal bottom sheet with only the variant options — no other product detail. Designed to be dismissed in one tap after selection.

### Products requiring preparation (e.g. mojito)

A small clock icon indicates this product goes through the full IN_PREPARATION lifecycle. The volunteer sees this before confirming.

### Age-restricted products

The confirm button is replaced with "Verify ID & Confirm" if the order contains an age-restricted product. The volunteer cannot skip this step.

### Pending phone orders

A counter badge on the header shows the number of pending phone orders. Tapping opens a minimal list — volunteer confirms payment with a single tap per order. Designed to handle quickly between bar orders.

---

## 8. Kitchen Display System (KDS)

### Context

A screen (tablet, old laptop, or phone) propped up in the kitchen near the cooking area. Kitchen volunteers glance at it while preparing food. It may be splashed with liquids. It needs to survive rough handling.

### Design priorities

- Readable from 1 metre while standing
- Minimum interaction — status changes with a single tap
- Preparation instructions accessible but not intrusive
- Sold out management quick and reversible
- Clear visual hierarchy: new orders draw attention immediately

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Kitchen — Aste Nagusia          [⏸ Pause] [✕ Close]│
├──────────────┬───────────────────┬───────────────────┤
│  RECEIVED    │  IN PREPARATION   │  READY            │
├──────────────┼───────────────────┼───────────────────┤
│  ┌─────────┐ │  ┌─────────┐     │  ┌─────────┐      │
│  │ #41     │ │  │ #38  ⏱  │     │  │ #35 ✓   │      │
│  │ Josu    │ │  │ Miren   │     │  │ Ander   │      │
│  │ 2×Burg  │ │  │ 1×Burg  │     │  │ 1×Salad │      │
│  │ 1×Salad │ │  │ 2×Salad │     │  │         │      │
│  │ [→ Prep]│ │  │ [→ Ready│     │  │ [→Done] │      │
│  └─────────┘ │  └─────────┘     │  └─────────┘      │
└──────────────┴───────────────────┴───────────────────┘
```

### Ticket card design

Each ticket is a card showing:

- Order number (large, bold)
- Customer name (if provided)
- Items with quantities, variants, modifiers in plain language ("Burger × 2 — chips, no onion")
- Order notes if present (highlighted)
- Split instructions if present
- Time in current status (small, bottom of card)
- Slow order indicator (⏱ amber) if significantly over session average
- Order changed alert (🔔 orange banner) if counter edited this ticket while in preparation

**Single large tap button** to advance status: "→ Start" (RECEIVED → IN_PREPARATION), "→ Ready" (IN_PREPARATION → READY), "→ Done" (READY → COMPLETED).

### Preparation instructions

A small book icon on each card. One tap opens a full-screen overlay with the Markdown-rendered instructions and embedded images. Tap anywhere to dismiss. This overlay is designed to be read quickly — large text, high line spacing.

### Sold out management

A "Sold out" button in the header (or accessible via a swipe on the product) opens a simple product list with toggle switches. Marking a product as sold out requires one tap — no confirmation (it is reversible). The change propagates immediately.

### Layout on different devices

- **Tablet (landscape)**: Three-column Kanban layout as above
- **Phone (portrait)**: Single column with status filter tabs (RECEIVED / IN_PREPARATION / READY)
- **Large screen**: Four columns including COMPLETED (recent, last 10 minutes)

---

## 9. Status Overview Screen

### Context

Any logged-in volunteer wanting a quick snapshot of the txosna state. Used for handovers, or when a volunteer steps away and returns.

### Layout

A single scrollable screen with clear sections:

- **Txosna status** — large badge: OPEN / PAUSED / CLOSED
- **Counter summary** — count of tickets by status for food and drinks
- **Pending payment** — list of phone orders not yet paid, with time elapsed
- **Flagged orders** — any orders with sold out products requiring resolution
- **Ready not collected** — tickets marked ready but not yet picked up
- **Active volunteers** — who is logged in (counter / kitchen)

All data updates in real time via SSE. No actions taken from this screen — it is read-only. Each section links to the relevant operational screen.

---

## 10. Admin Configuration Screens

### Context

Used before events, at a desk or table, not under time pressure. The admin is setting up menus, txosnak, and volunteers. A more standard web app UX is appropriate here.

### Design approach

Light theme. Standard form patterns. Shadcn/ui components used as-is. More information density acceptable. Still mobile-responsive — many admins will configure from their phone.

### Menu management

The most complex admin screen. Key interactions:

- **Category management**: drag-and-drop reordering; add/edit/delete categories; FOOD or DRINKS type toggle
- **Product list**: drag-and-drop reordering within category; inline price editing; quick toggle for availability
- **Product detail**: full form with all fields; image upload; preparation instructions written in a Markdown editor with preview; variant group builder; modifier builder
- **Allergen selector**: visual grid of the 14 EU allergens with icon + name; toggleable

### Txosna configuration

Wizard-style setup for new txosnak. Fields grouped logically: basic info → counter setup → menu configuration (copy from previous or demo txosna) → notification modes → PIN setup. Progress indicator at the top.

For existing txosnak: tabbed layout with sections for settings, menu overrides, and reports.

### Volunteer management

Simple table of volunteers with name, email, role, and active status. Add volunteer opens a form. Inline deactivation. No complex permissions — just Admin or Volunteer.

### Onboarding guide

Displayed as a persistent checklist sidebar (or top banner on mobile) until all steps are completed:

1. ☐ Create your first event
2. ☐ Set up a txosna
3. ☐ Add products to your menu
4. ☐ Invite a volunteer (or skip)
5. ☐ Try the demo txosna

Each step links directly to the relevant screen. Dismissible after all steps are complete.

---

## 11. Volunteer Login & PIN Entry

### Login screen

Clean, minimal. Association branding at the top (name, no logo needed initially). Email and password fields. "Forgot password" link. No other navigation — this is a focused task.

Password reset flow: single email field → "Check your email" confirmation screen → link opens a new password form. Three screens, no complexity.

### PIN entry screen

After login, the volunteer sees the txosna name and a large numpad for PIN entry. Clear, fast. Shows which operational mode will be entered (food counter / drinks counter / kitchen) with an icon. If the volunteer has already used this device recently, the txosna and mode are pre-selected — just confirm the PIN.

---

## 12. Cross-cutting Concerns

### Loading states

- Skeleton screens (not spinners) for initial data load — the layout appears immediately, content fades in
- Optimistic updates for status changes — the UI updates instantly, rolls back if the server rejects
- SSE reconnection shows a subtle connectivity banner at the top: "Reconnecting..." that disappears when reconnected

### Error states

- Network errors: inline message with retry button — no full-page error screens for transient failures
- Sold out conflict: specific message explaining what happened and what to do
- Session expired: redirect to login with a "Your session expired, please log in again" message

### Empty states

- Empty order queues: simple message — "No orders yet" — with the txosna status badge
- Empty menu: admin prompt to add products (links to menu management)

### Notifications

- Push notifications use the browser's native notification UI — no custom design needed
- In-app notifications (when push is not available) appear as a banner at the top of the customer screen

### Responsiveness breakpoints

- `< 640px` (phone): single column layouts; bottom sheets for secondary content
- `640px–1024px` (tablet): two-column layouts; side panels instead of bottom sheets
- `> 1024px` (desktop/large screen): full multi-column layouts; order board optimised for TV display

---

## 13. Accessibility Checklist

- All interactive elements have visible focus indicators
- Colour is never the sole means of conveying information (always paired with text or icon)
- All images have alt text; product images have descriptive alt text
- All form fields have visible labels (not just placeholders)
- Touch targets minimum 48×48px; 56×56px on operational screens
- Sufficient colour contrast: WCAG AA everywhere; AAA on pickup proof and order board
- Screen reader tested on the customer ordering flow and pickup proof
- Language attribute set correctly on all pages (`lang="eu"`, `lang="es"`, etc.)
- No time-limited interactions except the pending payment timeout (which has a clear countdown)

---

## 14. Open Questions

1. Should the order board support a dark theme option for venues with dim lighting?
2. Should product images be mandatory or optional? Mandatory images improve the customer experience significantly but add admin burden.
3. Should the counter volunteer screen support a split view showing both pending phone orders and the new order form simultaneously, or always switch between the two?
4. What should the txosna branding look like — just a name, or can associations upload a logo?
5. Should the drinks counter support a "favourite products" shortcut, configured per txosna, rather than always showing the full product grid?

---

_Last updated: session 18_
