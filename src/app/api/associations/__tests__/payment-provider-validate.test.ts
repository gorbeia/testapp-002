import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetStore } from '@/test/store-setup';
import { paymentProviderRepo } from '@/lib/store';
import * as authModule from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

const authMock = vi.mocked(authModule.auth);

const mockValidate = vi.fn();
vi.mock('@/lib/payments', () => ({
  getPaymentProvider: vi.fn(),
  createPaymentProvider: vi.fn(() => ({ validate: mockValidate })),
}));

beforeEach(() => {
  resetStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authMock.mockResolvedValue(null as any);
  mockValidate.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

function mockAdminSession(associationId = 'assoc-1') {
  authMock.mockResolvedValue({
    user: { id: 'u1', role: 'ADMIN', associationId, email: 'admin@test.com' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

async function seedProvider(associationId = 'assoc-1') {
  return paymentProviderRepo.create({
    associationId,
    providerType: 'STRIPE',
    displayName: 'Stripe Test',
    testMode: true,
    credentials: { secretKey: 'sk_test_123', webhookSecret: 'whsec_abc' },
    bizumEnabled: false,
  });
}

async function callValidate(associationId: string, providerId: string) {
  const { POST } = await import('../[associationId]/payment-providers/[providerId]/validate/route');
  return POST(new Request('http://localhost/validate', { method: 'POST' }), {
    params: Promise.resolve({ associationId, providerId }),
  });
}

describe('POST /api/associations/[associationId]/payment-providers/[providerId]/validate', () => {
  it('returns 401 when not authenticated', async () => {
    const provider = await seedProvider();
    const res = await callValidate('assoc-1', provider.id);
    expect(res.status).toBe(401);
  });

  it('returns 403 when associationId does not match session', async () => {
    mockAdminSession('assoc-2');
    const provider = await seedProvider('assoc-1');
    const res = await callValidate('assoc-1', provider.id);
    expect(res.status).toBe(403);
  });

  it('returns 404 when provider does not exist', async () => {
    mockAdminSession('assoc-1');
    const res = await callValidate('assoc-1', 'nonexistent-provider');
    expect(res.status).toBe(404);
  });

  it('returns 403 when provider belongs to a different association', async () => {
    mockAdminSession('assoc-1');
    const provider = await seedProvider('assoc-2');
    const res = await callValidate('assoc-1', provider.id);
    expect(res.status).toBe(403);
  });

  it('returns { ok: true } and stamps verifiedAt when validation succeeds', async () => {
    mockAdminSession('assoc-1');
    const provider = await seedProvider();
    mockValidate.mockResolvedValue({ ok: true });

    const res = await callValidate('assoc-1', provider.id);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    const updated = await paymentProviderRepo.findById(provider.id);
    expect(updated?.verifiedAt).toBeInstanceOf(Date);
  });

  it('returns { ok: false, error } and does not stamp verifiedAt when validation fails', async () => {
    mockAdminSession('assoc-1');
    const provider = await seedProvider();
    mockValidate.mockResolvedValue({ ok: false, error: 'Invalid API key' });

    const res = await callValidate('assoc-1', provider.id);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Invalid API key');

    const unchanged = await paymentProviderRepo.findById(provider.id);
    expect(unchanged?.verifiedAt).toBeNull();
  });

  it('returns { ok: false } when the provider throws during validation', async () => {
    mockAdminSession('assoc-1');
    const provider = await seedProvider();
    mockValidate.mockRejectedValue(new Error('Network timeout'));

    const res = await callValidate('assoc-1', provider.id);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Network timeout');
  });
});
