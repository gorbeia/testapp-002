import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetStore, orderRepo, txosnaRepo } from '@/test/store-setup';
import { paymentProviderRepo } from '@/lib/store';
import { FakePaymentProvider } from '@/lib/payments/fake';
import type { CreateTicketInput } from '@/lib/store/types';

const fakeProvider = new FakePaymentProvider();

vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => fakeProvider,
  createPaymentProvider: () => fakeProvider,
}));

vi.mock('@/lib/sse', () => ({
  broadcast: vi.fn(),
}));

beforeEach(() => {
  resetStore();
  fakeProvider.sessions = [];
  fakeProvider.webhookEvents = [];
});

const TICKET_LINE: CreateTicketInput = {
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

async function seedRedsysProvider() {
  const txosna = await txosnaRepo.findById('txosna-1');
  return paymentProviderRepo.create({
    associationId: txosna!.associationId,
    providerType: 'REDSYS',
    testMode: true,
    credentials: {
      merchantCode: '999008881',
      terminal: '1',
      secretKey: 'sq7HjrUOBfKmC576ILgskD5srU870gJ7',
    },
    bizumEnabled: false,
  });
}

async function seedPendingOrder() {
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
    pendingLines: [TICKET_LINE],
  });
}

function makeRedsysBody(dsOrder: string) {
  const params = Buffer.from(JSON.stringify({ Ds_Order: dsOrder })).toString('base64');
  return new URLSearchParams({
    Ds_SignatureVersion: 'HMAC_SHA256_V1',
    Ds_MerchantParameters: params,
    Ds_Signature: 'fake-sig',
  }).toString();
}

describe('POST /api/payments/session (Redsys)', () => {
  it('creates a session when a Redsys provider is configured', async () => {
    await seedRedsysProvider();
    const order = await seedPendingOrder();

    const { POST } = await import('../session/route');
    const req = new Request('http://localhost/api/payments/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, providerType: 'REDSYS' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.sessionId).toBe(`fake-session-${order.id}`);

    const updated = await orderRepo.findById(order.id);
    expect(updated?.paymentSessionId).toBe(`fake-session-${order.id}`);
  });

  it('returns 409 when no active Redsys provider is configured', async () => {
    const order = await seedPendingOrder();

    const { POST } = await import('../session/route');
    const req = new Request('http://localhost/api/payments/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, providerType: 'REDSYS' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });
});

describe('POST /api/payments/webhook/redsys', () => {
  it('confirms order on a successful notification', async () => {
    await seedRedsysProvider();
    const order = await seedPendingOrder();
    await orderRepo.update(order.id, { paymentSessionId: `sess-${order.id}` });

    fakeProvider.setNextWebhookEvent({
      sessionId: `sess-${order.id}`,
      status: 'succeeded',
      amount: 12.5,
      currency: 'EUR',
      method: 'CARD',
    });

    const { POST } = await import('../webhook/[provider]/route');
    const req = new Request('http://localhost/api/payments/webhook/redsys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: makeRedsysBody(`sess-${order.id}`),
    });

    const res = await POST(req, { params: Promise.resolve({ provider: 'redsys' }) });
    expect(res.status).toBe(200);

    const confirmed = await orderRepo.findById(order.id);
    expect(confirmed?.status).toBe('CONFIRMED');
    expect(confirmed?.pendingLines).toBeNull();
  });

  it('cancels order with TIMEOUT on a cancelled notification', async () => {
    await seedRedsysProvider();
    const order = await seedPendingOrder();
    await orderRepo.update(order.id, { paymentSessionId: `sess-${order.id}` });

    fakeProvider.setNextWebhookEvent({
      sessionId: `sess-${order.id}`,
      status: 'cancelled',
      amount: 0,
      currency: 'EUR',
      method: 'CARD',
    });

    const { POST } = await import('../webhook/[provider]/route');
    const req = new Request('http://localhost/api/payments/webhook/redsys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: makeRedsysBody(`sess-${order.id}`),
    });

    const res = await POST(req, { params: Promise.resolve({ provider: 'redsys' }) });
    expect(res.status).toBe(200);

    const cancelled = await orderRepo.findById(order.id);
    expect(cancelled?.status).toBe('CANCELLED');
    expect(cancelled?.cancellationReason).toBe('TIMEOUT');
  });

  it('returns 400 on invalid signature', async () => {
    await seedRedsysProvider();
    const order = await seedPendingOrder();
    await orderRepo.update(order.id, { paymentSessionId: `sess-${order.id}` });

    fakeProvider.setThrowOnVerify('Invalid signature');

    const { POST } = await import('../webhook/[provider]/route');
    const req = new Request('http://localhost/api/payments/webhook/redsys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: makeRedsysBody(`sess-${order.id}`),
    });

    const res = await POST(req, { params: Promise.resolve({ provider: 'redsys' }) });
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown Ds_Order', async () => {
    await seedRedsysProvider();

    const { POST } = await import('../webhook/[provider]/route');
    const req = new Request('http://localhost/api/payments/webhook/redsys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: makeRedsysBody('unknown-session'),
    });

    const res = await POST(req, { params: Promise.resolve({ provider: 'redsys' }) });
    expect(res.status).toBe(404);
  });

  it('returns 400 for malformed Ds_MerchantParameters', async () => {
    const { POST } = await import('../webhook/[provider]/route');
    const req = new Request('http://localhost/api/payments/webhook/redsys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ Ds_MerchantParameters: 'not-valid-base64-json!!!' }).toString(),
    });

    const res = await POST(req, { params: Promise.resolve({ provider: 'redsys' }) });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/payments/redsys/redirect', () => {
  it('returns HTML auto-submit form for valid Redsys URL', async () => {
    const { GET } = await import('../redsys/redirect/route');
    const params = new URLSearchParams({
      redsysUrl: 'https://sis-t.redsys.es:25443/sis/realizarPago',
      Ds_SignatureVersion: 'HMAC_SHA256_V1',
      Ds_MerchantParameters: 'abc123',
      Ds_Signature: 'sig456',
    });
    const req = new Request(`http://localhost/api/payments/redsys/redirect?${params}`);

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');

    const html = await res.text();
    expect(html).toContain('method="POST"');
    expect(html).toContain('action="https://sis-t.redsys.es:25443/sis/realizarPago"');
    expect(html).toContain('name="Ds_MerchantParameters"');
    expect(html).toContain('form.submit()');
  });

  it('returns 400 for a disallowed redsysUrl', async () => {
    const { GET } = await import('../redsys/redirect/route');
    const params = new URLSearchParams({
      redsysUrl: 'https://evil.example.com/pay',
      Ds_SignatureVersion: 'HMAC_SHA256_V1',
      Ds_MerchantParameters: 'abc',
      Ds_Signature: 'sig',
    });
    const req = new Request(`http://localhost/api/payments/redsys/redirect?${params}`);

    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
