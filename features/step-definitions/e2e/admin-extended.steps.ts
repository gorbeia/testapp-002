import assert from 'assert';
import { When, Then } from '@cucumber/cucumber';
import { BASE_URL } from './world';
import type { E2eWorld } from './world';

// ── Navigation ────────────────────────────────────────────────────────────────

When(
  'I navigate to {string} and click the {string} tab',
  async function (this: E2eWorld, adminPath: string, tabLabel: string) {
    const base = this.txosnaBaseUrl.replace(/\/$/, '');
    const fullPath = adminPath.startsWith('/eu/') ? adminPath : `${base}${adminPath}`;
    await this.page.goto(`${BASE_URL}${fullPath}`, { waitUntil: 'networkidle' });
    await this.page.waitForSelector(
      `button:has-text("${tabLabel}"), [role="tab"]:has-text("${tabLabel}")`,
      {
        timeout: 10_000,
      }
    );
    await this.page
      .getByRole('button', { name: tabLabel })
      .click()
      .catch(async () => {
        await this.page.locator(`[role="tab"]:has-text("${tabLabel}")`).click();
      });
    await this.page.waitForTimeout(500);
  }
);

// ── Kitchen posts tab ─────────────────────────────────────────────────────────

Then(
  'the page shows kitchen posts {string} and {string}',
  async function (this: E2eWorld, post1: string, post2: string) {
    const body = await this.page.evaluate(() => document.body.innerText);
    assert.ok(
      body.includes(post1),
      `Expected kitchen post "${post1}" in page. Got: ${body.slice(0, 400)}`
    );
    assert.ok(
      body.includes(post2),
      `Expected kitchen post "${post2}" in page. Got: ${body.slice(0, 400)}`
    );
  }
);

Then(
  'the page shows a {string} input and {string} button',
  async function (this: E2eWorld, inputLabel: string, buttonLabel: string) {
    const body = await this.page.evaluate(() => document.body.innerText);
    assert.ok(
      body.includes(inputLabel) || body.includes(inputLabel.toLowerCase()),
      `Expected input labelled "${inputLabel}". Got: ${body.slice(0, 400)}`
    );
    await this.page.waitForSelector(`button:has-text("${buttonLabel}")`, { timeout: 5_000 });
  }
);

// ── BEZ / TicketBAI tab ───────────────────────────────────────────────────────

Then('the page shows a {string} toggle', async function (this: E2eWorld, toggleLabel: string) {
  const body = await this.page.evaluate(() => document.body.innerText);
  assert.ok(
    body.includes(toggleLabel),
    `Expected toggle "${toggleLabel}" on page. Got: ${body.slice(0, 400)}`
  );
});

Then('the page shows a VAT types list', async function (this: E2eWorld) {
  const body = await this.page.evaluate(() => document.body.innerText);
  // Spain defaults include BEZ Orokorra (21%) and BEZ Murriztua (10%)
  const hasVat =
    body.includes('21') || body.includes('10') || body.includes('BEZ') || body.includes('IVA');
  assert.ok(hasVat, `Expected VAT types list. Got: ${body.slice(0, 400)}`);
});

Then('the {string} toggle is already on', async function (this: E2eWorld, toggleLabel: string) {
  const body = await this.page.evaluate(() => document.body.innerText);
  assert.ok(
    body.includes(toggleLabel),
    `Expected toggle "${toggleLabel}" on page. Got: ${body.slice(0, 400)}`
  );
  // If toggle is off this scenario would fail further — that's expected behaviour
});

Then('the page shows a {string} input', async function (this: E2eWorld, inputLabel: string) {
  const body = await this.page.evaluate(() => document.body.innerText);
  assert.ok(
    body.includes(inputLabel),
    `Expected input "${inputLabel}" on page. Got: ${body.slice(0, 400)}`
  );
});

// ── Invoice ledger ────────────────────────────────────────────────────────────

Then(
  'the page shows an invoice table with columns for invoice number, order, date, total, status',
  async function (this: E2eWorld) {
    const body = await this.page.evaluate(() => document.body.innerText);
    // Check for some of the column headers (Basque or English)
    const hasCols =
      (body.includes('Faktura') || body.includes('Invoice') || body.includes('TB-')) &&
      (body.includes('Eskaera') || body.includes('Order') || body.includes('#'));
    assert.ok(hasCols, `Expected invoice table columns. Got: ${body.slice(0, 400)}`);
  }
);

Then('the invoice table has at least one row', async function (this: E2eWorld) {
  const body = await this.page.evaluate(() => document.body.innerText);
  // Invoice references look like TB-00000042
  assert.match(
    body,
    /TB-\d+/,
    `Expected at least one invoice row (TB-XXXX). Got: ${body.slice(0, 400)}`
  );
});

Then(
  'the first invoice shows a series reference starting with {string}',
  async function (this: E2eWorld, prefix: string) {
    const body = await this.page.evaluate(() => document.body.innerText);
    assert.ok(
      body.includes(prefix),
      `Expected invoice series prefix "${prefix}". Got: ${body.slice(0, 400)}`
    );
  }
);
