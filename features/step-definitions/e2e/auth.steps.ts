import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { BASE_URL } from './world';
import type { E2eWorld } from './world';

/**
 * Two-step login flow: association name → credentials.
 * Uses pressSequentially so React's onChange fires on each keystroke.
 */
async function loginAsAdmin(world: E2eWorld, association: string, email: string, password: string) {
  await world.goto('/login');

  const assocInput = world.page.getByPlaceholder('Adib.: Bilbao Zaharra');
  await assocInput.click();
  await assocInput.pressSequentially(association, { delay: 30 });
  await world.page.getByRole('button', { name: /Jarraitu/ }).click();

  await world.page.waitForSelector('input[type="email"]', { timeout: 10_000 });
  await world.page.fill('input[type="email"]', email);
  await world.page.fill('input[type="password"]', password);
  await world.page.getByRole('button', { name: 'Saioa hasi →' }).click();

  await world.page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
}

// ── Given ─────────────────────────────────────────────────────────────────────

Given('I navigate to {string}', async function (this: E2eWorld, path: string) {
  await this.goto(path);
});

/**
 * Log in as the Erreka Gaztedi admin and navigate directly to txosna-1.
 * The txosnaSlug argument is kept for readability in the feature file but
 * the step always uses the seeded txosna-1 (Aste Nagusia 2026).
 */
Given('I am logged in as admin for {string}', async function (this: E2eWorld, _txosnaSlug: string) {
  await loginAsAdmin(this, 'Erreka Gaztedi', 'amaia@elkartea.eus', 'test1234');
  await this.page.goto(`${BASE_URL}/eu/txosnak/txosna-1`, { waitUntil: 'domcontentloaded' });
  this.txosnaBaseUrl = '/eu/txosnak/txosna-1';
});

// ── When ──────────────────────────────────────────────────────────────────────

When(
  'I log in as admin with email {string} and password {string}',
  async function (this: E2eWorld, email: string, password: string) {
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.getByRole('button', { name: 'Saioa hasi →' }).click();
    await this.page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
  }
);

When('I select association {string}', async function (this: E2eWorld, name: string) {
  const assocInput = this.page.getByPlaceholder('Adib.: Bilbao Zaharra');
  await assocInput.click();
  await assocInput.pressSequentially(name, { delay: 30 });
  await this.page.getByRole('button', { name: /Jarraitu/ }).click();
  await this.page.waitForSelector('input[type="email"]', { timeout: 10_000 });
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('I am redirected to the txosna dashboard', async function (this: E2eWorld) {
  const url = this.page.url();
  assert.ok(
    url.includes('/txosnak') || url.includes('/dashboard'),
    `Expected txosna dashboard URL, got: ${url}`
  );
});

Then('the txosna list shows at least one txosna', async function (this: E2eWorld) {
  // The txosna list is client-rendered — wait for a known txosna name to appear
  await this.page.waitForSelector('text=Aste Nagusia', { timeout: 15_000 });
  const body = await this.page.evaluate(() => document.body.innerText);
  assert.ok(
    body.includes('Irekita') || body.includes('Geldituta') || body.includes('Itxita'),
    'Expected at least one txosna with a status label'
  );
});

Then('there are no JavaScript errors in the console', async function (this: E2eWorld) {
  const errors = this.consoleErrors.filter(
    (e) =>
      // Next.js dev-mode hydration noise
      !e.includes('Hydration') &&
      !e.includes('hydration') &&
      // Network-level resource failures are not JS exceptions — they surface
      // separately via page assertions and the integration test suite
      !e.includes('Failed to load resource')
  );
  assert.deepStrictEqual(errors, [], `Unexpected JS errors:\n${errors.join('\n')}`);
});
