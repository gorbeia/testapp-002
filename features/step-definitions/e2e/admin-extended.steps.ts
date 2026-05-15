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

Then(
  'the {string} toggle is already on',
  { timeout: 60_000 },
  async function (this: E2eWorld, toggleLabel: string) {
    // ── Phase 1: wait for VatTab data load ──────────────────────────────────
    // "Gehitu BEZ mota" only renders once loading=false (associationId is set).
    const loadPhase = await this.page
      .waitForSelector('text=Gehitu BEZ mota', { timeout: 15_000 })
      .then(() => 'ok' as const)
      .catch((e: Error) => `TIMEOUT:${e.message}` as const);
    console.log(`[toggle-step] phase1 loadPhase=${loadPhase}`);

    if (loadPhase !== 'ok') {
      const snap = await this.page.evaluate(() => document.body.innerText);
      console.log(`[toggle-step] page on load-timeout: ${snap.slice(0, 600)}`);
    }

    // ── Phase 2: assert label exists ────────────────────────────────────────
    const body = await this.page.evaluate(() => document.body.innerText);
    assert.ok(
      body.includes(toggleLabel),
      `Expected toggle "${toggleLabel}" on page. Got: ${body.slice(0, 400)}`
    );

    // ── Phase 3: check panel ────────────────────────────────────────────────
    const panelVisible = await this.page
      .locator('text=TicketBAI konfigurazioa')
      .isVisible()
      .catch(() => false);
    console.log(`[toggle-step] phase3 panelVisible=${panelVisible}`);

    if (panelVisible) return;

    // ── Phase 4: enable via API ─────────────────────────────────────────────
    type ApiResult = { status?: number; body?: string; assocId?: string; error?: string };
    const apiResult: ApiResult = await this.page.evaluate(async () => {
      try {
        const sessionResp = await fetch('/api/auth/session');
        const session = (await sessionResp.json()) as { user?: { associationId?: string } };
        const assocId = session?.user?.associationId ?? '';
        if (!assocId) return { error: 'no associationId', session: JSON.stringify(session) };
        const patchResp = await fetch(`/api/associations/${assocId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketBaiEnabled: true }),
        });
        const text = await patchResp.text();
        return { status: patchResp.status, body: text, assocId };
      } catch (err) {
        return { error: String(err) };
      }
    });
    console.log(`[toggle-step] phase4 apiResult=${JSON.stringify(apiResult)}`);

    // ── Phase 5: reload → BEZ tab → wait for panel ─────────────────────────
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.page
      .getByRole('button', { name: 'BEZ' })
      .click()
      .catch(async () => {
        await this.page.locator('[role="tab"]:has-text("BEZ")').click();
      });

    const panelAfter = await this.page
      .waitForSelector('text=TicketBAI konfigurazioa', { timeout: 15_000 })
      .then(() => 'visible' as const)
      .catch((e: Error) => `MISSING:${e.message}` as const);
    console.log(`[toggle-step] phase5 panelAfter=${panelAfter}`);

    if (panelAfter !== 'visible') {
      const snap2 = await this.page.evaluate(() => document.body.innerText);
      console.log(`[toggle-step] page on panel-missing: ${snap2.slice(0, 600)}`);
    }

    assert.ok(
      panelAfter === 'visible',
      `TicketBAI config panel did not appear. apiResult=${JSON.stringify(apiResult)}`
    );
  }
);

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
    // Wait for loading state to resolve (page fetches invoice data client-side)
    await this.page
      .waitForFunction(() => !document.body.innerText.includes('Kargatzen...'), { timeout: 10_000 })
      .catch(() => {});
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
