import { Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import type { E2eWorld } from '../step-definitions/e2e/world';

// Browser navigation is slow — give each step 30s
setDefaultTimeout(30_000);

Before({ tags: '@e2e' }, async function (this: E2eWorld) {
  await this.openBrowser();
  this.trackConsoleErrors();
});

After({ tags: '@e2e' }, async function (this: E2eWorld) {
  await this.closeBrowser();
});
