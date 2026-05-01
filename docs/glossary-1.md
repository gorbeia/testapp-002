# Txosna App — Glossary

_Session 17 — April 2026_

---

## Core Concepts

| Term                   | English              | Definition                                                                                      |
| ---------------------- | -------------------- | ----------------------------------------------------------------------------------------------- |
| Txosna                 | Food & drink stall   | A temporary stand at a local festival selling food and drinks, run by volunteers to raise funds |
| Txosnak                | Stalls               | Plural of txosna                                                                                |
| Elkartea / Association | Association / tenant | The nonprofit organization running txosnak; the top-level entity in the system                  |
| Boluntarioa            | Volunteer            | A person who works at the txosna without pay                                                    |
| Jaialdia               | Festival / event     | A local community event where one or more txosnak operate                                       |
| Tenant                 | Tenant               | One association using the shared application with its own isolated data                         |
| Multitenancy           | Multitenancy         | A single application serving multiple associations, each seeing only their own data             |

---

## Access & Accounts

| Term              | English           | Definition                                                                                                                     |
| ----------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Association admin | Association admin | A volunteer with full access to configuration and management; can also perform all operational tasks                           |
| Volunteer         | Volunteer         | A person with an account; access to all txosnak and operational screens                                                        |
| Role              | Role              | Level of access: Admin or Volunteer                                                                                            |
| Device login      | Device login      | Step 1 — authenticates with personal email and password                                                                        |
| Session PIN       | Session PIN       | Step 2 — selects food counter, drinks counter, kitchen (with optional post selection), or kitchen manager mode for the session |
| Self-registration | Self-registration | Association signs up and creates first admin account without assistance                                                        |
| Volunteer account | Volunteer account | Personal account created by admin with own email and password                                                                  |
| Password reset    | Password reset    | Email-based flow allowing a volunteer to set a new password via a short-lived link                                             |
| Onboarding guide  | Onboarding guide  | Checklist-style setup walkthrough shown to new admins after registration; skippable and resumable                              |

---

## Ordering

| Term                    | English                 | Definition                                                                          |
| ----------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| Eskaera egin            | Place an order          | The act of a customer requesting food or drinks                                     |
| Eskaera                 | Order                   | A request containing one or more items across one or more counters                  |
| Eskaera-lerroa          | Order line / line item  | A single configured product including variants, modifiers, and quantity             |
| Order ticket            | Order ticket            | A grouping of order lines for a specific counter; has its own independent lifecycle |
| Bezeroa                 | Customer / patron       | The person placing an order — no account required                                   |
| Produktua               | Product / menu item     | A food or drink item in the master menu                                             |
| Ordering channel        | Ordering channel        | How an order is placed; configurable per txosna                                     |
| Counter order           | Counter order           | Order placed in person by a volunteer on behalf of a customer                       |
| Phone-to-counter order  | Phone-to-counter order  | Order placed on phone; paid cash at the counter                                     |
| Self-service order      | Self-service order      | Order placed and paid entirely on phone (future)                                    |
| Order edit              | Order edit              | Correction to products, variants, modifiers, or quantities                          |
| Order notes             | Order notes             | Free text instructions from the customer                                            |
| Pending payment timeout | Pending payment timeout | Time limit before unclaimed phone orders are auto-cancelled                         |
| Order recovery          | Order recovery          | Browser retrieves active order after page refresh using local storage               |

---

## Menu

| Term                       | English                    | Definition                                                                                     |
| -------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------- |
| Master menu                | Master menu                | Full product list at association level with prices, variants, modifiers, images, instructions  |
| Default price              | Default price              | Base price before variant deltas and modifier prices                                           |
| Price override             | Price override             | Custom base price for a product at a specific txosna                                           |
| Display order              | Display order              | Manually configured order of categories and products on all screens                            |
| Category                   | Category                   | Product grouping with a type (FOOD or DRINKS) and display order                                |
| Category type              | Category type              | FOOD or DRINKS — determines which counter handles its products                                 |
| TxosnaProduct              | Txosna product             | Per-txosna configuration: availability, sold out, price override, instructions override        |
| Txosna menu copy           | Txosna menu copy           | Creating TxosnaProduct entries by copying overrides from a previous or demo txosna             |
| Product disabled           | Product disabled           | Admin-set — product not offered at this txosna                                                 |
| Sold out                   | Sold out                   | Counter or kitchen staff set — stock has run out; reactivatable                                |
| Variant group              | Variant group              | Required choice when ordering a product (e.g. Side: Chips or Salad)                            |
| Variant option             | Variant option             | A choice within a variant group; may carry price delta and allergens                           |
| Price delta                | Price delta                | Amount added to base price when a variant option is selected; zero or positive                 |
| Modifier                   | Modifier                   | Optional addition or removal; may have a price and allergens                                   |
| Effective order line price | Effective order line price | Base price + variant deltas + modifier prices                                                  |
| Customer-facing image      | Customer-facing image      | Photo of the finished product shown to customers                                               |
| Splittable item            | Splittable item            | Food product eligible for splitting across multiple units                                      |
| Requires preparation       | Requires preparation       | Drink product needing active preparation (e.g. mojito); drives full lifecycle on drinks ticket |
| Age-restricted             | Age-restricted             | Drink product requiring ID verification before serving                                         |
| Ingredients list           | Ingredients list           | Simple text reference for volunteers; not used for inventory                                   |

---

## Preparation Instructions

| Term                        | English                     | Definition                                                                            |
| --------------------------- | --------------------------- | ------------------------------------------------------------------------------------- |
| Preparation instructions    | Preparation instructions    | Step-by-step guidance in Markdown with images; shown on counter/KDS screens on demand |
| Product-level instructions  | Product-level instructions  | General method in master menu; applies to all txosnak unless overridden               |
| Txosna-level instructions   | Txosna-level instructions   | Event-specific override: which fridge, which machine, where items are stored          |
| Preparation reference image | Preparation reference image | Photo embedded in instructions; distinct from the customer-facing image               |

---

## Counters

| Term                        | English                     | Definition                                                                                                                                                                      |
| --------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Counter type                | Counter type                | FOOD or DRINKS — the type of serving point                                                                                                                                      |
| Food counter                | Food counter                | Serving point for all food items; always uses full preparation lifecycle                                                                                                        |
| Drinks counter              | Drinks counter              | Serving point for all drink items; full lifecycle if any item requires preparation                                                                                              |
| Separate counters           | Separate counters           | Food and drinks at independent serving points; customers pick up separately                                                                                                     |
| Single counter              | Single counter              | Food and drinks at the same serving point                                                                                                                                       |
| Counter mode                | Counter mode                | Default view after PIN entry — a view filter, not an access restriction                                                                                                         |
| Cross-counter access        | Cross-counter access        | Ability to view and act on the other counter's tickets; always available but not prominent                                                                                      |
| Kitchen post                | Kitchen post                | A named preparation workstation within the food kitchen (e.g. griddle, fryer); optional per txosna; assignable on products, variant options, and modifiers                      |
| Kitchen Manager mode        | Kitchen Manager mode        | Session PIN mode giving a coordinator view across all kitchen posts; selectable by any volunteer                                                                                |
| Kitchen routing preview     | Kitchen routing preview     | Live card in the product editor showing which posts are triggered per variant combination; computed from kitchen_post fields on the product, its variant options, and modifiers |
| Pipeline progress indicator | Pipeline progress indicator | Visual bar on each kitchen manager order card showing how many posts have reached READY; completes when all posts are done                                                      |

---

## Txosna Setup

| Term               | English            | Definition                                                                         |
| ------------------ | ------------------ | ---------------------------------------------------------------------------------- |
| Public URL         | Public URL         | Unique URL per txosna for the order board and customer ordering; no login required |
| Slug               | Slug               | URL-safe identifier for the txosna used to construct its public URL                |
| Demo txosna        | Demo txosna        | A sandbox txosna for testing setup before a real event; never visible to customers |
| Demo mode          | Demo mode          | Flag marking a txosna as a sandbox; public URL not active; orders are test-only    |
| Configuration copy | Configuration copy | Transferring a txosna's settings and TxosnaProduct entries to another txosna       |
| Txosna reopening   | Txosna reopening   | Admin restores a CLOSED txosna to OPEN status; cancelled orders are not restored   |

---

## Age Verification

| Term                   | English                | Definition                                                                               |
| ---------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| Age-restricted product | Age-restricted product | A drink flagged as requiring ID verification before it can be served                     |
| ID verification prompt | ID verification prompt | Alert shown to the counter volunteer when an order contains an age-restricted product    |
| Age declaration        | Age declaration        | Checkbox the customer confirms when placing a phone order with an age-restricted product |

---

## Allergens & Dietary Information

| Term                | English             | Definition                                                                            |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------- |
| Allergens           | Allergens           | 14 standard EU allergens; specified on products, variant options, and modifiers       |
| Dietary flags       | Dietary flags       | Vegetarian, vegan, gluten-free — set at product level                                 |
| Effective allergens | Effective allergens | Union of product + selected variant + selected modifier allergens; shown in real time |

---

## Payment

| Term                    | English                 | Definition                                                                                                                                                                                                        |
| ----------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cash payment            | Cash payment            | Payment made in person at the counter                                                                                                                                                                             |
| Online payment          | Online payment          | Digital payment by customer on phone (future)                                                                                                                                                                     |
| Payment method          | Payment method          | How the order was paid: cash or online; configurable per txosna                                                                                                                                                   |
| Enabled payment methods | Enabled payment methods | Payment methods accepted by a txosna; set by admin                                                                                                                                                                |
| Pending payment         | Pending payment         | Phone order not yet confirmed by cash payment at counter                                                                                                                                                          |
| Change                  | Change / change due     | Cash to return; calculated optionally when volunteer enters amount given                                                                                                                                          |
| Receipt                 | Receipt                 | Downloadable PDF of completed order on customer's phone                                                                                                                                                           |
| Fiscal receipt          | Fiscal receipt          | Official proof of purchase required by TicketBAI regulation; shown on customer order screens and printable receipts when TicketBAI is enabled for the association                                                 |
| TicketBAI               | TicketBAI               | Basque Country fiscal regulation requiring every sale to generate a digitally signed, chained invoice submitted to Hacienda Vasca; implemented via `ITicketBaiProvider` with `MockTicketBaiProvider` for dev/test |
| Txartel argia           | Fiscal receipt card     | The "Txartel argia / Faktura" UI section shown on customer order and tracking screens when a TicketBAI invoice has been issued; displays series/number, issue date, and QR link                                   |
| Faktura liburua         | Invoice ledger          | Admin screen listing all issued TicketBAI invoices; provider-independent record preserved in the app's own store even if the provider changes                                                                     |
| Invoice chain           | Invoice chain           | SHA-256 hash chain linking consecutive TicketBAI invoices; makes it impossible to delete or reorder invoices without detection                                                                                    |
| Handoff card            | Handoff card            | Full-screen overlay shown to the counter volunteer after a counter order is confirmed when `mobileTrackingEnabled`; displays verification code, QR code, and tracking URL for the customer                        |

---

## QR Codes

| Term            | English         | Definition                                                           |
| --------------- | --------------- | -------------------------------------------------------------------- |
| QR code         | QR code         | Machine-readable code encoding order information for fast validation |
| QR validation   | QR validation   | Scanning customer QR to instantly verify and retrieve their ticket   |
| QR pickup proof | QR pickup proof | Pickup proof screen displaying QR code alongside verification code   |

---

## Kitchen & Fulfillment

| Term                         | English                      | Definition                                                                                                          |
| ---------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Sukaldea                     | Kitchen                      | The area where food is prepared                                                                                     |
| Kitchen Display System (KDS) | Kitchen Display System (KDS) | Browser-based screen showing order tickets; runs on any device; filtered to a single post when posts are configured |
| Kitchen ticket               | Kitchen ticket               | Optional printed slip per ticket for associations with a printer                                                    |
| Coordinator view             | Coordinator view             | The Kitchen Manager screen layout: one card per order, showing status of each post-ticket side by side              |
| Prestatu                     | Prepare / fulfill            | The act of making the food or drink ready                                                                           |
| Jasotzen                     | Pick up                      | When the customer collects their ready ticket                                                                       |
| Flagged order                | Flagged order                | Paid order with a sold out product; requires manual resolution                                                      |
| Kitchen pause                | Kitchen pause                | Temporarily stops accepting new orders                                                                              |
| Counter pause                | Counter pause                | Temporarily stops accepting new orders                                                                              |
| Slow order                   | Slow order                   | Ticket in preparation significantly longer than the session average                                                 |
| Average preparation time     | Average preparation time     | Rolling average IN_PREPARATION time from completed tickets in the current session                                   |
| Order changed alert          | Order changed alert          | Visual alert when a volunteer edits an IN_PREPARATION ticket                                                        |
| End of service               | End of service               | Txosna closes; all open orders and tickets cancelled                                                                |
| Connectivity indicator       | Connectivity indicator       | Visible signal showing device connection status                                                                     |

---

## Customer Notifications & Pickup

| Term                      | English                   | Definition                                                                               |
| ------------------------- | ------------------------- | ---------------------------------------------------------------------------------------- |
| Order board               | Order board               | Screen showing live status of all active order tickets; accessible via public txosna URL |
| Manual callout            | Manual callout            | Volunteer calls out customer name or order number aloud                                  |
| Push notification         | Push notification         | Browser message to customer's phone; no account needed                                   |
| Notification token        | Notification token        | Temporary device identifier for push notifications                                       |
| Cancellation notification | Cancellation notification | Notification when phone order is cancelled, with reason                                  |
| Pickup proof              | Pickup proof              | Screen on customer's phone shown to volunteer at collection; includes QR if enabled      |
| Verification code         | Verification code         | Short alphanumeric code for quick visual verification                                    |
| Wait time estimate        | Wait time estimate        | Current average preparation time shown to customers                                      |
| Partial pickup            | Partial pickup            | Collecting one ticket before the other is ready; in separate counter setup               |

---

## Reporting

| Term         | English      | Definition                                                                                                                               |
| ------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Event report | Event report | Post-event summary available to the admin after txosna closure: total orders, revenue, product breakdown, cancellations, busiest periods |

---

## Localisation & Accessibility

| Term                | English             | Definition                                                              |
| ------------------- | ------------------- | ----------------------------------------------------------------------- |
| Localisation        | Localisation        | Adapting the app to different languages and regional conventions        |
| Supported languages | Supported languages | Basque, Spanish, French, English — user-selectable                      |
| Accessibility       | Accessibility       | Design practices ensuring the app is usable by people with disabilities |

---

## UI & Design

| Term                   | English                | Definition                                                     |
| ---------------------- | ---------------------- | -------------------------------------------------------------- |
| Responsive design      | Responsive design      | Layout adapts automatically to screen size                     |
| Mobile-first           | Mobile-first           | Designing for small phones as baseline, scaling up             |
| Glanceable             | Glanceable             | Can be understood in seconds with minimal reading              |
| Status overview screen | Status overview screen | Live snapshot of txosna state — useful for handovers           |
| Local storage          | Local storage          | Browser storage linking customer device to their active orders |

---

## Order Lifecycle

| Status            | English         | Meaning                                         |
| ----------------- | --------------- | ----------------------------------------------- |
| Ordaintzeko zain  | Pending payment | Phone order waiting for cash payment at counter |
| Jasota            | Received        | Confirmed and sent to counter(s)                |
| Prestatzen        | In preparation  | Counter is working on this ticket               |
| Prest             | Ready           | Ticket ready for pickup                         |
| Jasota (amaituta) | Completed       | Customer has collected this ticket              |
| Ezeztatuta        | Cancelled       | Order or ticket cancelled before completion     |

---

_Last updated: session 20_
