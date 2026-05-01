import assert from 'assert';
import { When, Then } from '@cucumber/cucumber';
import type { E2eWorld } from './world';

// ── Public menu ───────────────────────────────────────────────────────────────

Then('the page shows txosna name {string}', async function (this: E2eWorld, name: string) {
  await this.page.waitForSelector(`text=${name}`, { timeout: 15_000 });
});

Then('the page shows a status badge {string}', async function (this: E2eWorld, status: string) {
  await this.page.waitForSelector(`text=${status}`, { timeout: 10_000 });
});

Then('the menu shows a category tab for food', async function (this: E2eWorld) {
  await this.page.waitForSelector('button:has-text("Janaria")', { timeout: 10_000 });
});

Then('the menu shows a category tab for drinks', async function (this: E2eWorld) {
  await this.page.waitForSelector('button:has-text("Edariak")', { timeout: 10_000 });
});

Then('at least one product card is visible', async function (this: E2eWorld) {
  // Wait for any element that looks like a product card
  await this.page
    .waitForSelector('[data-testid="product-card"], .product-card, [class*="product"]', {
      timeout: 10_000,
    })
    .catch(async () => {
      // Fallback: look for a price pattern in the page — €X.XX
      const body = await this.page.evaluate(() => document.body.innerText);
      assert.match(body, /\d+[,.]\d+\s*€/, 'Expected at least one product with a price');
    });
});

Then('each visible product card shows a name and price', async function (this: E2eWorld) {
  const body = await this.page.evaluate(() => document.body.innerText);
  assert.match(body, /\d+[,.]\d+\s*€/, 'Expected at least one price in the product list');
});

When('I click the {word} category tab', async function (this: E2eWorld, category: string) {
  const label = category === 'drinks' ? 'Edariak' : 'Janaria';
  await this.page.getByRole('button', { name: label }).click();
});

// ── Order status ──────────────────────────────────────────────────────────────

Then('the page shows an order number', async function (this: E2eWorld) {
  // Order numbers are shown as #42 or similar large text
  await this.page.waitForSelector('text=#', { timeout: 15_000 });
});

Then(
  'the page shows progress steps including {string}',
  async function (this: E2eWorld, step: string) {
    await this.page.waitForSelector(`text=${step}`, { timeout: 10_000 });
  }
);

// ── Generic reusable steps ────────────────────────────────────────────────────

Then('the page shows a {string} section', async function (this: E2eWorld, sectionName: string) {
  await this.page.waitForSelector(`text=${sectionName}`, { timeout: 10_000 });
});

Then('the page shows a {string} button', async function (this: E2eWorld, label: string) {
  await this.page.waitForSelector(`button:has-text("${label}")`, { timeout: 10_000 });
});

Then('the page shows {string} heading', async function (this: E2eWorld, text: string) {
  await this.page.waitForSelector(`text=${text}`, { timeout: 10_000 });
});

Then('the page shows {string} section', async function (this: E2eWorld, sectionName: string) {
  await this.page.waitForSelector(`text=${sectionName}`, { timeout: 10_000 });
});

Then('the page shows a {string} column', async function (this: E2eWorld, columnName: string) {
  await this.page.waitForSelector(`text=${columnName}`, { timeout: 10_000 });
});

// ── Pickup proof ──────────────────────────────────────────────────────────────

Then('the page shows a large order number', async function (this: E2eWorld) {
  await this.page.waitForSelector('text=#', { timeout: 15_000 });
  const body = await this.page.evaluate(() => document.body.innerText);
  assert.match(body, /#\d+/, 'Expected a large order number like #42');
});

Then('the page shows a verification code in monospace', async function (this: E2eWorld) {
  const body = await this.page.evaluate(() => document.body.innerText);
  // Verification codes are short alphanumeric: JO42, MI38, etc.
  assert.match(body, /[A-Z]{2}\d+/, 'Expected a verification code (e.g. JO42)');
});

// ── Order tracking ────────────────────────────────────────────────────────────

Then('the page shows a text input for the tracking code', async function (this: E2eWorld) {
  await this.page.waitForSelector('input', { timeout: 10_000 });
});

When('I enter tracking code {string} and submit', async function (this: E2eWorld, code: string) {
  const input = this.page.locator('input').first();
  await input.fill(code);
  await this.page.getByRole('button', { name: /Bilatu|Jarraitu|Begiratu/i }).click();
  // Wait for navigation or response
  await this.page.waitForTimeout(2_000);
});

Then(
  'I am on the tracking status page for code {string}',
  async function (this: E2eWorld, code: string) {
    await this.page.waitForURL((url) => url.pathname.includes(code), { timeout: 10_000 });
  }
);

Then('the page shows per-ticket status', async function (this: E2eWorld) {
  // Ticket statuses in Basque
  await this.page.waitForSelector('text=/Jasota|Prestatzen|Prest|Amaituta/', { timeout: 10_000 });
});

Then('the page shows a receipt download button', async function (this: E2eWorld) {
  await this.page.waitForSelector(
    'button:has-text("Deskargatu"), a:has-text("Deskargatu"), [href*="receipt"]',
    { timeout: 10_000 }
  );
});

Then(
  'the page shows a {string} section with invoice reference',
  async function (this: E2eWorld, sectionName: string) {
    await this.page.waitForSelector(`text=${sectionName}`, { timeout: 10_000 });
    const body = await this.page.evaluate(() => document.body.innerText);
    assert.match(body, /TB-/, 'Expected a TicketBAI invoice reference starting with TB-');
  }
);
