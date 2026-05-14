import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetStore, seedMockData } from '@/test/store-setup';
import { POST as ordersPost, GET as ordersGet } from '../[slug]/orders/route';

// Stub NextAuth so we don't need a real session
vi.mock('@/lib/auth', () => ({
  auth: vi
    .fn()
    .mockResolvedValue({ user: { id: 'v1', associationId: 'assoc-1', role: 'VOLUNTEER' } }),
}));
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
});

// ── GET /api/txosnak/[slug]/orders ────────────────────────────────────────────

describe('GET /api/txosnak/[slug]/orders', () => {
  it('returns 404 for unknown slug', async () => {
    const res = await ordersGet(makeGet(), slugParams('no-such-slug'));
    expect(res.status).toBe(404);
  });
});
