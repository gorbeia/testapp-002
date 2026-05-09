import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { BASE_URL } from './world';
import type { E2eWorld } from './world';

// ── Given ─────────────────────────────────────────────────────────────────────

Given(
  'the payment provider is the FakePaymentProvider',

  async function (this: E2eWorld) {
    // No-op in e2e: real Redsys provider is used; fake provider is only for integration tests
  }
);

Given('a Redsys payment provider is configured for the txosna', async function (this: E2eWorld) {
  const slug = this.currentSlug;
  assert.ok(slug, 'currentSlug must be set via a preceding Given step');
  // Enable ONLINE payment if not already
  await fetch(`${BASE_URL}/api/e2e/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'enableOnlinePayment', slug }),
  });
  // Create/refresh Redsys provider
  await fetch(`${BASE_URL}/api/e2e/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'createRedsysProvider', slug }),
  });
});

Given(
  'a PENDING_PAYMENT order {string} exists',
  async function (this: E2eWorld, orderName: string) {
    const slug = this.currentSlug;
    assert.ok(slug, 'currentSlug must be set via a preceding Given step');
    const res = await fetch(`${BASE_URL}/api/e2e/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'createOnlineOrder', slug, orderName }),
    });
    assert.equal(res.status, 200, `Failed to create order: ${await res.text()}`);
    const body = (await res.json()) as { id: string };
    this.namedOrders.set(orderName, body.id);
  }
);

// ── When ──────────────────────────────────────────────────────────────────────

When(
  'I navigate to the Redsys redirect page for order {string}',
  async function (this: E2eWorld, orderName: string) {
    const orderId = this.namedOrders.get(orderName);
    assert.ok(orderId, `Order "${orderName}" must be created first`);

    // Create a payment session to get the Redsys redirect URL
    const sessionRes = await fetch(`${BASE_URL}/api/payments/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        providerType: 'REDSYS',
        returnUrl: `${BASE_URL}/eu/order/${orderId}`,
      }),
    });
    assert.equal(sessionRes.status, 200, `Session creation failed: ${await sessionRes.text()}`);
    const session = (await sessionRes.json()) as { url: string };
    const redirectUrl = session.url;
    assert.ok(redirectUrl, 'session must return a redirect URL');

    // Override form.submit in the page so the auto-submit script is a no-op —
    // this lets us inspect the form fields before they are POSTed to Redsys.
    await this.page.addInitScript(() => {
      HTMLFormElement.prototype.submit = () => {};
    });

    // Navigate to the redirect page (path is relative to BASE_URL)
    const path = redirectUrl.startsWith('http')
      ? new URL(redirectUrl).pathname + new URL(redirectUrl).search
      : redirectUrl;
    await this.goto(path);

    // Wait for the form to be present in the DOM
    await this.page.waitForSelector('form', { timeout: 8_000 });
  }
);

// ── Then ──────────────────────────────────────────────────────────────────────

Then('the page contains a form targeting the Redsys TPV endpoint', async function (this: E2eWorld) {
  const action = await this.page.locator('form').first().getAttribute('action');
  assert.ok(action, 'form must have an action attribute');
  assert.ok(action.includes('redsys.es'), `form action should target redsys.es, got: ${action}`);
});

Then(
  'the form includes the fields {string}, {string}, and {string}',
  async function (this: E2eWorld, field1: string, field2: string, field3: string) {
    for (const fieldName of [field1, field2, field3]) {
      const input = this.page.locator(`input[name="${fieldName}"]`);
      const count = await input.count();
      assert.ok(count > 0, `Expected input[name="${fieldName}"] to be present in the form`);
      const value = await input.first().getAttribute('value');
      assert.ok(value && value.length > 0, `Field "${fieldName}" must have a non-empty value`);
    }
  }
);

// ── Redirect check (used from self-service flow) ───────────────────────────────

Then('I am redirected to the Redsys payment page', async function (this: E2eWorld) {
  // After I choose to pay online, the browser navigates to /api/payments/redsys/redirect
  const url = this.page.url();
  assert.ok(
    url.includes('/api/payments/redsys/redirect') || url.includes('redsys.es'),
    `Expected Redsys redirect page, got: ${url}`
  );
});
