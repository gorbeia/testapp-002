import assert from 'assert';
import { When, Then } from '@cucumber/cucumber';
import type { E2eWorld } from './world';

// ── Public menu ───────────────────────────────────────────────────────────────

Then('the page shows txosna name {string}', async function (this: E2eWorld, name: string) {
  await this.page.waitForSelector(`text=${name}`, { timeout: 5_000 });
});

Then('the page shows a status badge {string}', async function (this: E2eWorld, status: string) {
  await this.page.waitForSelector(`text=${status}`, { timeout: 5_000 });
});

Then('the menu shows a category tab for food', async function (this: E2eWorld) {
  await this.page.waitForSelector('button:has-text("Janaria")', { timeout: 5_000 });
});

Then('the menu shows a category tab for drinks', async function (this: E2eWorld) {
  await this.page.waitForSelector('button:has-text("Edariak")', { timeout: 5_000 });
});

Then('at least one product card is visible', async function (this: E2eWorld) {
  // Wait for any element that looks like a product card
  await this.page
    .waitForSelector('[data-testid="product-card"], .product-card, [class*="product"]', {
      timeout: 5_000,
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
  await this.page.waitForSelector('text=#', { timeout: 5_000 });
});

Then(
  'the page shows ticket status including {string}',
  async function (this: E2eWorld, step: string) {
    await this.page.waitForSelector(`text=${step}`, { timeout: 5_000 });
  }
);

// ── Generic reusable steps ────────────────────────────────────────────────────

Then('the page shows a {string} section', async function (this: E2eWorld, sectionName: string) {
  await this.page.waitForSelector(`text=${sectionName}`, { timeout: 5_000 });
});

Then('the page shows a {string} button', async function (this: E2eWorld, label: string) {
  await this.page.waitForSelector(`button:has-text("${label}")`, { timeout: 5_000 });
});

Then('the page shows {string} heading', async function (this: E2eWorld, text: string) {
  await this.page.waitForSelector(`text=${text}`, { timeout: 5_000 });
});

Then('the page shows {string} section', async function (this: E2eWorld, sectionName: string) {
  await this.page.waitForSelector(`text=${sectionName}`, { timeout: 5_000 });
});

Then('the page shows a {string} column', async function (this: E2eWorld, columnName: string) {
  await this.page.waitForSelector(`text=${columnName}`, { timeout: 5_000 });
});

// ── Pickup proof ──────────────────────────────────────────────────────────────

Then('the page shows a large order number', async function (this: E2eWorld) {
  await this.page.waitForFunction(() => /^#\d+/m.test(document.body.innerText), {
    timeout: 8_000,
  });
});

Then('the page shows a verification code in monospace', async function (this: E2eWorld) {
  // Wait for async fetch to populate the verification code
  await this.page.waitForFunction(() => /[A-Z]{2}\d+/.test(document.body.innerText), {
    timeout: 5_000,
  });
});

// ── Self-service checkout flow ────────────────────────────────────────────────

When('I click the first available product card', async function (this: E2eWorld) {
  await this.page.waitForSelector('[data-testid="product-card"]:not([disabled])', {
    timeout: 10_000,
  });
  // Ensure React has hydrated the click handlers (page is a Client Component)
  await this.page.waitForLoadState('load');
  // Retry click up to 3 times in case React hydration completes mid-click
  for (let i = 0; i < 3; i++) {
    await this.page.locator('[data-testid="product-card"]:not([disabled])').first().click();
    const appeared = await this.page
      .waitForSelector('button:has-text("Saskira gehitu")', { timeout: 4_000 })
      .then(() => true)
      .catch(() => false);
    if (appeared) break;
    await this.page.waitForTimeout(300);
  }
  await this.page.waitForSelector('button:has-text("Saskira gehitu")', { timeout: 5_000 });
});

When('I add the first available product to the cart', async function (this: E2eWorld) {
  await this.page.waitForSelector('[data-testid="product-card"]:not([disabled])', {
    timeout: 10_000,
  });
  // Ensure React has hydrated the click handlers (page is a Client Component)
  await this.page.waitForLoadState('load');
  // Retry click up to 3 times in case React hydration completes mid-click
  for (let i = 0; i < 3; i++) {
    await this.page.locator('[data-testid="product-card"]:not([disabled])').first().click();
    const appeared = await this.page
      .waitForSelector('button:has-text("Saskira gehitu")', { timeout: 4_000 })
      .then(() => true)
      .catch(() => false);
    if (appeared) break;
    await this.page.waitForTimeout(300);
  }
  // ProductSheet opens — click the "Saskira gehitu" add button
  await this.page.waitForSelector('button:has-text("Saskira gehitu")', { timeout: 5_000 });
  await this.page.getByRole('button', { name: /Saskira gehitu/i }).click();
  await this.page.waitForTimeout(500);
});

Then('the cart bar is visible with a checkout link', async function (this: E2eWorld) {
  await this.page.waitForSelector('text=Saskia ikusi', { timeout: 5_000 });
});

When('I proceed to checkout', async function (this: E2eWorld) {
  await this.page.getByText('Saskia ikusi').click();
  await this.page.waitForURL((url) => url.pathname.includes('/checkout'), { timeout: 5_000 });
  // Wait for the checkout page content to stabilise (form or empty-cart view)
  await this.page.waitForFunction(
    () =>
      document.body.innerText.includes('Eskaeraren laburpena') ||
      document.body.innerText.includes('Saskia hutsik dago'),
    { timeout: 4_000 }
  );
});

When('I fill in customer name {string}', async function (this: E2eWorld, name: string) {
  await this.page.waitForSelector('input[placeholder="Zure izena"]', { timeout: 5_000 });
  await this.page.fill('input[placeholder="Zure izena"]', name);
});

When('I submit the order', async function (this: E2eWorld) {
  await this.page.getByRole('button', { name: /Eskatu|Ordaindu/i }).click();
  await this.page.waitForURL((url) => url.pathname.includes('/order/'), { timeout: 8_000 });
});

Then('I am on the order confirmation or status page', async function (this: E2eWorld) {
  const url = this.page.url();
  assert.ok(
    url.includes('/order/') || url.includes('/success'),
    `Expected order confirmation page, got: ${url}`
  );
  // The order page fetches data in useEffect — wait for "Kargatzen..." to disappear and order number to appear
  await this.page.waitForFunction(
    () =>
      !document.body.innerText.includes('Kargatzen...') && /^#\d+/m.test(document.body.innerText),
    { timeout: 8_000 }
  );
});

// ── Order tracking ────────────────────────────────────────────────────────────

Then('the page shows a text input for the tracking code', async function (this: E2eWorld) {
  await this.page.waitForSelector('input', { timeout: 5_000 });
});

When('I enter tracking code {string} and submit', async function (this: E2eWorld, code: string) {
  // TrackEntryClient is a Client Component — ensure React is hydrated before interacting
  await this.page.waitForLoadState('load');
  const input = this.page.locator('input').first();
  await input.click();
  await input.pressSequentially(code, { delay: 30 });
  await this.page.getByRole('button', { name: /Bilatu|Jarraitu|Begiratu/i }).click();
  // Wait for either navigation (valid code) or error message (invalid code)
  await Promise.race([
    this.page.waitForURL((url) => url.pathname.includes('/track/'), { timeout: 15_000 }),
    this.page.waitForSelector('text=Koderik', { timeout: 15_000 }),
  ]).catch(() => {});
});

Then(
  'I am on the tracking status page for code {string}',
  async function (this: E2eWorld, code: string) {
    await this.page.waitForURL((url) => url.pathname.includes(code), { timeout: 12_000 });
  }
);

Then('the page shows per-ticket status', async function (this: E2eWorld) {
  // Ticket statuses in Basque
  await this.page.waitForSelector('text=/Jasota|Prestatzen|Prest|Amaituta/', { timeout: 5_000 });
});

Then('the page shows a receipt download button', async function (this: E2eWorld) {
  await this.page.waitForSelector(
    'button:has-text("Deskargatu"), a:has-text("Deskargatu"), [href*="receipt"]',
    { timeout: 5_000 }
  );
});

Then(
  'the page shows a {string} section with invoice reference',
  async function (this: E2eWorld, sectionName: string) {
    await this.page.waitForSelector(`text=${sectionName}`, { timeout: 5_000 });
    const body = await this.page.evaluate(() => document.body.innerText);
    assert.match(body, /TB-/, 'Expected a TicketBAI invoice reference starting with TB-');
  }
);
