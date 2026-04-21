import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetStore, orderRepo } from '@/test/store-setup';
import { FakePaymentProvider } from '@/lib/payments/fake';
import type { CreateTicketInput } from '@/lib/store/types';

const fakeProvider = new FakePaymentProvider();

vi.mock('@/lib/payments', () => ({
  paymentProvider: fakeProvider,
}));

vi.mock('@/lib/sse', () => ({
  broadcast: vi.fn(),
}));

beforeEach(() => {
  resetStore();
  fakeProvider.sessions = [];
  fakeProvider.webhookEvents = [];
});

async function seedPendingOrder() {
  const ticketInput: CreateTicketInput = {
    counterType: 'FOOD',
    requiresPreparation: false,
    notes: null,
    lines: [
      {
        productId: 'prod-1',
        productName: 'Burgerra',
        quantity: 1,
        unitPrice: 12.5,
        selectedVariant: null,
        selectedModifiers: [],
        splitInstructions: null,
      },
    ],
  };

  return orderRepo.create({
    txosnaId: 'txosna-1',
    channel: 'SELF_SERVICE',
    customerName: 'Test Customer',
    notes: null,
    paymentMethod: 'ONLINE',
    registeredById: null,
    status: 'PENDING_PAYMENT',
    total: 12.5,
    expiresAt: new Date(Date.now() + 15 * 60_000),
    tickets: [],
    pendingLines: [ticketInput],
  });
}

describe('POST /api/payments/session', () => {
  it('creates a session and stores paymentSessionId on the order', async () => {
    const order = await seedPendingOrder();
    const { POST } = await import('../session/route');

    const req = new Request('http://localhost/api/payments/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.url).toContain('fake-stripe');
    expect(body.sessionId).toBe(`fake-session-${order.id}`);

    const updated = await orderRepo.findById(order.id);
    expect(updated?.paymentSessionId).toBe(`fake-session-${order.id}`);
  });

  it('returns 404 for unknown orderId', async () => {
    const { POST } = await import('../session/route');

    const req = new Request('http://localhost/api/payments/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: 'nonexistent' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 409 if order is not PENDING_PAYMENT', async () => {
    const order = await seedPendingOrder();
    await orderRepo.update(order.id, { status: 'CONFIRMED' });

    const { POST } = await import('../session/route');
    const req = new Request('http://localhost/api/payments/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('returns 409 if paymentMethod is not ONLINE', async () => {
    const { POST } = await import('../session/route');

    const ticketInput: CreateTicketInput = {
      counterType: 'FOOD',
      requiresPreparation: false,
      notes: null,
      lines: [
        {
          productId: 'prod-1',
          productName: 'Burgerra',
          quantity: 1,
          unitPrice: 12.5,
          selectedVariant: null,
          selectedModifiers: [],
          splitInstructions: null,
        },
      ],
    };

    const order = await orderRepo.create({
      txosnaId: 'txosna-1',
      channel: 'SELF_SERVICE',
      customerName: 'Test',
      notes: null,
      paymentMethod: 'CASH',
      registeredById: null,
      status: 'PENDING_PAYMENT',
      total: 12.5,
      expiresAt: new Date(Date.now() + 15 * 60_000),
      tickets: [],
      pendingLines: [ticketInput],
    });

    const req = new Request('http://localhost/api/payments/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });
});

describe('POST /api/payments/webhook/[provider]', () => {
  it('confirms order and creates tickets on checkout.session.completed', async () => {
    const order = await seedPendingOrder();
    await orderRepo.update(order.id, { paymentSessionId: `fake-session-${order.id}` });

    fakeProvider.setNextWebhookEvent({
      sessionId: `fake-session-${order.id}`,
      status: 'succeeded',
      amount: 12.5,
      currency: 'EUR',
      method: 'CARD',
    });

    const { POST } = await import('../webhook/[provider]/route');
    const req = new Request('http://localhost/api/payments/webhook/stripe', {
      method: 'POST',
      body: '{}',
    });

    const res = await POST(req, {
      params: Promise.resolve({ provider: 'stripe' }),
    });

    expect(res.status).toBe(200);

    const confirmed = await orderRepo.findById(order.id);
    expect(confirmed?.status).toBe('CONFIRMED');
    expect(confirmed?.pendingLines).toBeNull();
  });

  it('cancels order with TIMEOUT on checkout.session.expired', async () => {
    const order = await seedPendingOrder();
    await orderRepo.update(order.id, { paymentSessionId: `fake-session-${order.id}` });

    fakeProvider.setNextWebhookEvent({
      sessionId: `fake-session-${order.id}`,
      status: 'cancelled',
      amount: 0,
      currency: 'EUR',
      method: 'CARD',
    });

    const { POST } = await import('../webhook/[provider]/route');
    const req = new Request('http://localhost/api/payments/webhook/stripe', {
      method: 'POST',
      body: '{}',
    });

    const res = await POST(req, {
      params: Promise.resolve({ provider: 'stripe' }),
    });

    expect(res.status).toBe(200);

    const cancelled = await orderRepo.findById(order.id);
    expect(cancelled?.status).toBe('CANCELLED');
    expect(cancelled?.cancellationReason).toBe('TIMEOUT');
  });

  it('returns 400 on invalid signature', async () => {
    fakeProvider.setThrowOnVerify('Invalid signature');

    const { POST } = await import('../webhook/[provider]/route');
    const req = new Request('http://localhost/api/payments/webhook/stripe', {
      method: 'POST',
      body: '{}',
    });

    const res = await POST(req, {
      params: Promise.resolve({ provider: 'stripe' }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown sessionId', async () => {
    fakeProvider.setNextWebhookEvent({
      sessionId: 'unknown-session',
      status: 'succeeded',
      amount: 12.5,
      currency: 'EUR',
      method: 'CARD',
    });

    const { POST } = await import('../webhook/[provider]/route');
    const req = new Request('http://localhost/api/payments/webhook/stripe', {
      method: 'POST',
      body: '{}',
    });

    const res = await POST(req, {
      params: Promise.resolve({ provider: 'stripe' }),
    });

    expect(res.status).toBe(404);
  });
});
