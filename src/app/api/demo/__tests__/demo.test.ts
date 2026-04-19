import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEMO_ORDERS, DEMO_PIN, DEMO_PRIMARY_SLUG, DEMO_SECONDARY_SLUG } from '@/lib/fixtures/demo';
import { orderRepo, resetStore, ticketRepo, txosnaRepo } from '@/test/store-setup';
import { GET as statusGET } from '../status/route';
import { POST as resetPOST } from '../reset/route';

const SECRET = 'test-secret-abc';

beforeEach(() => {
  resetStore();
  vi.stubEnv('DEMO_RESET_SECRET', SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ── GET /api/demo/status ──────────────────────────────────────────────────────

describe('GET /api/demo/status', () => {
  it('returns enabled:true with slugs and pin when secret is set', async () => {
    const res = await statusGET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.enabled).toBe(true);
    expect(body.slugs).toEqual([DEMO_PRIMARY_SLUG, DEMO_SECONDARY_SLUG]);
    expect(body.pin).toBe(DEMO_PIN);
  });

  it('returns enabled:false when DEMO_RESET_SECRET is not set', async () => {
    vi.stubEnv('DEMO_RESET_SECRET', '');
    const res = await statusGET();
    const body = await res.json();
    expect(body.enabled).toBe(false);
    expect(body.slugs).toBeUndefined();
    expect(body.pin).toBeUndefined();
  });
});

// ── POST /api/demo/reset ──────────────────────────────────────────────────────

describe('POST /api/demo/reset', () => {
  it('returns 404 when DEMO_RESET_SECRET is not set', async () => {
    vi.stubEnv('DEMO_RESET_SECRET', '');
    const req = new Request('http://localhost/api/demo/reset', { method: 'POST' });
    const res = await resetPOST(req);
    expect(res.status).toBe(404);
  });

  it('returns 401 when Authorization header is missing', async () => {
    const req = new Request('http://localhost/api/demo/reset', { method: 'POST' });
    const res = await resetPOST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header has wrong secret', async () => {
    const req = new Request('http://localhost/api/demo/reset', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    const res = await resetPOST(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 with slugs and pin on valid request', async () => {
    const req = new Request('http://localhost/api/demo/reset', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRET}` },
    });
    const res = await resetPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.slugs).toEqual([DEMO_PRIMARY_SLUG, DEMO_SECONDARY_SLUG]);
    expect(body.pin).toBe(DEMO_PIN);
  });

  it('demo txosna is findable by slug after reset', async () => {
    const req = new Request('http://localhost/api/demo/reset', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRET}` },
    });
    await resetPOST(req);
    const txosna = await txosnaRepo.findBySlug(DEMO_PRIMARY_SLUG);
    expect(txosna).not.toBeNull();
    expect(txosna!.status).toBe('OPEN');
    expect(txosna!.pinHash).toBe(DEMO_PIN);
  });

  it('demo orders are present after reset', async () => {
    const req = new Request('http://localhost/api/demo/reset', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRET}` },
    });
    await resetPOST(req);
    const txosna = await txosnaRepo.findBySlug(DEMO_PRIMARY_SLUG);
    const demoOrders = await orderRepo.listByTxosna(txosna!.id);
    expect(demoOrders).toHaveLength(DEMO_ORDERS.length);
  });

  it('is idempotent — second reset produces the same dataset', async () => {
    const makeReq = () =>
      new Request('http://localhost/api/demo/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${SECRET}` },
      });

    await resetPOST(makeReq());
    // Mutate demo data by advancing a ticket
    const tickets = await ticketRepo.listByTxosna('demo-txosna-1');
    const receivedTicket = tickets.find((t) => t.status === 'RECEIVED');
    expect(receivedTicket).toBeDefined();
    await ticketRepo.update(receivedTicket!.id, { status: 'IN_PREPARATION' });

    // Reset again — mutation should be gone
    await resetPOST(makeReq());
    const ticketsAfter = await ticketRepo.listByTxosna('demo-txosna-1');
    const statuses = ticketsAfter.map((t) => t.status);
    // Original fixture has 3× RECEIVED tickets (order-1 food, order-2 food, order-4 drinks)
    expect(statuses.filter((s) => s === 'RECEIVED').length).toBe(3);
  });

  it('does not disturb the mock (non-demo) association data', async () => {
    const req = new Request('http://localhost/api/demo/reset', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRET}` },
    });
    await resetPOST(req);
    // Mock txosna is still present
    const mockTxosna = await txosnaRepo.findBySlug('aste-nagusia-2026');
    expect(mockTxosna).not.toBeNull();
    // Mock orders are still present
    const mockOrders = await orderRepo.listByTxosna('txosna-1');
    expect(mockOrders.length).toBeGreaterThan(0);
  });

  it('order counter resets — next order after reset starts from correct number', async () => {
    const req = new Request('http://localhost/api/demo/reset', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRET}` },
    });
    await resetPOST(req);
    // Next number should continue from DEMO_ORDERS.length (6), not accumulate
    const next = await orderRepo.nextOrderNumber('demo-txosna-1');
    expect(next).toBe(DEMO_ORDERS.length + 1);
  });
});

// ── Store: demo data is seeded on startup ─────────────────────────────────────

describe('demo data seeded in store', () => {
  it('demo txosna-1 (OPEN) is available after resetStore', async () => {
    const t = await txosnaRepo.findBySlug(DEMO_PRIMARY_SLUG);
    expect(t).not.toBeNull();
    expect(t!.status).toBe('OPEN');
  });

  it('demo txosna-2 (PAUSED) is available after resetStore', async () => {
    const t = await txosnaRepo.findBySlug(DEMO_SECONDARY_SLUG);
    expect(t).not.toBeNull();
    expect(t!.status).toBe('PAUSED');
  });

  it('demo catalog has food and drinks categories', async () => {
    const { catalogRepo } = await import('@/test/store-setup');
    const cats = await catalogRepo.listCategories('demo-assoc-1');
    expect(cats.map((c) => c.type).sort()).toEqual(['DRINKS', 'FOOD']);
  });

  it('pintxo nahasia is soldOut in demo-txosna-1', async () => {
    const { catalogRepo } = await import('@/test/store-setup');
    const view = await catalogRepo.getProductView('demo-prod-4', 'demo-txosna-1');
    expect(view).not.toBeNull();
    expect(view!.soldOut).toBe(true);
  });

  it('pintxo nahasia is NOT soldOut in demo-txosna-2 (no override)', async () => {
    const { catalogRepo } = await import('@/test/store-setup');
    const view = await catalogRepo.getProductView('demo-prod-4', 'demo-txosna-2');
    expect(view).not.toBeNull();
    expect(view!.soldOut).toBe(false);
  });

  it('demo tickets cover all operational statuses', async () => {
    const demoTickets = await ticketRepo.listByTxosna('demo-txosna-1');
    const statuses = new Set(demoTickets.map((t) => t.status));
    expect(statuses.has('RECEIVED')).toBe(true);
    expect(statuses.has('IN_PREPARATION')).toBe(true);
    expect(statuses.has('READY')).toBe(true);
    expect(statuses.has('CANCELLED')).toBe(true);
  });

  it('demo order-4 has both a FOOD and a DRINKS ticket', async () => {
    const tickets = await ticketRepo.listByOrder('demo-order-4');
    expect(tickets).toHaveLength(2);
    const types = new Set(tickets.map((t) => t.counterType));
    expect(types.has('FOOD')).toBe(true);
    expect(types.has('DRINKS')).toBe(true);
  });

  it('cancelled demo order has SOLD_OUT reason', async () => {
    const order = await orderRepo.findById('demo-order-6');
    expect(order!.status).toBe('CANCELLED');
    expect(order!.cancellationReason).toBe('SOLD_OUT');
  });
});
