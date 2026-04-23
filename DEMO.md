# Txosnabai — Demo & Testing Guide

All data is seeded in-memory on server start and resets on restart. Use the prototype navigator at `/prototype` to jump between screens directly.

---

## Associations

Two associations are pre-loaded. Use their name in the login **step 1** field.

| Association        | Purpose                                                    |
| ------------------ | ---------------------------------------------------------- |
| **Demo Elkartea**  | Interactive demos — recommended for manual testing         |
| **Erreka Gaztedi** | Test suite fixture — avoid modifying during manual testing |

---

## Demo Elkartea

### Login credentials

| Name        | Email             | Password   | Role                 |
| ----------- | ----------------- | ---------- | -------------------- |
| Amaia Demo  | `amaia@demo.eus`  | `demo0000` | Admin                |
| Gorka Demo  | `gorka@demo.eus`  | `demo0000` | Volunteer            |
| Itziar Demo | `itziar@demo.eus` | `demo0000` | Volunteer (inactive) |

### Txosnak

| Slug           | Name         | Status     | Counter setup            | Wait   | PIN    |
| -------------- | ------------ | ---------- | ------------------------ | ------ | ------ |
| `demo-janaria` | Demo Janaria | **OPEN**   | Separate (food + drinks) | 12 min | `0000` |
| `demo-edariak` | Demo Edariak | **PAUSED** | Single                   | —      | `0000` |

Event: **Demo Gertaera**

### Menu — Demo Janaria

**Janaria (Food)**

| Product        | Price | Notes                                                                                                                     |
| -------------- | ----- | ------------------------------------------------------------------------------------------------------------------------- |
| Burgerra       | €8.50 | Variant: Patata frijituak / Entsalada. Modifiers: Gazta +€1.00, Bacon +€1.50. Removable: Letxuga, Tomatea, Tipula, Saltsa |
| Txorizoa ogian | €4.00 |                                                                                                                           |
| Tortilla       | €3.50 | V (vegetarian)                                                                                                            |
| Pintxo nahasia | €6.00 | ⚠ **SOLD OUT** in demo-janaria                                                                                            |

**Edariak (Drinks)**

| Product      | Price | Notes                    |
| ------------ | ----- | ------------------------ |
| Garagardoa   | €2.50 | 🔞 Age-restricted        |
| Ardoa        | €3.00 | 🔞 Age-restricted        |
| Ura          | €1.00 | VG · GF                  |
| Freskagarria | €1.50 | Koka-Kola, Fanta, Sprite |

### Pre-loaded orders (Demo Janaria)

All orders are scoped to `demo-janaria`.

| #   | Customer | Status          | Total  | Code      | Channel         | Contents                                                         |
| --- | -------- | --------------- | ------ | --------- | --------------- | ---------------------------------------------------------------- |
| 1   | Miren    | PENDING_PAYMENT | €17.00 | `AB-0001` | Phone → Counter | 2× Burgerra (Patata frijituak)                                   |
| 2   | Josu     | PENDING_PAYMENT | €7.50  | `CD-0002` | Phone → Counter | Tortilla + Txorizoa ogian                                        |
| 3   | Ander    | CONFIRMED       | €8.50  | `EF-0003` | Counter         | Burgerra (Entsalada) — note: "Burgerra ondo eginda mesedez"      |
| 4   | Leire    | CONFIRMED       | €13.00 | `GH-0004` | Counter         | Food: 2× Txorizoa ogian (⚠ slow, 13 min) · Drinks: 2× Garagardoa |
| 5   | Txomin   | CONFIRMED       | €12.50 | `JK-0005` | Self-service    | Food: Burgerra + Gazta (READY) · Drinks: 3× Ura (READY)          |
| 6   | Beñat    | CANCELLED       | €12.00 | `LM-0006` | Counter         | 2× Pintxo nahasia (sold-out cancellation)                        |

### KDS ticket states at startup

| Ticket        | Order     | Counter | Status         | Notes                          |
| ------------- | --------- | ------- | -------------- | ------------------------------ |
| demo-ticket-1 | #1 Miren  | FOOD    | RECEIVED       |                                |
| demo-ticket-2 | #2 Josu   | FOOD    | RECEIVED       |                                |
| demo-ticket-3 | #3 Ander  | FOOD    | IN_PREPARATION | "Burgerra ondo eginda mesedez" |
| demo-ticket-4 | #4 Leire  | FOOD    | IN_PREPARATION | ⚠ Slow order (13 min)          |
| demo-ticket-5 | #4 Leire  | DRINKS  | RECEIVED       |                                |
| demo-ticket-6 | #5 Txomin | FOOD    | READY          |                                |
| demo-ticket-7 | #5 Txomin | DRINKS  | READY          |                                |
| demo-ticket-8 | #6 Beñat  | FOOD    | CANCELLED      |                                |

---

## Erreka Gaztedi

Used by the automated test suite. Avoid making changes during manual testing as it may cause test failures.

### Login credentials

| Name             | Email                 | Password   | Role                 |
| ---------------- | --------------------- | ---------- | -------------------- |
| Amaia Etxeberria | `amaia@elkartea.eus`  | `test1234` | Admin                |
| Gorka Zubia      | `gorka@elkartea.eus`  | `test1234` | Volunteer            |
| Itziar Larrea    | `itziar@elkartea.eus` | `test1234` | Volunteer            |
| Beñat Aranburu   | `benat@elkartea.eus`  | `test1234` | Volunteer (inactive) |

### Txosnak

| Slug                | Name              | Status     | Counter setup | Wait  | PIN    |
| ------------------- | ----------------- | ---------- | ------------- | ----- | ------ |
| `aste-nagusia-2026` | Aste Nagusia 2026 | **OPEN**   | Separate      | 8 min | `1234` |
| `pintxo-txokoa`     | Pintxo Txokoa     | **OPEN**   | Single        | 5 min | `5678` |
| `garagardo-barra`   | Garagardo Barra   | **PAUSED** | Single        | —     | `9012` |

---

## URLs

| Screen               | URL                                            |
| -------------------- | ---------------------------------------------- |
| Landing page         | `http://localhost:3000/`                       |
| Login                | `http://localhost:3000/login`                  |
| Register             | `http://localhost:3000/register`               |
| Prototype navigator  | `http://localhost:3000/prototype`              |
| PIN entry            | `http://localhost:3000/eu/pin`                 |
| Admin dashboard      | `http://localhost:3000/eu/dashboard`           |
| Txosnak list (admin) | `http://localhost:3000/eu/txosna`              |
| Volunteers (admin)   | `http://localhost:3000/eu/volunteers`          |
| Reports (admin)      | `http://localhost:3000/eu/reports`             |
| Onboarding           | `http://localhost:3000/eu/onboarding`          |
| Kitchen (KDS)        | `http://localhost:3000/eu/kitchen`             |
| Counter              | `http://localhost:3000/eu/counter`             |
| Drinks counter       | `http://localhost:3000/eu/drinks`              |
| Overview             | `http://localhost:3000/eu/overview`            |
| Public menu (demo)   | `http://localhost:3000/eu/t/demo-janaria`      |
| Public menu (mock)   | `http://localhost:3000/eu/t/aste-nagusia-2026` |

---

## Quick-start (Demo Elkartea)

1. Go to `http://localhost:3000/login`
2. Association: **Demo Elkartea**
3. Email: `amaia@demo.eus` · Password: `demo0000`
4. PIN screen: **`0000`**

## Notes

- Data resets on server restart — there is no persistence between sessions
