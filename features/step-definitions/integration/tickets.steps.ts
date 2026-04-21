import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { POST as ordersPOST } from '../../../src/app/api/txosnak/[slug]/orders/route';
import { PATCH as ticketsPATCH } from '../../../src/app/api/tickets/[id]/route';
import { GET as txosnaTicketsGET } from '../../../src/app/api/txosnak/[slug]/tickets/route';
import { ticketRepo } from '../../../src/test/store-setup';
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

  // All returned tickets should be FOOD and RECEIVED
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

  // Should have at least one ticket
  assert.ok(body.tickets.length > 0, 'should return at least one FOOD ticket in RECEIVED');
});
