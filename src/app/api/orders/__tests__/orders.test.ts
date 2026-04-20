import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetStore, orderRepo, ticketRepo } from '@/test/store-setup';
import { GET as ordersGet } from '../[orderId]/route';

vi.mock('@/lib/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { id: 'v1' } }) }));
vi.mock('@/lib/sse', () => ({ broadcast: vi.fn() }));

beforeEach(() => {
  resetStore();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(orderId: string, queryParams = '') {
  return new Request(`http://localhost/api/orders/${orderId}${queryParams}`);
}

function idParams(orderId: string) {
  return { params: Promise.resolve({ orderId }) };
}

// ── GET /api/orders/[orderId] ─────────────────────────────────────────────────

describe('GET /api/orders/[orderId]', () => {
  it('returns 200 with order details and tickets', async () => {
    // Seed an order
    const order = await orderRepo.create({
      txosnaId: 'txosna-1',
      channel: 'COUNTER',
      customerName: 'Test Customer',
      notes: null,
      paymentMethod: 'CASH',
      registeredById: 'v1',
      status: 'CONFIRMED',
      total: 25.0,
      expiresAt: null,
      tickets: [
        {
          counterType: 'FOOD',
          requiresPreparation: true,
          notes: null,
          lines: [
            {
              productId: 'prod-1',
              productName: 'Test Product',
              quantity: 1,
              unitPrice: 25.0,
              selectedVariant: null,
              selectedModifiers: [],
              splitInstructions: null,
            },
          ],
        },
      ],
    });

    const res = await ordersGet(makeRequest(order.id), idParams(order.id));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.id).toBe(order.id);
    expect(body.orderNumber).toBeGreaterThan(0);
    expect(body.status).toBe('CONFIRMED');
    expect(body.verificationCode).toMatch(/^[A-HJ-NP-Z]{2}-\d{4}$/);
    expect(body.customerName).toBe('Test Customer');
    expect(body.total).toBe(25.0);
    expect(body.channel).toBe('COUNTER');
    expect(Array.isArray(body.tickets)).toBe(true);
    expect(body.tickets.length).toBeGreaterThan(0);
    expect(body.tickets[0]).toHaveProperty('counterType');
    expect(body.tickets[0]).toHaveProperty('status');
  });

  it('returns 404 for nonexistent order', async () => {
    const res = await ordersGet(makeRequest('nonexistent'), idParams('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('accepts verification code in query params', async () => {
    const order = await orderRepo.create({
      txosnaId: 'txosna-1',
      channel: 'COUNTER',
      customerName: 'Test',
      notes: null,
      paymentMethod: 'CASH',
      registeredById: 'v1',
      status: 'CONFIRMED',
      total: 10.0,
      expiresAt: null,
      tickets: [
        {
          counterType: 'FOOD',
          requiresPreparation: false,
          notes: null,
          lines: [
            {
              productId: 'prod-1',
              productName: 'Test',
              quantity: 1,
              unitPrice: 10.0,
              selectedVariant: null,
              selectedModifiers: [],
              splitInstructions: null,
            },
          ],
        },
      ],
    });

    const res = await ordersGet(
      makeRequest(
        order.id,
        `?txosnaId=${order.txosnaId}&orderNumber=${order.orderNumber}&verificationCode=${order.verificationCode}`
      ),
      idParams(order.id)
    );
    expect(res.status).toBe(200);
  });

  it('returns 403 for wrong verification code', async () => {
    const order = await orderRepo.create({
      txosnaId: 'txosna-1',
      channel: 'COUNTER',
      customerName: 'Test',
      notes: null,
      paymentMethod: 'CASH',
      registeredById: 'v1',
      status: 'CONFIRMED',
      total: 10.0,
      expiresAt: null,
      tickets: [
        {
          counterType: 'FOOD',
          requiresPreparation: false,
          notes: null,
          lines: [
            {
              productId: 'prod-1',
              productName: 'Test',
              quantity: 1,
              unitPrice: 10.0,
              selectedVariant: null,
              selectedModifiers: [],
              splitInstructions: null,
            },
          ],
        },
      ],
    });

    const res = await ordersGet(
      makeRequest(order.id, `?verificationCode=ZZ-9999`),
      idParams(order.id)
    );
    expect(res.status).toBe(403);
  });

  it('reflects ticket status updates in response', async () => {
    const order = await orderRepo.create({
      txosnaId: 'txosna-1',
      channel: 'COUNTER',
      customerName: 'Test',
      notes: null,
      paymentMethod: 'CASH',
      registeredById: 'v1',
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
              productName: 'Test',
              quantity: 1,
              unitPrice: 10.0,
              selectedVariant: null,
              selectedModifiers: [],
              splitInstructions: null,
            },
          ],
        },
      ],
    });

    // Advance ticket status
    const tickets = await ticketRepo.listByOrder(order.id);
    const ticket = tickets[0];
    await ticketRepo.update(ticket.id, { status: 'IN_PREPARATION' });

    // Fetch order again
    const res = await ordersGet(makeRequest(order.id), idParams(order.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tickets[0].status).toBe('IN_PREPARATION');
  });

  it('broadcasts are available for Phase 3 to use', async () => {
    // The broadcast function is mocked at module level; Phase 3 will call it
    // when ticket status changes. This test just verifies the mock is in place.
    const { broadcast } = await import('@/lib/sse');
    expect(typeof broadcast).toBe('function');
  });
});
