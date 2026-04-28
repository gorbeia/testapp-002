import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { POST as ordersPOST } from '../../../src/app/api/handlers/txosna-orders';
import { POST as confirmPOST } from '../../../src/app/api/handlers/order-confirm';
import { POST as cancelPOST } from '../../../src/app/api/handlers/order-cancel';
import { orderRepo, ticketRepo } from '../../../src/test/store-setup';
import type { StoredOrder } from '../../../src/lib/store/types';
import type { IntegrationWorld } from './world';

function params(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

function orderParams(orderId: string) {
  return { params: Promise.resolve({ orderId }) };
}

// ===== Given steps =====

Given('a PENDING_PAYMENT order exists', async function (this: IntegrationWorld): Promise<void> {
  assert.ok(this.currentTxosna, 'currentTxosna must be set via Background');

  const body = {
    channel: 'SELF_SERVICE',
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
  }
});

Given(
  'a PENDING_PAYMENT order exists with expiresAt in the past',
  async function (this: IntegrationWorld): Promise<void> {
    // First create a pending order
    assert.ok(this.currentTxosna, 'currentTxosna must be set via Background');

    const body = {
      channel: 'SELF_SERVICE',
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
      const order = this.lastBody as StoredOrder;
      // Set expiresAt to the past
      const expiredOrder = await orderRepo.update(order.id, {
        expiresAt: new Date(0),
      });
      this.currentOrder = expiredOrder;
    }
  }
);

// ===== When steps =====

When(
  'I submit a SELF_SERVICE order for {string} with paymentMethod {string}',
  async function (this: IntegrationWorld, slug: string, paymentMethod: string): Promise<void> {
    const body = {
      channel: 'SELF_SERVICE',
      customerName: null,
      notes: null,
      paymentMethod,
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
    }
  }
);

When('I POST to confirm the order', async function (this: IntegrationWorld): Promise<void> {
  assert.ok(this.currentOrder, 'currentOrder must be set');

  const req = new Request(`http://localhost/api/orders/${this.currentOrder.id}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  this.lastResponse = await confirmPOST(req, orderParams(this.currentOrder.id));
  this.lastBody = await this.lastResponse
    .clone()
    .json()
    .catch(() => null);

  if (this.lastResponse.status === 200) {
    this.currentOrder = this.lastBody as StoredOrder;
  }
});

When(
  'I POST to cancel the order with reason {string}',
  async function (this: IntegrationWorld, reason: string): Promise<void> {
    assert.ok(this.currentOrder, 'currentOrder must be set');

    const req = new Request(`http://localhost/api/orders/${this.currentOrder.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });

    this.lastResponse = await cancelPOST(req, orderParams(this.currentOrder.id));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);

    if (this.lastResponse.status === 200) {
      this.currentOrder = this.lastBody as StoredOrder;
    }
  }
);

// ===== Then steps =====

Then('no tickets are created yet', async function (this: IntegrationWorld) {
  assert.ok(this.currentOrder, 'currentOrder must be set');
  const tickets = await ticketRepo.listByOrder(this.currentOrder.id);
  assert.equal(tickets.length, 0, 'order should have no tickets yet');
});

Then('tickets are created', async function (this: IntegrationWorld) {
  assert.ok(this.currentOrder, 'currentOrder must be set');
  const tickets = await ticketRepo.listByOrder(this.currentOrder.id);
  assert.ok(tickets.length > 0, 'order should have tickets');
});

Then('the cancellation reason is {string}', function (this: IntegrationWorld, reason: string) {
  assert.ok(this.currentOrder, 'currentOrder must be set');
  assert.equal(this.currentOrder.cancellationReason, reason);
});
