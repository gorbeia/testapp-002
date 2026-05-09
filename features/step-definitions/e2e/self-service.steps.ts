import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { BASE_URL } from './world';
import type { E2eWorld } from './world';

// ── Given ─────────────────────────────────────────────────────────────────────

Given('the txosna {string} exists and is OPEN', async function (this: E2eWorld, slug: string) {
  const res = await fetch(`${BASE_URL}/api/txosnak/${slug}`);
  assert.equal(res.status, 200, `Txosna "${slug}" should exist (got ${res.status})`);
  this.currentSlug = slug;
});

Given('the txosna {string} is open', async function (this: E2eWorld, slug: string) {
  this.currentSlug = slug;
});

Given(
  'the txosna {string} is open and accepts online payments via Redsys',
  async function (this: E2eWorld, slug: string) {
    this.currentSlug = slug;
    const r1 = await fetch(`${BASE_URL}/api/e2e/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enableOnlinePayment', slug }),
    });
    assert.equal(r1.status, 200, `enableOnlinePayment failed: ${await r1.text()}`);
    const r2 = await fetch(`${BASE_URL}/api/e2e/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'createRedsysProvider', slug }),
    });
    assert.equal(r2.status, 200, `createRedsysProvider failed: ${await r2.text()}`);
  }
);

// ── When ──────────────────────────────────────────────────────────────────────

When('I navigate to the menu for {string}', async function (this: E2eWorld, slug: string) {
  this.currentSlug = slug;
  await this.goto(`/eu/${slug}`);
  // Wait for at least one product card
  await this.page
    .waitForSelector('[data-testid="product-card"]', { timeout: 8_000 })
    .catch(async () => {
      // Fallback: price pattern
      await this.page.waitForFunction(() => /€/.test(document.body.innerText), {
        timeout: 4_000,
      });
    });
});

When('I add {string} to my cart', async function (this: E2eWorld, productName: string) {
  // Click the product card containing the product name
  await this.page
    .locator(`[data-testid="product-card"]:has-text("${productName}")`)
    .first()
    .click();
  // ProductSheet opens — click "Saskira gehitu"
  await this.page.waitForSelector('button:has-text("Saskira gehitu")', { timeout: 6_000 });
  await this.page.getByRole('button', { name: /Saskira gehitu/i }).click();
  await this.page.waitForTimeout(400);
});

When(
  'I fill in my name {string} and submit the order',
  async function (this: E2eWorld, name: string) {
    // Navigate to checkout via the cart bar
    await this.page.waitForSelector('text=Saskia ikusi', { timeout: 6_000 });
    await this.page.getByText('Saskia ikusi').click();
    await this.page.waitForURL((url) => url.pathname.includes('/checkout'), { timeout: 6_000 });

    // Fill customer name
    await this.page.waitForSelector('input[placeholder="Zure izena"]', { timeout: 5_000 });
    await this.page.fill('input[placeholder="Zure izena"]', name);

    // Submit (CASH order — button reads "Eskatu — X.XX €")
    await this.page.getByRole('button', { name: /Eskatu/i }).click();
    await this.page.waitForURL((url) => url.pathname.includes('/order/'), { timeout: 10_000 });
  }
);

When('I choose to pay online', async function (this: E2eWorld) {
  // Navigate to checkout via the cart bar
  await this.page.waitForSelector('text=Saskia ikusi', { timeout: 8_000 });
  await this.page.getByText('Saskia ikusi').click({ timeout: 5_000 });
  await this.page.waitForURL((url) => url.pathname.includes('/checkout'), { timeout: 8_000 });

  // Fill a required customer name
  await this.page.waitForSelector('input[placeholder="Zure izena"]', { timeout: 8_000 });
  await this.page.fill('input[placeholder="Zure izena"]', 'TestUser');

  // Select the ONLINE payment option (payment selector only appears when both CASH and ONLINE are enabled)
  await this.page
    .getByRole('button', { name: /Online.*Txartela|Txartela/i })
    .click({ timeout: 8_000 });

  // Block navigation to the Redsys TPV so the redirect page stays visible
  await this.page.route('*://sis-t.redsys.es/**', (route) => route.abort());
  await this.page.route('*://sis.redsys.es/**', (route) => route.abort());

  // Submit — button reads "Ordaindu online — X.XX €"
  await this.page.getByRole('button', { name: /Ordaindu online/i }).click({ timeout: 8_000 });

  // Wait until the browser has navigated to the Redsys redirect page
  await this.page
    .waitForURL((url) => url.pathname.startsWith('/api/payments/redsys/redirect'), {
      timeout: 15_000,
    })
    .catch(() => {
      // Page may have aborted before fully landing; URL check is enough
    });
});

When('the Redsys payment succeeds for my order', async function (this: E2eWorld) {
  await simulateRedsysWebhook(this, 'succeeded');
});

When('the Redsys payment is cancelled for my order', async function (this: E2eWorld) {
  await simulateRedsysWebhook(this, 'cancelled');
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then('I see the order confirmation page with an order number', async function (this: E2eWorld) {
  const url = this.page.url();
  assert.ok(url.includes('/order/'), `Expected order page, got: ${url}`);
  await this.page.waitForFunction(
    () =>
      !document.body.innerText.includes('Kargatzen...') && /^#\d+/m.test(document.body.innerText),
    { timeout: 10_000 }
  );
});

Then('the order status is {string}', async function (this: E2eWorld, expectedStatus: string) {
  const orderId = await this.page.evaluate(() => localStorage.getItem('txosna_order_id'));
  assert.ok(orderId, 'orderId should be in localStorage after checkout');
  const res = await fetch(`${BASE_URL}/api/orders/${orderId}`);
  assert.equal(res.status, 200);
  const order = (await res.json()) as { status: string };
  assert.equal(order.status, expectedStatus);
});

Then(
  'the order status page shows {string}',
  async function (this: E2eWorld, expectedStatus: string) {
    const orderId = await this.page.evaluate(() => localStorage.getItem('txosna_order_id'));
    assert.ok(orderId, 'orderId should be in localStorage');
    // Navigate to the order page to ensure we see the latest state
    await this.goto(`/eu/order/${orderId}`);
    await this.page.waitForFunction(() => !document.body.innerText.includes('Kargatzen...'), {
      timeout: 8_000,
    });
    const res = await fetch(`${BASE_URL}/api/orders/${orderId}`);
    assert.equal(res.status, 200);
    const order = (await res.json()) as { status: string };
    assert.equal(order.status, expectedStatus);
  }
);

Then('I see the order has been cancelled', async function (this: E2eWorld) {
  const orderId = await this.page.evaluate(() => localStorage.getItem('txosna_order_id'));
  assert.ok(orderId, 'orderId should be in localStorage');
  await this.goto(`/eu/order/${orderId}`);
  await this.page.waitForFunction(() => !document.body.innerText.includes('Kargatzen...'), {
    timeout: 8_000,
  });
  const res = await fetch(`${BASE_URL}/api/orders/${orderId}`);
  const order = (await res.json()) as { status: string };
  assert.equal(order.status, 'CANCELLED');
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function simulateRedsysWebhook(world: E2eWorld, outcome: 'succeeded' | 'cancelled') {
  // Retrieve the order id that was stored by the checkout flow
  const orderId = await world.page.evaluate(() => localStorage.getItem('txosna_order_id'));
  assert.ok(orderId, 'orderId must be in localStorage before simulating webhook');

  const orderRes = await fetch(`${BASE_URL}/api/orders/${orderId}`);
  assert.equal(orderRes.status, 200, 'order must exist');
  const order = (await orderRes.json()) as { paymentSessionId: string | null; total: number };
  const sessionId = order.paymentSessionId;
  assert.ok(sessionId, 'order must have a paymentSessionId after payment session was created');

  // Build and sign a Redsys-style webhook notification
  const dsResponse = outcome === 'succeeded' ? '0000' : '9999';
  const body = buildSignedRedsysWebhook(sessionId, dsResponse, order.total);

  const webhookRes = await fetch(`${BASE_URL}/api/payments/webhook/redsys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  assert.ok(webhookRes.status < 300, `Webhook returned ${webhookRes.status}`);
}

/**
 * Creates a properly signed Redsys HMAC_SHA256_V1 webhook body using the
 * test merchant key used in the Redsys provider seed.
 */
function buildSignedRedsysWebhook(dsOrder: string, dsResponse: string, total: number): string {
  const crypto = require('crypto') as typeof import('crypto');

  const SECRET_KEY = 'sq7HjrUOBfKmC576ILgskD5srU870gJ7'; // test key from seed

  const params = {
    Ds_Order: dsOrder,
    Ds_Response: dsResponse,
    Ds_Amount: String(Math.round(total * 100)),
    Ds_Currency: '978',
    Ds_TransactionType: '0',
    Ds_ProcessedPayMethod: '0',
  };

  const Ds_MerchantParameters = Buffer.from(JSON.stringify(params)).toString('base64');

  // Derive per-order key using 3DES-CBC (Redsys HMAC_SHA256_V1 algorithm)
  const keyBuf = Buffer.from(SECRET_KEY, 'base64');
  const iv = Buffer.alloc(8, 0);
  const orderBuf = Buffer.from(dsOrder, 'utf8');
  const blockSize = 8;
  const paddedLen = Math.ceil(orderBuf.length / blockSize) * blockSize;
  const paddedBuf = Buffer.alloc(paddedLen, 0);
  orderBuf.copy(paddedBuf);

  const cipher = crypto.createCipheriv('des-ede3-cbc', keyBuf, iv);
  cipher.setAutoPadding(false);
  const encBuf = Buffer.concat([cipher.update(paddedBuf), cipher.final()]);
  const orderKeyBuf = encBuf.subarray(0, paddedLen);

  const Ds_Signature = crypto
    .createHmac('sha256', orderKeyBuf)
    .update(Ds_MerchantParameters)
    .digest('base64');

  return new URLSearchParams({
    Ds_SignatureVersion: 'HMAC_SHA256_V1',
    Ds_MerchantParameters,
    Ds_Signature,
  }).toString();
}
