---
description: Add i18n translation keys for a new feature or screen
---

1. Identify the translation files in `messages/`:
   - `eu.json` — Basque (default locale)
   - `es.json` — Spanish
   - `fr.json` — French
   - `en.json` — English

2. Add keys under a namespace matching the feature/screen name. Use nested objects for organization:

   ```json
   {
     "screenName": {
       "title": "Screen Title",
       "description": "Screen description",
       "action": "Action button text"
     }
   }
   ```

3. **Always add keys to all four locale files** — never leave a locale missing a key.

4. For Basque translations, use proper Euskara (Batua standard). If unsure about a translation, mark it with a TODO comment and use the Spanish or English translation as a placeholder.

5. Use the translations in components with `next-intl`:

   ```typescript
   import { useTranslations } from "next-intl";

   export default function Screen() {
     const t = useTranslations("screenName");
     return <h1>{t("title")}</h1>;
   }
   ```

6. For server components, use `getTranslations`:

   ```typescript
   import { getTranslations } from "next-intl/server";

   export default async function Screen() {
     const t = await getTranslations("screenName");
     return <h1>{t("title")}</h1>;
   }
   ```
