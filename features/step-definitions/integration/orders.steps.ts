import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { POST as ordersPOST } from '../../../src/app/api/txosnak/[slug]/orders/route';
import { ticketRepo, _test_insertProduct, _test_insertTxosna } from '../../../src/test/store-setup';
import type { StoredOrder } from '../../../src/lib/store/types';
import type { IntegrationWorld } from './world';

function params(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

// ===== Given steps =====

Given('I am authenticated as a volunteer', async function (this: IntegrationWorld) {
  // PROTO_MODE=true bypasses auth in the route handler
  // This step documents intent but does nothing mechanically
});

Given(
  'the txosna {string} is PAUSED',
  async function (this: IntegrationWorld, _slug: string): Promise<void> {
    assert.ok(this.currentTxosna, 'currentTxosna must be set via Background');
    const pausedTxosna = {
      ...this.currentTxosna,
      status: 'PAUSED' as const,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _test_insertTxosna(pausedTxosna as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.currentTxosna = pausedTxosna as any;
  }
);

// ===== When steps =====

When(
  'I submit a COUNTER order for {string} with:',
  async function (
    this: IntegrationWorld,
    _slug: string,
    table: Record<string, unknown>
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (table as any).rowsHash();
    const productId = rows.productId || 'prod-1';
    const quantity = parseInt(rows.quantity || '1', 10);
    const customerName = rows.customerName || null;
    const paymentMethod = rows.paymentMethod || 'CASH';

    assert.ok(this.currentTxosna, 'currentTxosna must be set');

    const body = {
      channel: 'COUNTER',
      customerName,
      notes: null,
      paymentMethod,
      lines: [
        {
          productId,
          quantity,
          selectedVariantOptionId: null,
          selectedModifierIds: [],
          splitInstructions: null,
        },
      ],
    };

    const req = new Request(`http://localhost/api/txosnak/${this.currentTxosna.slug}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    this.lastResponse = await ordersPOST(req, params(this.currentTxosna.slug));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);

    if (this.lastResponse.status === 201) {
      this.currentOrder = this.lastBody as StoredOrder;
      this.savedOrders.push(this.currentOrder);
    }
  }
);

When(
  'I submit a COUNTER order for {string} with product {string}',
  async function (this: IntegrationWorld, slug: string, productId: string) {
    const body = {
      channel: 'COUNTER',
      customerName: null,
      notes: null,
      paymentMethod: 'CASH',
      lines: [
        {
          productId,
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

    this.lastResponse = await ordersPOST(req, params(slug));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);

    if (this.lastResponse.status === 201) {
      this.currentOrder = this.lastBody as StoredOrder;
      this.savedOrders.push(this.currentOrder);
    }
  }
);

When(
  'I submit a COUNTER order for {string}',
  async function (this: IntegrationWorld, slug: string) {
    const body = {
      channel: 'COUNTER',
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

    this.lastResponse = await ordersPOST(req, params(slug));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);

    if (this.lastResponse.status === 201) {
      this.currentOrder = this.lastBody as StoredOrder;
      this.savedOrders.push(this.currentOrder);
    }
  }
);

When(
  'I submit a COUNTER order with one food product and one drinks product',
  async function (this: IntegrationWorld): Promise<void> {
    assert.ok(this.currentTxosna, 'currentTxosna must be set');

    // Insert a drinks product if not already present
    _test_insertProduct({
      id: 'prod-drinks-1',
      categoryId: 'cat-drinks',
      name: 'Wine',
      description: null,
      defaultPrice: 8,
      imageUrl: null,
      allergens: [],
      dietaryFlags: [],
      ageRestricted: false,
      requiresPreparation: false,
      available: true,
      splittable: false,
      splitMaxWays: 1,
      removableIngredients: [],
      preparationInstructions: null,
      displayOrder: 1,
      variantGroups: [],
      modifiers: [],
      category: 'DRINKS',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const body = {
      channel: 'COUNTER',
      customerName: null,
      notes: null,
      paymentMethod: 'CASH',
      lines: [
        {
          productId: 'prod-1', // FOOD
          quantity: 1,
          selectedVariantOptionId: null,
          selectedModifierIds: [],
          splitInstructions: null,
        },
        {
          productId: 'prod-drinks-1', // DRINKS
          quantity: 1,
          selectedVariantOptionId: null,
          selectedModifierIds: [],
          splitInstructions: null,
        },
      ],
    };

    const req = new Request(`http://localhost/api/txosnak/${this.currentTxosna.slug}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    this.lastResponse = await ordersPOST(req, params(this.currentTxosna.slug));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);

    if (this.lastResponse.status === 201) {
      this.currentOrder = this.lastBody as StoredOrder;
      this.savedOrders.push(this.currentOrder);
    }
  }
);

When(
  'I submit {int} COUNTER orders for {string}',
  async function (this: IntegrationWorld, count: number, _slug: string): Promise<void> {
    assert.ok(this.currentTxosna, 'currentTxosna must be set');
    for (let i = 0; i < count; i++) {
      const body = {
        channel: 'COUNTER',
        customerName: `Customer ${i + 1}`,
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

      const req = new Request(`http://localhost/api/txosnak/${this.currentTxosna.slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      this.lastResponse = await ordersPOST(req, params(this.currentTxosna.slug));
      this.lastBody = await this.lastResponse
        .clone()
        .json()
        .catch(() => null);

      if (this.lastResponse.status === 201) {
        this.currentOrder = this.lastBody as StoredOrder;
        this.savedOrders.push(this.currentOrder);
      }
    }
  }
);

// ===== Then steps =====

Then('the order status is {string}', function (this: IntegrationWorld, expectedStatus: string) {
  assert.ok(this.currentOrder, 'currentOrder must be set');
  assert.equal(this.currentOrder.status, expectedStatus);
});

Then('the order has an order number', function (this: IntegrationWorld) {
  assert.ok(this.currentOrder, 'currentOrder must be set');
  assert.ok(
    typeof this.currentOrder.orderNumber === 'number' && this.currentOrder.orderNumber > 0,
    'order should have a positive orderNumber'
  );
});

Then(
  'a {string} SSE event is broadcast to {string}',
  function (this: IntegrationWorld, eventName: string, _txosnaId: string): void {
    const calls = this.broadcastSpy.mock.calls;
    const found = calls.some((call) => call[0] === this.currentTxosna?.id && call[1] === eventName);
    assert.ok(
      found,
      `broadcast should have been called with (${this.currentTxosna?.id}, ${eventName}, ...)`
    );
  }
);

Then('the order has {int} tickets', async function (this: IntegrationWorld, count: number) {
  assert.ok(this.currentOrder, 'currentOrder must be set');
  const tickets = await ticketRepo.listByOrder(this.currentOrder.id);
  assert.equal(
    tickets.length,
    count,
    `order should have ${count} ticket(s), got ${tickets.length}`
  );
});

Then(
  'one ticket has counterType {string}',
  async function (this: IntegrationWorld, counterType: string) {
    assert.ok(this.currentOrder, 'currentOrder must be set');
    const tickets = await ticketRepo.listByOrder(this.currentOrder.id);
    const found = tickets.some((t) => t.counterType === counterType);
    assert.ok(found, `one ticket should have counterType ${counterType}`);
  }
);

Then(
  'the second order has an order number greater than the first',
  function (this: IntegrationWorld) {
    assert.equal(this.savedOrders.length, 2, 'should have 2 saved orders');
    assert.ok(
      this.savedOrders[1].orderNumber > this.savedOrders[0].orderNumber,
      'second order number should be greater than first'
    );
  }
);
