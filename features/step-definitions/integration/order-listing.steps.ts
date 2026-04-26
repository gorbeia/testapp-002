import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import {
  POST as ordersPOST,
  GET as ordersGET,
} from '../../../src/app/api/txosnak/[slug]/orders/route';
import { orderRepo } from '../../../src/test/store-setup';
import type { StoredOrder } from '../../../src/lib/store/types';
import type { IntegrationWorld } from './world';

function params(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

// prod-1 (Burgerra) is FOOD in cat-1, which belongs to assoc-1 in the seed.
async function createOrder(
  slug: string,
  channel: 'COUNTER' | 'SELF_SERVICE'
): Promise<StoredOrder | null> {
  const body = {
    channel,
    customerName: null,
    notes: null,
    paymentMethod: 'CASH',
    lines: [
      {
        productId: 'prod-1',
        quantity: 1,
        selectedVariantOptionId: null,
        selectedModifierIds: [],
        splitInstructions: null,
      },
    ],
  };
  const req = new Request(`http://localhost/api/txosnak/${slug}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const res = await ordersPOST(req, params(slug));
  if (res.status !== 201) return null;
  return res.json() as Promise<StoredOrder>;
}

// ===== Given steps =====

Given(
  '{int} COUNTER orders exist for {string}',
  async function (this: IntegrationWorld, count: number, slug: string): Promise<void> {
    assert.ok(this.currentTxosna, 'currentTxosna must be set via Background');
    for (let i = 0; i < count; i++) {
      const order = await createOrder(slug, 'COUNTER');
      assert.ok(order, 'COUNTER order creation failed');
      this.savedOrders.push(order);
    }
  }
);

Given(
  'a CONFIRMED order exists for {string}',
  async function (this: IntegrationWorld, slug: string): Promise<void> {
    assert.ok(this.currentTxosna, 'currentTxosna must be set via Background');
    // COUNTER orders are confirmed immediately by the route handler
    const order = await createOrder(slug, 'COUNTER');
    assert.ok(order, 'COUNTER order creation failed');
    this.savedOrders.push(order);
  }
);

Given(
  'a PENDING_PAYMENT order exists for {string}',
  async function (this: IntegrationWorld, slug: string): Promise<void> {
    assert.ok(this.currentTxosna, 'currentTxosna must be set via Background');
    const order = await createOrder(slug, 'SELF_SERVICE');
    assert.ok(order, 'SELF_SERVICE order creation failed');
    assert.equal(order.status, 'PENDING_PAYMENT');
    this.savedOrders.push(order);
  }
);

Given(
  'a COUNTER order exists for {string}',
  async function (this: IntegrationWorld, slug: string): Promise<void> {
    assert.ok(this.currentTxosna, 'currentTxosna must be set via Background');
    const order = await createOrder(slug, 'COUNTER');
    assert.ok(order, 'COUNTER order creation failed');
    this.savedOrders.push(order);
  }
);

Given(
  'a SELF_SERVICE order exists for {string}',
  async function (this: IntegrationWorld, slug: string): Promise<void> {
    assert.ok(this.currentTxosna, 'currentTxosna must be set via Background');
    const order = await createOrder(slug, 'SELF_SERVICE');
    assert.ok(order, 'SELF_SERVICE order creation failed');
    this.savedOrders.push(order);
  }
);

Given(
  'a PENDING_PAYMENT order exists that expired {int} hour(s) ago for {string}',
  async function (this: IntegrationWorld, hours: number, slug: string): Promise<void> {
    assert.ok(this.currentTxosna, 'currentTxosna must be set via Background');
    const order = await createOrder(slug, 'SELF_SERVICE');
    assert.ok(order, 'SELF_SERVICE order creation failed');
    await orderRepo.update(order.id, {
      expiresAt: new Date(Date.now() - hours * 60 * 60 * 1000),
    });
    this.savedOrders.push(order);
  }
);

// ===== When steps =====

When(
  'I GET orders for {string}',
  async function (this: IntegrationWorld, slug: string): Promise<void> {
    const req = new Request(`http://localhost/api/txosnak/${slug}/orders`, { method: 'GET' });
    this.lastResponse = await ordersGET(req, params(slug));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

When(
  'I GET orders for {string} with status {string}',
  async function (this: IntegrationWorld, slug: string, status: string): Promise<void> {
    const req = new Request(`http://localhost/api/txosnak/${slug}/orders?status=${status}`, {
      method: 'GET',
    });
    this.lastResponse = await ordersGET(req, params(slug));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

When(
  'I GET orders for {string} with channel {string}',
  async function (this: IntegrationWorld, slug: string, channel: string): Promise<void> {
    const req = new Request(`http://localhost/api/txosnak/${slug}/orders?channel=${channel}`, {
      method: 'GET',
    });
    this.lastResponse = await ordersGET(req, params(slug));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

// ===== Then steps =====

Then(
  'the response contains at least {int} orders',
  function (this: IntegrationWorld, minCount: number): void {
    const body = this.lastBody as StoredOrder[];
    assert.ok(Array.isArray(body), 'response should be an array of orders');
    assert.ok(body.length >= minCount, `expected at least ${minCount} orders, got ${body.length}`);
  }
);

Then(
  'all returned orders have status {string}',
  function (this: IntegrationWorld, expectedStatus: string): void {
    const body = this.lastBody as StoredOrder[];
    assert.ok(Array.isArray(body), 'response should be an array of orders');
    assert.ok(body.length > 0, 'response should contain at least one order');
    for (const order of body) {
      assert.equal(
        order.status,
        expectedStatus,
        `order ${order.id} should have status ${expectedStatus}, got ${order.status}`
      );
    }
  }
);

Then(
  'all returned orders have channel {string}',
  function (this: IntegrationWorld, expectedChannel: string): void {
    const body = this.lastBody as StoredOrder[];
    assert.ok(Array.isArray(body), 'response should be an array of orders');
    assert.ok(body.length > 0, 'response should contain at least one order');
    for (const order of body) {
      assert.equal(
        order.channel,
        expectedChannel,
        `order ${order.id} should have channel ${expectedChannel}, got ${order.channel}`
      );
    }
  }
);

Then('no orders have status {string}', function (this: IntegrationWorld, status: string): void {
  const body = this.lastBody as StoredOrder[];
  assert.ok(Array.isArray(body), 'response should be an array of orders');
  const matching = body.filter((o) => o.status === status);
  assert.equal(
    matching.length,
    0,
    `expected no orders with status ${status}, found ${matching.length}`
  );
});
