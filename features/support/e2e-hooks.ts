import { Before, After, setDefaultTimeout, ITestCaseHookParameter } from '@cucumber/cucumber';
import fs from 'fs';
import path from 'path';
import type { E2eWorld } from '../step-definitions/e2e/world';

// Memory database is fast — 5s is plenty
setDefaultTimeout(5_000);

Before({ tags: '@e2e' }, async function (this: E2eWorld) {
  await this.openBrowser();
  this.trackConsoleErrors();
});

After({ tags: '@e2e' }, async function (this: E2eWorld, { result }: ITestCaseHookParameter) {
  if (result?.status === 'FAILED') {
    try {
      const dir = path.resolve('docs/screenshots/failures');
      fs.mkdirSync(dir, { recursive: true });
      await this.page?.screenshot({
        path: path.join(dir, `failure-${Date.now()}.png`),
        fullPage: true,
      });
    } catch {
      // Screenshot capture on failure is best-effort
    }
  }
  await this.closeBrowser();
});
