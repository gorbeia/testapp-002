import assert from 'assert';
import { Then, When } from '@cucumber/cucumber';
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
        timeout: 5_000,
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
  // Wait for the BEZ tab data to finish loading — the "Gehitu BEZ mota" button only renders
  // once loading=false, which also means associationId is set in React state. Without this
  // the toggle PATCH fires with an empty associationId and fails silently.
  await this.page.waitForSelector('text=Gehitu BEZ mota', { timeout: 10_000 });

  const body = await this.page.evaluate(() => document.body.innerText);
  assert.ok(
    body.includes(toggleLabel),
    `Expected toggle "${toggleLabel}" on page. Got: ${body.slice(0, 400)}`
  );

  const panelVisible = await this.page
    .locator('text=TicketBAI konfigurazioa')
    .isVisible()
    .catch(() => false);

  if (!panelVisible) {
    // Enable via direct API call (avoids relying on the toggle click hitting a loaded
    // React state) then reload so the page renders with the toggle already on.
    await this.page.evaluate(async () => {
      const session = await fetch('/api/auth/session').then((r) => r.json());
      const assocId: string =
        (session as { user?: { associationId?: string } })?.user?.associationId ?? '';
      if (assocId) {
        await fetch(`/api/associations/${assocId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketBaiEnabled: true }),
        });
      }
    });
    await this.page.reload({ waitUntil: 'networkidle' });
    await this.page
      .getByRole('button', { name: 'BEZ' })
      .click()
      .catch(async () => {
        await this.page.locator('[role="tab"]:has-text("BEZ")').click();
      });
    await this.page.waitForSelector('text=TicketBAI konfigurazioa', { timeout: 10_000 });
  }
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

Then('the page loads successfully not redirected to login', async function (this: E2eWorld) {
  const url = this.page.url();
  assert.ok(
    !url.includes('/login'),
    `Expected to stay on admin page, but was redirected to login: ${url}`
  );
  // Wait a moment for any client-side loading to complete
  await this.page.waitForTimeout(500);
});
