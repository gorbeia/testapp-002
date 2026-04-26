import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { POST as ordersPOST } from '../../../src/app/api/handlers/txosna-orders';
import { PATCH as ticketsPATCH } from '../../../src/app/api/handlers/ticket';
import { GET as txosnaTicketsGET } from '../../../src/app/api/handlers/txosna-tickets';
import { ticketRepo, orderRepo, _test_insertOrder } from '../../../src/test/store-setup';
import type { StoredOrder, StoredTicket, TicketStatus } from '../../../src/lib/store/types';
import type { IntegrationWorld } from './world';

function params(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

function ticketParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ===== Given steps =====

Given(
  'a confirmed order exists with a ticket in status {string}',
  async function (this: IntegrationWorld, status: string): Promise<void> {
    assert.ok(this.currentTxosna, 'currentTxosna must be set via Background');

    // Create a COUNTER order (which auto-creates RECEIVED tickets)
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

    // Load the first ticket
    const tickets = await ticketRepo.listByOrder(order.id);
    assert.ok(tickets.length > 0, 'order should have at least one ticket');
    this.currentTicket = tickets[0];

    // If status is not RECEIVED, advance the ticket
    if (status !== 'RECEIVED') {
      const ticketStatus = status as TicketStatus;
      this.currentTicket = await ticketRepo.update(this.currentTicket.id, {
        status: ticketStatus,
      });
    }
  }
);

Given(
  'the ticket is in status {string}',
  async function (this: IntegrationWorld, status: string): Promise<void> {
    assert.ok(this.currentTicket, 'currentTicket must be set');
    const ticketStatus = status as TicketStatus;
    this.currentTicket = await ticketRepo.update(this.currentTicket.id, {
      status: ticketStatus,
    });
  }
);

Given(
  'all tickets in the order are in status {string}',
  async function (this: IntegrationWorld, status: string): Promise<void> {
    assert.ok(this.currentOrder, 'currentOrder must be set');
    // Tickets are already in RECEIVED by default after order creation
    // This step just verifies the state
    const tickets = await ticketRepo.listByOrder(this.currentOrder.id);
    for (const ticket of tickets) {
      assert.equal(
        ticket.status,
        status,
        `ticket ${ticket.id} should be in status ${status}, got ${ticket.status}`
      );
    }
  }
);

Given(
  'there are FOOD tickets in {string} and DRINKS tickets in {string}',
  async function (this: IntegrationWorld, foodStatus: string, drinksStatus: string): Promise<void> {
    assert.ok(this.currentTxosna, 'currentTxosna must be set via Background');

    // Use existing mock products: prod-1 is FOOD (cat-1), prod-5 is DRINKS (cat-2)
    // Create an order with both food and drinks products
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
        {
          productId: 'prod-5',
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

    // Load tickets
    const tickets = await ticketRepo.listByOrder(order.id);
    assert.equal(tickets.length, 2, 'order should have 2 tickets (FOOD and DRINKS)');

    // Advance each ticket to the appropriate status
    const foodTicket = tickets.find((t) => t.counterType === 'FOOD');
    const drinksTicket = tickets.find((t) => t.counterType === 'DRINKS');

    assert.ok(foodTicket, 'should have a FOOD ticket');
    assert.ok(drinksTicket, 'should have a DRINKS ticket');

    if (foodStatus !== 'RECEIVED') {
      await ticketRepo.update(foodTicket.id, { status: foodStatus as TicketStatus });
    }

    if (drinksStatus !== 'RECEIVED') {
      await ticketRepo.update(drinksTicket.id, { status: drinksStatus as TicketStatus });
    }

    this.currentTicket = foodTicket;
  }
);

// ===== When steps =====

When(
  'I PATCH ticket status to {string}',
  async function (this: IntegrationWorld, status: string): Promise<void> {
    assert.ok(this.currentTicket, 'currentTicket must be set');

    const body = { status };
    const req = new Request(`http://localhost/api/tickets/${this.currentTicket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    this.lastResponse = await ticketsPATCH(req, ticketParams(this.currentTicket.id));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);

    if (this.lastResponse.status === 200) {
      this.currentTicket = this.lastBody as StoredTicket;
    }
  }
);

When(
  'I advance all tickets to {string}',
  async function (this: IntegrationWorld, status: string): Promise<void> {
    assert.ok(this.currentOrder, 'currentOrder must be set');

    const tickets = await ticketRepo.listByOrder(this.currentOrder.id);
    for (const ticket of tickets) {
      const body = { status };
      const req = new Request(`http://localhost/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      this.lastResponse = await ticketsPATCH(req, ticketParams(ticket.id));
      this.lastBody = await this.lastResponse
        .clone()
        .json()
        .catch(() => null);
    }
  }
);

When(
  'I request tickets for {string} with counterType {string} and status {string}',
  async function (
    this: IntegrationWorld,
    slug: string,
    counterType: string,
    status: string
  ): Promise<void> {
    const url = `http://localhost/api/txosnak/${slug}/tickets?counterType=${counterType}&status=${status}`;
    const req = new Request(url, { method: 'GET' });

    this.lastResponse = await txosnaTicketsGET(req, params(slug));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

// ===== Then steps =====

Then(
  'the ticket status is {string}',
  async function (this: IntegrationWorld, expectedStatus: string): Promise<void> {
    assert.ok(this.currentTicket, 'currentTicket must be set');

    // Re-fetch to get latest state
    const ticket = await ticketRepo.findById(this.currentTicket.id);
    assert.ok(ticket, 'ticket should exist');
    assert.equal(ticket.status, expectedStatus);
    this.currentTicket = ticket;
  }
);

Then(
  'a {string} SSE event is broadcast',
  function (this: IntegrationWorld, eventName: string): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calls = (global as any).broadcastCalls || [];
    const found = calls.some(
      (call: { txosnaId: string; eventName: string }) =>
        call.txosnaId === this.currentTxosna?.id && call.eventName === eventName
    );
    assert.ok(
      found,
      `broadcast should have been called with (${this.currentTxosna?.id}, ${eventName}, ...)`
    );
  }
);

Then('only FOOD tickets in RECEIVED status are returned', function (this: IntegrationWorld): void {
  const body = this.lastBody as { tickets: StoredTicket[] };
  assert.ok(Array.isArray(body.tickets), 'response should have tickets array');

  for (const ticket of body.tickets) {
    assert.equal(
      ticket.counterType,
      'FOOD',
      `ticket ${ticket.id} should be FOOD, got ${ticket.counterType}`
    );
    assert.equal(
      ticket.status,
      'RECEIVED',
      `ticket ${ticket.id} should be RECEIVED, got ${ticket.status}`
    );
  }

  assert.ok(body.tickets.length > 0, 'should return at least one FOOD ticket in RECEIVED');
});

// ===== Kitchen post steps =====

Given(
  'the txosna {string} has kitchen posts {string} and {string}',
  function (this: IntegrationWorld, _slug: string, _post1: string, _post2: string): void {
    // Kitchen posts are a runtime configuration detail; the store setup
    // does not require explicit registration for filter tests.
  }
);

Given(
  'a confirmed order exists with a {string} post ticket and an {string} post ticket both in {string}',
  async function (
    this: IntegrationWorld,
    post1: string,
    post2: string,
    status: string
  ): Promise<void> {
    assert.ok(this.currentTxosna, 'currentTxosna must be set via Background');

    const orderId = `order-post-${Date.now()}`;
    const orderNumber = await orderRepo.nextOrderNumber(this.currentTxosna.id);
    const now = new Date();

    const order = {
      id: orderId,
      orderNumber,
      txosnaId: this.currentTxosna.id,
      status: 'CONFIRMED' as const,
      cancellationReason: null,
      channel: 'COUNTER' as const,
      paymentMethod: 'CASH' as const,
      customerName: 'Test Customer',
      notes: null,
      total: 0,
      verificationCode: `TST-${orderNumber}`,
      registeredById: null,
      paymentSessionId: null,
      confirmedAt: now,
      expiresAt: null,
      pendingLines: null,
      createdAt: now,
      updatedAt: now,
    };
    _test_insertOrder(order);
    this.currentOrder = order;

    for (const post of [post1, post2]) {
      const ticket = await ticketRepo.create(orderId, this.currentTxosna.id, {
        counterType: 'FOOD',
        kitchenPost: post,
        requiresPreparation: true,
        notes: null,
        lines: [],
      });

      const ticketStatus = status as TicketStatus;
      const stored =
        ticketStatus !== 'RECEIVED'
          ? await ticketRepo.update(ticket.id, { status: ticketStatus })
          : ticket;

      this.namedTickets.set(post, stored);
    }
  }
);

When(
  'I request tickets for {string} with counterType {string} and kitchenPost {string}',
  async function (
    this: IntegrationWorld,
    slug: string,
    counterType: string,
    kitchenPost: string
  ): Promise<void> {
    const url = `http://localhost/api/txosnak/${slug}/tickets?counterType=${counterType}&kitchenPost=${kitchenPost}`;
    const req = new Request(url, { method: 'GET' });

    this.lastResponse = await txosnaTicketsGET(req, params(slug));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

When(
  'I advance the {string} post ticket to {string}',
  async function (this: IntegrationWorld, post: string, status: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).broadcastCalls = [];

    const ticket = this.namedTickets.get(post);
    assert.ok(ticket, `no ticket named "${post}" — check the Given setup step`);

    const body = { status };
    const req = new Request(`http://localhost/api/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    this.lastResponse = await ticketsPATCH(req, ticketParams(ticket.id));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);

    if (this.lastResponse.status === 200) {
      this.namedTickets.set(post, this.lastBody as StoredTicket);
    }
  }
);

Then('only the griddle post ticket is returned', function (this: IntegrationWorld): void {
  const body = this.lastBody as { tickets: StoredTicket[] };
  assert.ok(Array.isArray(body.tickets), 'response should have tickets array');
  assert.equal(body.tickets.length, 1, 'should return exactly one ticket');
  assert.equal(
    body.tickets[0].kitchenPost,
    'griddle',
    `ticket kitchenPost should be "griddle", got "${body.tickets[0].kitchenPost}"`
  );
});

Then(
  'no {string} SSE event is broadcast',
  function (this: IntegrationWorld, eventName: string): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calls = (global as any).broadcastCalls || [];
    const found = calls.some(
      (call: { txosnaId: string; eventName: string }) => call.eventName === eventName
    );
    assert.ok(!found, `broadcast should NOT have been called with event "${eventName}"`);
  }
);
