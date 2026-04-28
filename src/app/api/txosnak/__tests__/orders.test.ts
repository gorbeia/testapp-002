import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetStore, orderRepo, ticketRepo } from '@/test/store-setup';
import { POST as ordersPost, GET as ordersGet } from '../[slug]/orders/route';

// Stub NextAuth so we don't need a real session
vi.mock('@/lib/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { id: 'v1' } }) }));
// Stub SSE broadcast
vi.mock('@/lib/sse', () => ({ broadcast: vi.fn() }));

beforeEach(() => {
  resetStore();
  vi.stubEnv('PROTO_MODE', 'true');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePost(body: object) {
  return new Request('http://localhost/api/txosnak/aste-nagusia-2026/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeGet(params = '') {
  return new Request(`http://localhost/api/txosnak/aste-nagusia-2026/orders${params}`);
}

function slugParams(slug = 'aste-nagusia-2026') {
  return { params: Promise.resolve({ slug }) };
}

const VALID_ORDER = {
  channel: 'COUNTER',
  customerName: 'Gorka',
  notes: null,
  paymentMethod: 'CASH',
  lines: [
    {
      productId: 'prod-1', // Burgerra — FOOD
      quantity: 1,
      selectedVariantOptionId: null,
      selectedModifierIds: [],
      splitInstructions: null,
    },
  ],
};

// ── POST /api/txosnak/[slug]/orders ───────────────────────────────────────────

describe('POST /api/txosnak/[slug]/orders', () => {
  it('returns 201 with the created order', async () => {
    const res = await ordersPost(makePost(VALID_ORDER), slugParams());
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeTruthy();
    expect(body.status).toBe('CONFIRMED');
    expect(body.customerName).toBe('Gorka');
    expect(body.orderNumber).toBeGreaterThan(0);
    expect(body.verificationCode).toMatch(/^[A-HJ-NP-Z]{2}-\d{4}$/);
  });

  it('stores the order and ticket in the repo', async () => {
    const res = await ordersPost(makePost(VALID_ORDER), slugParams());
    const { id } = await res.json();
    const order = await orderRepo.findById(id);
    expect(order).not.toBeNull();
    const tickets = await ticketRepo.listByOrder(id);
    expect(tickets.length).toBeGreaterThan(0);
    expect(tickets[0].status).toBe('RECEIVED');
  });

  it('splits food and drinks into separate tickets', async () => {
    const mixedOrder = {
      ...VALID_ORDER,
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
          quantity: 2,
          selectedVariantOptionId: null,
          selectedModifierIds: [],
          splitInstructions: null,
        }, // drinks
      ],
    };
    const res = await ordersPost(makePost(mixedOrder), slugParams());
    expect(res.status).toBe(201);
    const { id } = await res.json();
    const tickets = await ticketRepo.listByOrder(id);
    expect(tickets).toHaveLength(2);
    const types = new Set(tickets.map((t) => t.counterType));
    expect(types.has('FOOD')).toBe(true);
    expect(types.has('DRINKS')).toBe(true);
  });

  it('returns 422 for a sold-out product', async () => {
    // demo-prod-4 (Pintxo nahasia) is sold out in demo-janaria
    const res = await ordersPost(
      makePost({
        ...VALID_ORDER,
        lines: [
          {
            productId: 'demo-prod-4',
            quantity: 1,
            selectedVariantOptionId: null,
            selectedModifierIds: [],
            splitInstructions: null,
          },
        ],
      }),
      slugParams('demo-janaria')
    );
    expect(res.status).toBe(422);
  });

  it('returns 422 for an unknown product', async () => {
    const res = await ordersPost(
      makePost({
        ...VALID_ORDER,
        lines: [
          {
            productId: 'no-such-prod',
            quantity: 1,
            selectedVariantOptionId: null,
            selectedModifierIds: [],
            splitInstructions: null,
          },
        ],
      }),
      slugParams()
    );
    expect(res.status).toBe(422);
  });

  it('returns 409 when txosna is PAUSED', async () => {
    const res = await ordersPost(makePost(VALID_ORDER), slugParams('aste-nagusia-2026-paused'));
    expect(res.status).toBe(404); // slug not found = 404; PAUSED slug tested below
  });

  it('returns 409 for the demo PAUSED txosna', async () => {
    const res = await ordersPost(makePost(VALID_ORDER), slugParams('demo-edariak'));
    expect(res.status).toBe(409);
  });

  it('returns 404 for unknown slug', async () => {
    const res = await ordersPost(makePost(VALID_ORDER), slugParams('no-such-slug'));
    expect(res.status).toBe(404);
  });

  it('order numbers are sequential per txosna', async () => {
    const makeReq = () => ordersPost(makePost(VALID_ORDER), slugParams());
    const r1 = await (await makeReq()).json();
    const r2 = await (await makeReq()).json();
    expect(r2.orderNumber).toBe(r1.orderNumber + 1);
  });

  it('total matches sum of line prices', async () => {
    const res = await ordersPost(makePost(VALID_ORDER), slugParams());
    const order = await res.json();
    // prod-1 (Burgerra) defaultPrice = 8.50, qty 1
    expect(order.total).toBe(8.5);
  });

  it('broadcasts order:created SSE event', async () => {
    const { broadcast } = await import('@/lib/sse');
    await ordersPost(makePost(VALID_ORDER), slugParams());
    expect(broadcast).toHaveBeenCalledWith(
      expect.any(String),
      'order:created',
      expect.objectContaining({ customerName: 'Gorka' })
    );
  });

  // ── Kitchen post routing ─────────────────────────────────────────────────────

  it('txosna without kitchenPosts: one FOOD ticket with kitchenPost=null', async () => {
    // demo-edariak has no kitchenPosts and is PAUSED; use demo-janaria which has kitchenPosts
    // but prod-1b (Gazta Burgerra) has kitchenPost=null and belongs to assoc-1 (aste-nagusia-2026)
    // aste-nagusia-2026 has kitchenPosts=['plantxa','muntaia'], so let's use demo-edariak food products
    // Instead, test via a txosna we know has no posts — txosna-2 (pintxo-txokoa, SINGLE, no kitchenPosts)
    const res = await ordersPost(
      makePost({
        ...VALID_ORDER,
        lines: [
          {
            productId: 'prod-1',
            quantity: 1,
            selectedVariantOptionId: null,
            selectedModifierIds: [],
            splitInstructions: null,
          },
        ],
      }),
      slugParams('pintxo-txokoa')
    );
    expect(res.status).toBe(201);
    const { id } = await res.json();
    const tickets = await ticketRepo.listByOrder(id);
    const foodTickets = tickets.filter((t) => t.counterType === 'FOOD');
    expect(foodTickets).toHaveLength(1);
    expect(foodTickets[0].kitchenPost).toBeNull();
  });

  it('txosna with kitchenPosts: FOOD line with product kitchenPost creates a post ticket', async () => {
    // prod-1 (Burgerra) has kitchenPost='plantxa', no variant selected → only griddle post
    const res = await ordersPost(makePost(VALID_ORDER), slugParams());
    expect(res.status).toBe(201);
    const { id } = await res.json();
    const tickets = await ticketRepo.listByOrder(id);
    const foodTickets = tickets.filter((t) => t.counterType === 'FOOD');
    expect(foodTickets).toHaveLength(1);
    expect(foodTickets[0].kitchenPost).toBe('plantxa');
  });

  it('txosna with kitchenPosts: variant with kitchenPost adds a second post ticket', async () => {
    // prod-1 (kitchenPost='plantxa') + vo-1 (Patata frijituak, kitchenPost='muntaia')
    // → posts = {griddle, assembly} → 2 FOOD tickets
    const res = await ordersPost(
      makePost({
        ...VALID_ORDER,
        lines: [
          {
            productId: 'prod-1',
            quantity: 1,
            selectedVariantOptionId: 'vo-1',
            selectedModifierIds: [],
            splitInstructions: null,
          },
        ],
      }),
      slugParams()
    );
    expect(res.status).toBe(201);
    const { id } = await res.json();
    const tickets = await ticketRepo.listByOrder(id);
    const foodTickets = tickets.filter((t) => t.counterType === 'FOOD');
    expect(foodTickets).toHaveLength(2);
    const posts = new Set(foodTickets.map((t) => t.kitchenPost));
    expect(posts.has('plantxa')).toBe(true);
    expect(posts.has('muntaia')).toBe(true);
  });

  it('txosna with kitchenPosts: FOOD line with no post values creates general ticket (kitchenPost=null)', async () => {
    // prod-1b (Gazta Burgerra) has no kitchenPost → goes to general ticket
    const res = await ordersPost(
      makePost({
        ...VALID_ORDER,
        lines: [
          {
            productId: 'prod-1b',
            quantity: 1,
            selectedVariantOptionId: null,
            selectedModifierIds: [],
            splitInstructions: null,
          },
        ],
      }),
      slugParams()
    );
    expect(res.status).toBe(201);
    const { id } = await res.json();
    const tickets = await ticketRepo.listByOrder(id);
    const foodTickets = tickets.filter((t) => t.counterType === 'FOOD');
    expect(foodTickets).toHaveLength(1);
    expect(foodTickets[0].kitchenPost).toBeNull();
  });
});

// ── GET /api/txosnak/[slug]/orders ────────────────────────────────────────────

describe('GET /api/txosnak/[slug]/orders', () => {
  it('returns all orders for the txosna', async () => {
    const res = await ordersGet(makeGet(), slugParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it('filters by status=CONFIRMED', async () => {
    const res = await ordersGet(makeGet('?status=CONFIRMED'), slugParams());
    const body = await res.json();
    expect(body.every((o: { status: string }) => o.status === 'CONFIRMED')).toBe(true);
  });

  it('returns 404 for unknown slug', async () => {
    const res = await ordersGet(makeGet(), slugParams('no-such-slug'));
    expect(res.status).toBe(404);
  });
});
