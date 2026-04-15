import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['eu', 'es', 'fr', 'en'],
  defaultLocale: 'eu',
});
