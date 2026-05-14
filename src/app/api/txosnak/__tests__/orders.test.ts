import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetStore, seedMockData, ticketRepo } from '@/test/store-setup';
import { POST as ordersPost, GET as ordersGet } from '../[slug]/orders/route';

// Stub NextAuth so we don't need a real session
vi.mock('@/lib/auth', () => ({
  auth: vi
    .fn()
    .mockResolvedValue({ user: { id: 'v1', associationId: 'assoc-1', role: 'VOLUNTEER' } }),
}));
// Stub SSE broadcast
vi.mock('@/lib/sse', () => ({ broadcast: vi.fn() }));

beforeEach(() => {
  resetStore();
  seedMockData();
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
    // pintxo-txokoa (txosna-2) has no kitchenPosts configured
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
  it('returns 404 for unknown slug', async () => {
    const res = await ordersGet(makeGet(), slugParams('no-such-slug'));
    expect(res.status).toBe(404);
  });
});
