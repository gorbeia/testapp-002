import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { associationRepo, orderRepo, ticketBaiConfigRepo, ticketBaiInvoiceRepo } from '@/lib/store';
import type { TicketBaiProviderType, StoredOrder } from '@/lib/store/types';
import { issueTicketBaiInvoice } from '@/lib/ticketbai/service';
import {
  GET as tbaiConfigGet,
  PATCH as tbaiConfigPatch,
  POST as tbaiConfigTest,
} from '../../../src/app/api/associations/[associationId]/ticketbai/route';
import type { IntegrationWorld } from './world';

function assocParams(associationId: string) {
  return { params: Promise.resolve({ associationId }) };
}

// ===== Given steps =====

Given(
  'TicketBAI is enabled for association {string}',
  async function (this: IntegrationWorld, associationId: string) {
    await associationRepo.update(associationId, { ticketBaiEnabled: true });
  }
);

Given(
  'TicketBAI config for {string} has series {string} and providerType {string}',
  async function (
    this: IntegrationWorld,
    associationId: string,
    series: string,
    providerType: string
  ) {
    await ticketBaiConfigRepo.upsert(associationId, {
      series,
      providerType: providerType as TicketBaiProviderType,
    });
  }
);

// ===== When steps =====

When(
  'I GET TicketBAI config for association {string}',
  async function (this: IntegrationWorld, associationId: string) {
    this.lastResponse = await tbaiConfigGet(
      new Request('http://localhost'),
      assocParams(associationId)
    );
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

When(
  'I PATCH TicketBAI config for association {string} with series {string}',
  async function (this: IntegrationWorld, associationId: string, series: string) {
    this.lastResponse = await tbaiConfigPatch(
      new Request('http://localhost', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series }),
      }),
      assocParams(associationId)
    );
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

When(
  'I POST to test TicketBAI connection for association {string}',
  async function (this: IntegrationWorld, associationId: string) {
    this.lastResponse = await tbaiConfigTest(
      new Request('http://localhost', { method: 'POST' }),
      assocParams(associationId)
    );
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

When(
  'I issue a TicketBAI invoice for the first order of txosna {string}',
  async function (this: IntegrationWorld, txosnaId: string) {
    const orders = await orderRepo.listByTxosna(txosnaId);
    assert.ok(orders.length > 0, `txosna "${txosnaId}" should have at least one order`);
    this.currentOrder = orders[0] as StoredOrder;
    await issueTicketBaiInvoice(orders[0] as StoredOrder, 'assoc-1');
  }
);

When(
  'I issue TicketBAI invoices for {int} orders of txosna {string}',
  async function (this: IntegrationWorld, count: number, txosnaId: string) {
    const orders = await orderRepo.listByTxosna(txosnaId);
    assert.ok(orders.length >= count, `txosna "${txosnaId}" should have at least ${count} orders`);
    for (let i = 0; i < count; i++) {
      await issueTicketBaiInvoice(orders[i] as StoredOrder, 'assoc-1');
    }
  }
);

// ===== Then steps =====

Then(
  'the TicketBAI config has providerType {string} and series {string}',
  function (this: IntegrationWorld, providerType: string, series: string) {
    const body = this.lastBody as { providerType: string; series: string };
    assert.equal(
      body.providerType,
      providerType,
      `config providerType should be "${providerType}"`
    );
    assert.equal(body.series, series, `config series should be "${series}"`);
  }
);

Then('the TicketBAI config series is {string}', function (this: IntegrationWorld, series: string) {
  const body = this.lastBody as { series: string };
  assert.equal(body.series, series, `config series should be "${series}"`);
});

Then('the response body has ok: true', function (this: IntegrationWorld) {
  const body = this.lastBody as { ok: boolean };
  assert.equal(body.ok, true, 'response body should have ok: true');
});

Then('a TicketBAI invoice exists for that order', async function (this: IntegrationWorld) {
  assert.ok(this.currentOrder, 'currentOrder must be set');
  const invoice = await ticketBaiInvoiceRepo.findByOrder(this.currentOrder.id);
  assert.ok(invoice, `a TicketBAI invoice should exist for order "${this.currentOrder.id}"`);
});

Then('the invoice series is {string}', async function (this: IntegrationWorld, series: string) {
  assert.ok(this.currentOrder, 'currentOrder must be set');
  const invoice = await ticketBaiInvoiceRepo.findByOrder(this.currentOrder.id);
  assert.ok(invoice, 'invoice should exist');
  assert.equal(invoice.series, series, `invoice series should be "${series}"`);
});

Then(
  'the invoice qrUrl starts with {string}',
  async function (this: IntegrationWorld, prefix: string) {
    assert.ok(this.currentOrder, 'currentOrder must be set');
    const invoice = await ticketBaiInvoiceRepo.findByOrder(this.currentOrder.id);
    assert.ok(invoice, 'invoice should exist');
    assert.ok(invoice.qrUrl, 'invoice qrUrl should be set');
    assert.ok(
      invoice.qrUrl.startsWith(prefix),
      `invoice qrUrl should start with "${prefix}", got "${invoice.qrUrl}"`
    );
  }
);

Then(
  'the invoice numbers are {int} and {int}',
  async function (this: IntegrationWorld, num1: number, num2: number) {
    const allInvoices = await ticketBaiInvoiceRepo.listByAssociation('assoc-1');
    const numbers = allInvoices.map((i) => i.invoiceNumber).sort((a, b) => a - b);
    assert.deepEqual(numbers, [num1, num2], `invoice numbers should be [${num1}, ${num2}]`);
  }
);

Then('the two invoices have different chainIds', async function (this: IntegrationWorld) {
  const allInvoices = await ticketBaiInvoiceRepo.listByAssociation('assoc-1');
  assert.equal(allInvoices.length, 2, 'should have exactly 2 invoices');
  const [inv1, inv2] = allInvoices;
  assert.ok(inv1.chainId, 'first invoice should have a chainId');
  assert.ok(inv2.chainId, 'second invoice should have a chainId');
  assert.notEqual(inv1.chainId, inv2.chainId, 'the two invoices should have different chainIds');
});
