/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { NextRequest } from 'next/server';
import { POST as sessionPOST } from '../../../src/app/api/payments/session/route';
import { POST as webhookPOST } from '../../../src/app/api/payments/webhook/[provider]/route';
import { orderRepo, ticketRepo, _test_insertOrder } from '../../../src/test/store-setup';
import type { StoredOrder } from '../../../src/lib/store/types';
import type { IntegrationWorld } from './world';

function providerParams(provider: string) {
  return { params: Promise.resolve({ provider }) };
}

// Factory to create a PENDING_PAYMENT order with ONLINE payment method
function makeOnlineOrder(
  overrides: Partial<StoredOrder> & { id: string; txosnaId: string }
): StoredOrder {
  return {
    orderNumber: 1,
    status: 'PENDING_PAYMENT',
    cancellationReason: null,
    channel: 'SELF_SERVICE',
    paymentMethod: 'ONLINE',
    customerName: null,
    notes: null,
    total: 25.0,
    verificationCode: overrides.id,
    registeredById: null,
    paymentSessionId: null,
    confirmedAt: null,
    expiresAt: new Date(Date.now() + 30 * 60_000), // 30 minutes from now
    pendingLines: [
      {
        counterType: 'FOOD',
        requiresPreparation: true,
        notes: null,
        lines: [
          {
            productId: 'prod-1',
            productName: 'Test Product',
            unitPrice: 25.0,
            quantity: 1,
            selectedVariant: null,
            selectedModifiers: [],
            splitInstructions: null,
          },
        ],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ===== Given steps =====

Given('the payment provider is the FakePaymentProvider', function (this: IntegrationWorld) {
  // The fake payment provider is already set up globally via register-mocks.js
  // This step just ensures it's active (it already is)
  const fakeProvider = (global as any).fakePaymentProvider;
  assert.ok(fakeProvider, 'fakePaymentProvider should be available');
});

Given(
  'a PENDING_PAYMENT order {string} exists',
  async function (this: IntegrationWorld, orderName: string) {
    assert.ok(this.currentTxosna, 'currentTxosna must be set via Background');

    const order = makeOnlineOrder({
      id: orderName,
      txosnaId: this.currentTxosna.id,
    });

    _test_insertOrder(order);
    this.namedOrders.set(orderName, order);
    this.currentOrder = order;
  }
);

Given(
  'order {string} has paymentSessionId {string}',
  async function (this: IntegrationWorld, orderName: string, sessionId: string) {
    let order = this.namedOrders.get(orderName);
    assert.ok(order, `order ${orderName} must exist`);

    order = await orderRepo.update(order.id, { paymentSessionId: sessionId });
    this.namedOrders.set(orderName, order);
    this.currentOrder = order;
  }
);

// ===== When steps =====

When(
  'I POST to \\/payments\\/session with orderId {string}',
  async function (this: IntegrationWorld, orderName: string) {
    const order = this.namedOrders.get(orderName) ?? this.currentOrder;
    assert.ok(order, `order ${orderName} must exist`);

    const body = { orderId: order.id };

    const req = new NextRequest('http://localhost/api/payments/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    this.lastResponse = await sessionPOST(req);
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);

    // Re-fetch order to get updated paymentSessionId
    if (this.lastResponse.status === 200) {
      const updatedOrder = await orderRepo.findById(order.id);
      assert.ok(updatedOrder, 'order should still exist after session creation');
      this.namedOrders.set(orderName, updatedOrder);
      this.currentOrder = updatedOrder;
    }
  }
);

When(
  'I POST a Stripe webhook event {string} for session {string}',
  async function (this: IntegrationWorld, eventType: string, sessionId: string) {
    // Queue the webhook event on the fake payment provider
    const fakeProvider = (global as any).fakePaymentProvider;
    assert.ok(fakeProvider, 'fakePaymentProvider should be available');

    const status = eventType === 'checkout.session.completed' ? 'succeeded' : 'cancelled';

    // Find the order by sessionId to get the orderId
    const order = await orderRepo.findByPaymentSessionId(sessionId);
    assert.ok(order, `order with paymentSessionId ${sessionId} should exist`);

    fakeProvider.setNextWebhookEvent({
      sessionId,
      status,
      amount: Math.round(order.total * 100), // Convert to cents
      currency: 'EUR',
      method: 'CARD',
    });

    // POST the webhook
    const req = new Request('http://localhost/api/payments/webhook/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    this.lastResponse = await webhookPOST(req, providerParams('stripe'));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);

    // Re-fetch order to get updated status
    const updatedOrder = await orderRepo.findById(order.id);
    assert.ok(updatedOrder, 'order should still exist after webhook');
    this.currentOrder = updatedOrder;

    // Update named order if it was stored
    for (const [name, namedOrder] of this.namedOrders.entries()) {
      if (namedOrder.id === order.id) {
        this.namedOrders.set(name, updatedOrder);
      }
    }
  }
);

When(
  'I POST a Stripe webhook with an invalid stripe-signature header',
  async function (this: IntegrationWorld) {
    const fakeProvider = (global as any).fakePaymentProvider;
    assert.ok(fakeProvider, 'fakePaymentProvider should be available');

    // Set up the provider to throw on verification
    fakeProvider.setThrowOnVerify('Invalid signature');

    // POST the webhook with any body
    const req = new Request('http://localhost/api/payments/webhook/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'invalid-signature',
      },
      body: JSON.stringify({}),
    });

    this.lastResponse = await webhookPOST(req, providerParams('stripe'));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

// ===== Then steps =====

Then('the response contains a redirectUrl', function (this: IntegrationWorld) {
  const body = this.lastBody as { url?: string };
  assert.ok(body.url, 'response body should contain url (redirectUrl)');
});

Then('the order has a paymentSessionId stored', async function (this: IntegrationWorld) {
  assert.ok(this.currentOrder, 'currentOrder must be set');
  assert.ok(this.currentOrder.paymentSessionId, 'order should have paymentSessionId stored');
});

Then('tickets are created for the order', async function (this: IntegrationWorld) {
  assert.ok(this.currentOrder, 'currentOrder must be set');
  const tickets = await ticketRepo.listByOrder(this.currentOrder.id);
  assert.ok(tickets.length > 0, 'order should have tickets');
});
