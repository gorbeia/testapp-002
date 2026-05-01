/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { NextRequest } from 'next/server';
import { GET as reportsGET } from '../../../src/app/api/handlers/txosna-reports';
import { _test_insertOrder, _test_insertTxosna } from '../../../src/test/store-setup';
import type { StoredOrder } from '../../../src/lib/store/types';
import type { IntegrationWorld } from './world';

function slugParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

// Factory to create test orders
function makeOrder(
  overrides: Partial<StoredOrder> & { id: string; txosnaId: string }
): StoredOrder {
  return {
    orderNumber: 1,
    status: 'CONFIRMED',
    cancellationReason: null,
    channel: 'COUNTER',
    paymentMethod: 'CASH',
    customerName: null,
    notes: null,
    total: 5.0,
    verificationCode: overrides.id,
    registeredById: null,
    paymentSessionId: null,
    confirmedAt: new Date(),
    expiresAt: null,
    pendingLines: null,
    fiscalReceiptRef: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ===== Given steps =====

Given(
  'the txosna {string} has {int} confirmed orders and {int} cancelled orders today',
  function (this: IntegrationWorld, slug: string, confirmedCount: number, cancelledCount: number) {
    // Create txosna if it doesn't exist
    if (!this.currentTxosna) {
      const txosna = {
        id: `test-txosna-${slug}`,
        slug,
        name: `Test Txosna (${slug})`,
        status: 'OPEN' as const,
        counterSetup: 'SINGLE' as const,
        waitMinutes: null,
        pinHash: '0000',
        enabledChannels: ['COUNTER', 'SELF_SERVICE'] as const,
        enabledPaymentMethods: ['CASH'] as const,
        pendingPaymentTimeout: 15,
        printingEnabled: false,
        associationId: 'assoc-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      _test_insertTxosna(txosna as any);

      this.currentTxosna = txosna as any;
    }

    const totalCount = confirmedCount + cancelledCount;
    let orderNumber = 1;

    // Create confirmed orders
    for (let i = 0; i < confirmedCount; i++) {
      const order = makeOrder({
        id: `test-order-confirmed-${i}`,
        txosnaId: this.currentTxosna!.id,
        orderNumber: orderNumber++,
        status: 'CONFIRMED',
        total: 5.0,
        createdAt: new Date(),
      });
      _test_insertOrder(order);
    }

    // Create cancelled orders
    for (let i = 0; i < cancelledCount; i++) {
      const order = makeOrder({
        id: `test-order-cancelled-${i}`,
        txosnaId: this.currentTxosna!.id,
        orderNumber: orderNumber++,
        status: 'CANCELLED',
        cancellationReason: 'CUSTOMER',
        total: 5.0,
        createdAt: new Date(),
      });
      _test_insertOrder(order);
    }

    // Track state for later assertions
    (this as any)._todayOrderCount = totalCount;
    (this as any)._baseRevenue = confirmedCount * 5.0;
  }
);

Given(
  'an order contains a product with a variant adding €{float}',
  function (this: IntegrationWorld, delta: number) {
    assert.ok(this.currentTxosna, 'currentTxosna must be set');
    const variantTotal = 5.0 + delta;
    const order = makeOrder({
      id: `test-order-variant-${Date.now()}`,
      txosnaId: this.currentTxosna.id,
      status: 'CONFIRMED',
      total: variantTotal,
      createdAt: new Date(),
    });
    _test_insertOrder(order);

    // Track expected revenue
    const baseRevenue = (this as any)._baseRevenue ?? 0;
    (this as any)._expectedRevenue = baseRevenue + variantTotal;
  }
);

Given('there are {int} orders created yesterday', function (this: IntegrationWorld, count: number) {
  assert.ok(this.currentTxosna, 'currentTxosna must be set');

  // Calculate yesterday's start time (midnight)
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  for (let i = 0; i < count; i++) {
    const order = makeOrder({
      id: `test-order-yesterday-${i}`,
      txosnaId: this.currentTxosna.id,
      status: 'CONFIRMED',
      total: 5.0,
      createdAt: yesterday,
    });
    _test_insertOrder(order);
  }
});

// ===== When steps =====

When(
  'I request reports for {string} with period {string}',
  async function (this: IntegrationWorld, slug: string, period: string) {
    const req = new NextRequest(`http://localhost/api/txosnak/${slug}/reports?period=${period}`, {
      method: 'GET',
    });

    this.lastResponse = await reportsGET(req, slugParams(slug));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

When('I request the report', async function (this: IntegrationWorld) {
  assert.ok(this.currentTxosna, 'currentTxosna must be set');
  const req = new NextRequest(
    `http://localhost/api/txosnak/${this.currentTxosna.slug}/reports?period=today`,
    { method: 'GET' }
  );

  this.lastResponse = await reportsGET(req, slugParams(this.currentTxosna.slug));
  this.lastBody = await this.lastResponse
    .clone()
    .json()
    .catch(() => null);
});

// ===== Then steps =====

Then('ordersTotal is {int}', function (this: IntegrationWorld, expected: number) {
  const body = this.lastBody as { ordersTotal: number };
  assert.equal(body.ordersTotal, expected, `ordersTotal should be ${expected}`);
});

Then('ordersConfirmed is {int}', function (this: IntegrationWorld, expected: number) {
  const body = this.lastBody as { ordersConfirmed: number };
  assert.equal(body.ordersConfirmed, expected, `ordersConfirmed should be ${expected}`);
});

Then('ordersCancelled is {int}', function (this: IntegrationWorld, expected: number) {
  const body = this.lastBody as { ordersCancelled: number };
  assert.equal(body.ordersCancelled, expected, `ordersCancelled should be ${expected}`);
});

Then('revenue reflects the variant price delta', function (this: IntegrationWorld) {
  const body = this.lastBody as { revenue: number };
  const expectedRevenue = (this as any)._expectedRevenue;
  assert.ok(
    expectedRevenue !== undefined,
    'expected revenue should be tracked from variant Given step'
  );
  assert.equal(body.revenue, expectedRevenue, `revenue should be ${expectedRevenue}`);
});

Then("ordersTotal does not include yesterday's orders", function (this: IntegrationWorld) {
  const body = this.lastBody as { ordersTotal: number };
  const todayOrderCount = (this as any)._todayOrderCount;
  assert.ok(todayOrderCount !== undefined, 'today order count should be tracked');
  assert.equal(body.ordersTotal, todayOrderCount, `ordersTotal should only include today's orders`);
});
