---
description: Create a new screen following the three-register design system
---

1. Determine which **design register** the screen belongs to:
   - **Operational** (counter, kitchen, drinks bar) → dark theme, high contrast, 56px touch targets, speed-optimised, no decorative elements
   - **Customer** (ordering, pickup proof, order board) → light warm theme, accessible, images welcome, trust and clarity
   - **Admin** (configuration, menu, reports) → standard web app patterns, more complexity acceptable

2. Determine the **route group**:
   - Public (no auth): `src/app/(public)/`
   - Customer: `src/app/(customer)/`
   - Volunteer: `src/app/(volunteer)/`
   - Admin: `src/app/(admin)/`

3. Create the page file inside the route group, nested under `[locale]/` for i18n support:

   ```
   src/app/(route-group)/[locale]/screen-name/page.tsx
   ```

4. Apply the correct **colour palette**:
   - Operational: dark backgrounds (`#0f1117`, `#1a1d27`), primary action `#e85d2f`, text `#f8f9fa`
   - Customer: warm light backgrounds (`#faf8f5`, `#ffffff`), primary action `#e85d2f`, accent `#2d5a3d`
   - Admin: standard light theme, Shadcn/ui components as-is

5. Apply **typography**:
   - Headings: DM Sans or Nunito (humanist, warm)
   - Order numbers/codes: JetBrains Mono (monospace)
   - Body: system font stack

6. Ensure **mobile-first** responsive design:
   - `< 640px`: single column, bottom sheets for secondary content
   - `640px–1024px`: two-column, side panels
   - `> 1024px`: full multi-column layouts

7. Use **Shadcn/ui** components from `src/components/ui/` as building blocks.

8. If the screen needs screen-specific components, create them under `src/components/screens/screen-name/`.

9. Add i18n keys to all four locale files in `messages/` (eu.json, es.json, fr.json, en.json).

10. If the screen requires real-time updates, use the SSE client from `src/lib/sse.ts`.

11. If the screen is protected, ensure the middleware in `src/middleware.ts` covers the new route.
