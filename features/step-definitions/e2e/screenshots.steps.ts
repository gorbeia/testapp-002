import { When } from '@cucumber/cucumber';
import type { E2eWorld } from './world';

When('I take a screenshot {string}', async function (this: E2eWorld, name: string) {
  await this.screenshot(name);
});
