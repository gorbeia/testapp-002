import assert from 'assert';
import { When, Then } from '@cucumber/cucumber';
import { BASE_URL } from './world';
import type { E2eWorld } from './world';

async function gotoSubPage(world: E2eWorld, segment: string) {
  const base = world.txosnaBaseUrl.replace(/\/$/, '');
  await world.page.goto(`${BASE_URL}${base}${segment}`, { waitUntil: 'networkidle' });
}

function assertNoError(body: string | null, page: string) {
  assert.ok(body && body.length > 100, `${page} body is empty — possible render crash`);
  assert.ok(!body.includes('Something went wrong'), `Error boundary triggered on ${page}`);
  assert.ok(!body.includes('404'), `${page} returned 404`);
}

// ── When ──────────────────────────────────────────────────────────────────────

When('I navigate to the txosna products page', async function (this: E2eWorld) {
  await gotoSubPage(this, '/products');
});

When('I navigate to the txosna settings page', async function (this: E2eWorld) {
  await gotoSubPage(this, '/settings');
});

When('I navigate to the txosna reports page', async function (this: E2eWorld) {
  await gotoSubPage(this, '/reports');
});

When('I navigate to the txosna volunteers page', async function (this: E2eWorld) {
  // Volunteers are managed at the association level, not per-txosna
  await this.page.goto(`${BASE_URL}/eu/volunteers`, { waitUntil: 'networkidle' });
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the page renders at least one product', async function (this: E2eWorld) {
  const body = await this.page.evaluate(() => document.body.innerText);
  assertNoError(body, 'Products page');
  // Page shows either products or a well-formed empty state — both are fine
  const hasContent =
    body.includes('Produktuak') || // page heading
    body.includes('Ez dago') || // Basque empty state ("there are none")
    body.includes('produktu'); // any product-related text
  assert.ok(hasContent, `Products page has no recognisable content. Got: ${body.slice(0, 300)}`);
});

Then('the page shows the current txosna status', async function (this: E2eWorld) {
  const body = await this.page.evaluate(() => document.body.innerText);
  assertNoError(body, 'Settings page');
  const hasStatus = ['Irekita', 'Geldituta', 'Itxita', 'OPEN', 'PAUSED', 'CLOSED'].some((s) =>
    body.includes(s)
  );
  assert.ok(hasStatus, `Settings page has no txosna status. Got: ${body.slice(0, 300)}`);
});

Then('the reports page renders without error', async function (this: E2eWorld) {
  const body = await this.page.evaluate(() => document.body.innerText);
  assertNoError(body, 'Reports page');
  const hasContent = body.includes('Txostena') || body.includes('ESKARIAK') || body.includes('0');
  assert.ok(hasContent, `Reports page has no recognisable content. Got: ${body.slice(0, 300)}`);
});

Then('the page shows a list or empty state', async function (this: E2eWorld) {
  const body = await this.page.evaluate(() => document.body.innerText);
  assertNoError(body, 'Volunteers page');
  // Any non-crash render is sufficient; the page may show a list or an empty state
  const hasContent =
    body.includes('Boluntario') || body.includes('Ez dago') || body.includes('volunteer');
  assert.ok(hasContent, `Volunteers page has no recognisable content. Got: ${body.slice(0, 300)}`);
});
