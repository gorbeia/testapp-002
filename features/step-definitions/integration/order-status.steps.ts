import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { GET as ordersGET } from '../../../src/app/api/orders/[orderId]/route';
import { POST as ordersPOST } from '../../../src/app/api/txosnak/[slug]/orders/route';
import { orderRepo } from '../../../src/test/store-setup';
import type { StoredOrder } from '../../../src/lib/store/types';
import type { IntegrationWorld } from './world';

function params(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

// ===== Given steps =====

Given(
  'a confirmed order exists with id {string}',
  async function (this: IntegrationWorld, orderId: string): Promise<void> {
    assert.ok(this.currentTxosna, 'currentTxosna must be set via Background');

    // Create a COUNTER order
    const body = {
      channel: 'COUNTER',
      customerName: 'Test Customer',
      notes: null,
      paymentMethod: 'CASH' as const,
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

    const response = await ordersPOST(req, params(this.currentTxosna.slug));
    const order = (await response.clone().json()) as StoredOrder;

    this.currentOrder = order;
    if (!this.namedOrders) this.namedOrders = new Map();
    this.namedOrders.set(orderId, order);
  }
);

Given(
  'an order exists with verificationCode {string}',
  async function (this: IntegrationWorld, verificationCode: string): Promise<void> {
    assert.ok(this.currentTxosna, 'currentTxosna must be set via Background');

    // Create a COUNTER order
    const body = {
      channel: 'COUNTER',
      customerName: 'Test Customer',
      notes: null,
      paymentMethod: 'CASH' as const,
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

    const response = await ordersPOST(req, params(this.currentTxosna.slug));
    const order = (await response.clone().json()) as StoredOrder;

    // Update the order with the specific verification code
    const updated = await orderRepo.update(order.id, { verificationCode });
    this.currentOrder = updated;
  }
);

// ===== When steps =====

When(
  'I request order {string}',
  async function (this: IntegrationWorld, orderLabel: string): Promise<void> {
    // Resolve the order ID: either from namedOrders or use the label literally
    let orderId: string;
    if (this.namedOrders?.has(orderLabel)) {
      orderId = this.namedOrders.get(orderLabel)!.id;
    } else {
      orderId = orderLabel; // Use literal string (e.g. "order-does-not-exist")
    }

    const url = `http://localhost/api/orders/${orderId}`;
    const req = new Request(url, { method: 'GET' });

    this.lastResponse = await ordersGET(req, { params: Promise.resolve({ orderId }) });
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

When(
  'I request the order by txosnaId, orderNumber, and verificationCode {string}',
  async function (this: IntegrationWorld, wrongVerificationCode: string): Promise<void> {
    assert.ok(this.currentOrder, 'currentOrder must be set');
    assert.ok(this.currentTxosna, 'currentTxosna must be set');

    const url = `http://localhost/api/orders/${this.currentOrder.id}?txosnaId=${this.currentTxosna.id}&orderNumber=${this.currentOrder.orderNumber}&verificationCode=${wrongVerificationCode}`;
    const req = new Request(url, { method: 'GET' });

    this.lastResponse = await ordersGET(req, {
      params: Promise.resolve({ orderId: this.currentOrder.id }),
    });
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

// ===== Then steps =====

Then(
  'the response includes orderNumber and verificationCode',
  function (this: IntegrationWorld): void {
    assert.ok(this.lastBody, 'lastBody must be set');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = this.lastBody as any;
    assert.ok(typeof body.orderNumber === 'number', 'response should include orderNumber');
    assert.ok(
      typeof body.verificationCode === 'string',
      'response should include verificationCode'
    );
  }
);
