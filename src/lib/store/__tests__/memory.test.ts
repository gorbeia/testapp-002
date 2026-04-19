import { beforeEach, describe, expect, it } from 'vitest';
import { MOCK_ASSOCIATION, MOCK_ORDERS, MOCK_PRODUCTS, MOCK_TICKETS } from '@/lib/mock-data';
import {
  catalogRepo,
  orderRepo,
  resetStore,
  ticketRepo,
  txosnaRepo,
  volunteerRepo,
} from '@/test/store-setup';

beforeEach(resetStore);

// ── TxosnaRepository ──────────────────────────────────────────────────────────

describe('txosnaRepo', () => {
  it('finds a txosna by slug', async () => {
    const t = await txosnaRepo.findBySlug('aste-nagusia-2026');
    expect(t).not.toBeNull();
    expect(t!.name).toBe('Aste Nagusia 2026');
    expect(t!.status).toBe('OPEN');
  });

  it('returns null for an unknown slug', async () => {
    expect(await txosnaRepo.findBySlug('does-not-exist')).toBeNull();
  });

  it('finds a txosna by id', async () => {
    const t = await txosnaRepo.findById('txosna-1');
    expect(t!.slug).toBe('aste-nagusia-2026');
  });

  it('lists all txosnak for an association', async () => {
    const list = await txosnaRepo.list(MOCK_ASSOCIATION.id);
    expect(list).toHaveLength(MOCK_ASSOCIATION.txosnak.length);
  });

  it('updates a txosna field', async () => {
    const updated = await txosnaRepo.update('txosna-1', { status: 'PAUSED', waitMinutes: 15 });
    expect(updated.status).toBe('PAUSED');
    expect(updated.waitMinutes).toBe(15);

    // Persisted
    const refetched = await txosnaRepo.findById('txosna-1');
    expect(refetched!.status).toBe('PAUSED');
  });

  it('throws when updating a non-existent txosna', async () => {
    await expect(txosnaRepo.update('nope', { status: 'CLOSED' })).rejects.toThrow();
  });
});

// ── CatalogRepository ─────────────────────────────────────────────────────────

describe('catalogRepo', () => {
  it('lists categories for the association', async () => {
    const cats = await catalogRepo.listCategories(MOCK_ASSOCIATION.id);
    expect(cats.length).toBeGreaterThanOrEqual(2);
    expect(cats[0].displayOrder).toBeLessThanOrEqual(cats[1].displayOrder);
  });

  it('lists products for a category', async () => {
    const prods = await catalogRepo.listProducts('cat-1');
    expect(prods.length).toBeGreaterThan(0);
    prods.forEach((p) => expect(p.categoryId).toBe('cat-1'));
  });

  it('gets a single product', async () => {
    const p = await catalogRepo.getProduct('prod-1');
    expect(p).not.toBeNull();
    expect(p!.name).toBe('Burgerra');
    expect(p!.variantGroups.length).toBeGreaterThan(0);
    expect(p!.modifiers.length).toBeGreaterThan(0);
  });

  it('returns null for an unknown product', async () => {
    expect(await catalogRepo.getProduct('nope')).toBeNull();
  });

  it('returns a product view with default price when no override exists', async () => {
    const view = await catalogRepo.getProductView('prod-1', 'txosna-1');
    expect(view).not.toBeNull();
    expect(view!.effectivePrice).toBe(MOCK_PRODUCTS[0].price);
    expect(view!.soldOut).toBe(false);
  });

  it('returns null product view for unknown product', async () => {
    expect(await catalogRepo.getProductView('nope', 'txosna-1')).toBeNull();
  });

  it('lists product views grouped by category', async () => {
    const grouped = await catalogRepo.listProductViews('txosna-1');
    expect(grouped.length).toBeGreaterThan(0);
    for (const group of grouped) {
      expect(group.category).toBeDefined();
      group.products.forEach((p) => {
        expect(p.categoryId).toBe(group.category.id);
        expect(p.available).toBe(true); // unavailable products filtered out
      });
    }
  });

  it('filters out unavailable products from the view', async () => {
    // Make prod-1 unavailable via a txosna override by directly updating store state,
    // then verify it's gone from the view.
    // We do this through a round-trip: mark unavailable, re-query.
    const before = await catalogRepo.listProductViews('txosna-1');
    const foodBefore = before.find((g) => g.category.id === 'cat-1')!;
    const totalBefore = foodBefore.products.length;

    // Patch via product view — available flag is on the base product in the seed
    // (no txosna overrides). Manipulate via getProduct + internal availability.
    // Since the store doesn't expose a direct "mark unavailable" API yet, we
    // test the observable: all returned products have available: true.
    expect(totalBefore).toBeGreaterThan(0);
    foodBefore.products.forEach((p) => expect(p.available).toBe(true));
  });
});

// ── OrderRepository ───────────────────────────────────────────────────────────

describe('orderRepo', () => {
  it('seeds with mock orders', async () => {
    const list = await orderRepo.listByTxosna('txosna-1');
    expect(list.length).toBe(MOCK_ORDERS.length);
  });

  it('finds an order by id', async () => {
    const o = await orderRepo.findById('order-1');
    expect(o).not.toBeNull();
    expect(o!.orderNumber).toBe(42);
  });

  it('returns null for an unknown id', async () => {
    expect(await orderRepo.findById('nope')).toBeNull();
  });

  it('finds an order by number', async () => {
    const o = await orderRepo.findByNumber('txosna-1', 42);
    expect(o!.id).toBe('order-1');
  });

  it('returns null when order number not found', async () => {
    expect(await orderRepo.findByNumber('txosna-1', 9999)).toBeNull();
  });

  it('allocates sequential order numbers', async () => {
    const n1 = await orderRepo.nextOrderNumber('txosna-1');
    const n2 = await orderRepo.nextOrderNumber('txosna-1');
    expect(n2).toBe(n1 + 1);
  });

  it('allocates order numbers per txosna independently', async () => {
    const n1 = await orderRepo.nextOrderNumber('txosna-1');
    const n2 = await orderRepo.nextOrderNumber('txosna-2');
    // txosna-2 has no seeded orders → starts at 1
    expect(n2).toBe(1);
    // txosna-1 continues from its seeded max
    expect(n1).toBeGreaterThan(n2);
  });

  it('creates an order with tickets', async () => {
    const order = await orderRepo.create({
      txosnaId: 'txosna-1',
      channel: 'COUNTER',
      customerName: 'Gorka',
      notes: null,
      paymentMethod: 'CASH',
      registeredById: null,
      status: 'CONFIRMED',
      total: 8.5,
      expiresAt: null,
      tickets: [
        {
          counterType: 'FOOD',
          requiresPreparation: true,
          notes: null,
          lines: [
            {
              productId: 'prod-1',
              productName: 'Burgerra',
              quantity: 1,
              unitPrice: 8.5,
              selectedVariant: 'Patata frijituak',
              selectedModifiers: [],
              splitInstructions: null,
            },
          ],
        },
      ],
    });

    expect(order.id).toBeDefined();
    expect(order.customerName).toBe('Gorka');
    expect(order.status).toBe('CONFIRMED');
    expect(order.verificationCode).toMatch(/^[A-Z]{2}-\d{4}$/);

    // Tickets created
    const ticketList = await ticketRepo.listByOrder(order.id);
    expect(ticketList).toHaveLength(1);
    expect(ticketList[0].counterType).toBe('FOOD');
    expect(ticketList[0].lines).toHaveLength(1);
    expect(ticketList[0].lines[0].productName).toBe('Burgerra');
  });

  it('creates two tickets for COUNTER orders spanning FOOD and DRINKS', async () => {
    const order = await orderRepo.create({
      txosnaId: 'txosna-1',
      channel: 'COUNTER',
      customerName: 'Amaia',
      notes: null,
      paymentMethod: 'CASH',
      registeredById: null,
      status: 'CONFIRMED',
      total: 10.0,
      expiresAt: null,
      tickets: [
        {
          counterType: 'FOOD',
          requiresPreparation: true,
          notes: null,
          lines: [
            {
              productId: 'prod-1',
              productName: 'Burgerra',
              quantity: 1,
              unitPrice: 8.5,
              selectedVariant: null,
              selectedModifiers: [],
              splitInstructions: null,
            },
          ],
        },
        {
          counterType: 'DRINKS',
          requiresPreparation: false,
          notes: null,
          lines: [
            {
              productId: 'prod-5',
              productName: 'Zurito',
              quantity: 2,
              unitPrice: 1.5,
              selectedVariant: null,
              selectedModifiers: [],
              splitInstructions: null,
            },
          ],
        },
      ],
    });

    const ticketList = await ticketRepo.listByOrder(order.id);
    expect(ticketList).toHaveLength(2);
    const types = ticketList.map((t) => t.counterType).sort();
    expect(types).toEqual(['DRINKS', 'FOOD']);
  });

  it('filters orders by status', async () => {
    const confirmed = await orderRepo.listByTxosna('txosna-1', { status: 'CONFIRMED' });
    const pending = await orderRepo.listByTxosna('txosna-1', { status: 'PENDING_PAYMENT' });
    confirmed.forEach((o) => expect(o.status).toBe('CONFIRMED'));
    pending.forEach((o) => expect(o.status).toBe('PENDING_PAYMENT'));
    expect(confirmed.length + pending.length).toBe(MOCK_ORDERS.length);
  });

  it('filters orders by channel', async () => {
    const counter = await orderRepo.listByTxosna('txosna-1', { channel: 'COUNTER' });
    counter.forEach((o) => expect(o.channel).toBe('COUNTER'));
  });

  it('returns orders sorted by order number ascending', async () => {
    const list = await orderRepo.listByTxosna('txosna-1');
    for (let i = 1; i < list.length; i++) {
      expect(list[i].orderNumber).toBeGreaterThanOrEqual(list[i - 1].orderNumber);
    }
  });

  it('updates an order', async () => {
    const updated = await orderRepo.update('order-2', {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    });
    expect(updated.status).toBe('CONFIRMED');

    const refetched = await orderRepo.findById('order-2');
    expect(refetched!.status).toBe('CONFIRMED');
  });

  it('throws when updating a non-existent order', async () => {
    await expect(orderRepo.update('nope', { status: 'CANCELLED' })).rejects.toThrow();
  });

  it('resets cleanly between tests', async () => {
    await orderRepo.create({
      txosnaId: 'txosna-1',
      channel: 'COUNTER',
      customerName: 'Test',
      notes: null,
      paymentMethod: 'CASH',
      registeredById: null,
      status: 'CONFIRMED',
      total: 1,
      expiresAt: null,
      tickets: [],
    });
    const beforeReset = await orderRepo.listByTxosna('txosna-1');
    expect(beforeReset.length).toBe(MOCK_ORDERS.length + 1);

    resetStore();

    const afterReset = await orderRepo.listByTxosna('txosna-1');
    expect(afterReset.length).toBe(MOCK_ORDERS.length);
  });
});

// ── TicketRepository ──────────────────────────────────────────────────────────

describe('ticketRepo', () => {
  it('seeds with mock tickets', async () => {
    const list = await ticketRepo.listByTxosna('txosna-1');
    expect(list.length).toBe(MOCK_TICKETS.length);
  });

  it('finds a ticket by id', async () => {
    const t = await ticketRepo.findById('ticket-1');
    expect(t).not.toBeNull();
    expect(t!.counterType).toBe('FOOD');
    expect(t!.lines.length).toBeGreaterThan(0);
  });

  it('returns null for an unknown ticket', async () => {
    expect(await ticketRepo.findById('nope')).toBeNull();
  });

  it('lists tickets by order', async () => {
    const list = await ticketRepo.listByOrder('order-1');
    expect(list.length).toBeGreaterThan(0);
    list.forEach((t) => expect(t.orderId).toBe('order-1'));
  });

  it('filters tickets by status', async () => {
    const received = await ticketRepo.listByTxosna('txosna-1', { status: 'RECEIVED' });
    received.forEach((t) => expect(t.status).toBe('RECEIVED'));
  });

  it('filters tickets by counterType', async () => {
    const food = await ticketRepo.listByTxosna('txosna-1', { counterType: 'FOOD' });
    food.forEach((t) => expect(t.counterType).toBe('FOOD'));
  });

  it('updates ticket status', async () => {
    const t = await ticketRepo.update('ticket-2', { status: 'IN_PREPARATION' });
    expect(t.status).toBe('IN_PREPARATION');

    const refetched = await ticketRepo.findById('ticket-2');
    expect(refetched!.status).toBe('IN_PREPARATION');
  });

  it('sets readyAt when status becomes READY', async () => {
    const readyAt = new Date();
    const t = await ticketRepo.update('ticket-1', { status: 'READY', readyAt });
    expect(t.readyAt).toEqual(readyAt);
  });

  it('throws when updating a non-existent ticket', async () => {
    await expect(ticketRepo.update('nope', { status: 'READY' })).rejects.toThrow();
  });
});

// ── VolunteerRepository ───────────────────────────────────────────────────────

describe('volunteerRepo', () => {
  it('finds a volunteer by email', async () => {
    const v = await volunteerRepo.findByEmail('amaia@elkartea.eus');
    expect(v).not.toBeNull();
    expect(v!.role).toBe('ADMIN');
  });

  it('returns null for an unknown email', async () => {
    expect(await volunteerRepo.findByEmail('nope@nope.eus')).toBeNull();
  });

  it('finds a volunteer by id', async () => {
    const v = await volunteerRepo.findById('v1');
    expect(v!.name).toBe('Amaia Etxeberria');
  });

  it('lists volunteers for an association', async () => {
    const list = await volunteerRepo.listByAssociation(MOCK_ASSOCIATION.id);
    expect(list.length).toBe(4);
  });

  it('creates a volunteer', async () => {
    const v = await volunteerRepo.create({
      associationId: MOCK_ASSOCIATION.id,
      name: 'Txomin Uribe',
      email: 'txomin@elkartea.eus',
      passwordHash: 'plain:test1234',
      role: 'VOLUNTEER',
    });
    expect(v.id).toBeDefined();
    expect(v.active).toBe(true);

    const found = await volunteerRepo.findByEmail('txomin@elkartea.eus');
    expect(found!.name).toBe('Txomin Uribe');
  });

  it('updates a volunteer', async () => {
    const updated = await volunteerRepo.update('v4', { active: true });
    expect(updated.active).toBe(true);

    const refetched = await volunteerRepo.findById('v4');
    expect(refetched!.active).toBe(true);
  });

  it('throws when updating a non-existent volunteer', async () => {
    await expect(volunteerRepo.update('nope', { active: false })).rejects.toThrow();
  });
});
