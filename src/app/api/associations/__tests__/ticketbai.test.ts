import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetStore, orderRepo } from '@/test/store-setup';
import { associationRepo, ticketBaiConfigRepo, ticketBaiInvoiceRepo } from '@/lib/store';
import * as authModule from '@/lib/auth';
import {
  GET as tbaiConfigGet,
  PATCH as tbaiConfigPatch,
  POST as tbaiConfigTest,
} from '../[associationId]/ticketbai/route';
import { GET as tbaiInvoicesGet } from '../[associationId]/ticketbai/invoices/route';
import { GET as orderInvoiceGet } from '../../orders/[orderId]/ticketbai-invoice/route';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

const authMock = vi.mocked(authModule.auth);

beforeEach(() => {
  resetStore();
  authMock.mockResolvedValue(null as never);
});

afterEach(() => {
  vi.clearAllMocks();
});

function mockAdminSession(associationId = 'assoc-1') {
  authMock.mockResolvedValue({
    user: { id: 'v1', role: 'ADMIN', associationId, email: 'admin@test.com' },
  } as never);
}

function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options);
}

function makeParams(associationId: string) {
  return { params: Promise.resolve({ associationId }) };
}

function makeOrderParams(orderId: string) {
  return { params: Promise.resolve({ orderId }) };
}

// ── GET /api/associations/[id]/ticketbai ──────────────────────────────────────

describe('GET /api/associations/[id]/ticketbai', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await tbaiConfigGet(makeRequest('http://localhost'), makeParams('assoc-1'));
    expect(res.status).toBe(401);
  });

  it('returns 403 when session association does not match', async () => {
    mockAdminSession('other-assoc');
    const res = await tbaiConfigGet(makeRequest('http://localhost'), makeParams('assoc-1'));
    expect(res.status).toBe(403);
  });

  it('returns default config when none exists', async () => {
    mockAdminSession('assoc-1');
    const res = await tbaiConfigGet(makeRequest('http://localhost'), makeParams('assoc-1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.providerType).toBe('MOCK');
    expect(body.series).toBe('TB');
  });

  it('returns saved config when it exists', async () => {
    mockAdminSession('assoc-1');
    await ticketBaiConfigRepo.upsert('assoc-1', { series: 'AGK', providerType: 'MOCK' });
    const res = await tbaiConfigGet(makeRequest('http://localhost'), makeParams('assoc-1'));
    const body = await res.json();
    expect(body.series).toBe('AGK');
  });
});

// ── PATCH /api/associations/[id]/ticketbai ────────────────────────────────────

describe('PATCH /api/associations/[id]/ticketbai', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await tbaiConfigPatch(
      makeRequest('http://localhost', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series: 'TB2' }),
      }),
      makeParams('assoc-1')
    );
    expect(res.status).toBe(401);
  });

  it('creates config when none exists', async () => {
    mockAdminSession('assoc-1');
    const res = await tbaiConfigPatch(
      makeRequest('http://localhost', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series: 'AGK', providerType: 'MOCK' }),
      }),
      makeParams('assoc-1')
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.series).toBe('AGK');
    expect(body.providerType).toBe('MOCK');
  });

  it('updates existing config', async () => {
    mockAdminSession('assoc-1');
    await ticketBaiConfigRepo.upsert('assoc-1', { series: 'OLD', providerType: 'MOCK' });
    await tbaiConfigPatch(
      makeRequest('http://localhost', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series: 'NEW' }),
      }),
      makeParams('assoc-1')
    );
    const config = await ticketBaiConfigRepo.findByAssociation('assoc-1');
    expect(config?.series).toBe('NEW');
  });

  it('rejects unknown providerType', async () => {
    mockAdminSession('assoc-1');
    const res = await tbaiConfigPatch(
      makeRequest('http://localhost', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerType: 'UNKNOWN' }),
      }),
      makeParams('assoc-1')
    );
    expect(res.status).toBe(422);
  });

  it('rejects empty series', async () => {
    mockAdminSession('assoc-1');
    const res = await tbaiConfigPatch(
      makeRequest('http://localhost', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series: '   ' }),
      }),
      makeParams('assoc-1')
    );
    expect(res.status).toBe(422);
  });
});

// ── POST /api/associations/[id]/ticketbai (validate) ─────────────────────────

describe('POST /api/associations/[id]/ticketbai', () => {
  it('returns 404 when no config exists', async () => {
    mockAdminSession('assoc-1');
    const res = await tbaiConfigTest(
      makeRequest('http://localhost', { method: 'POST' }),
      makeParams('assoc-1')
    );
    expect(res.status).toBe(404);
  });

  it('returns ok: true for mock provider', async () => {
    mockAdminSession('assoc-1');
    await ticketBaiConfigRepo.upsert('assoc-1', { series: 'TB', providerType: 'MOCK' });
    const res = await tbaiConfigTest(
      makeRequest('http://localhost', { method: 'POST' }),
      makeParams('assoc-1')
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});

// ── GET /api/associations/[id]/ticketbai/invoices ─────────────────────────────

describe('GET /api/associations/[id]/ticketbai/invoices', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await tbaiInvoicesGet(makeRequest('http://localhost'), makeParams('assoc-1'));
    expect(res.status).toBe(401);
  });

  it('returns empty array when no invoices', async () => {
    mockAdminSession('assoc-1');
    const res = await tbaiInvoicesGet(makeRequest('http://localhost'), makeParams('assoc-1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  it('returns invoices for the association', async () => {
    mockAdminSession('assoc-1');
    await ticketBaiInvoiceRepo.create({
      associationId: 'assoc-1',
      orderId: 'order-x',
      orderNumber: 42,
      series: 'TB',
      invoiceNumber: 1,
      issuedAt: new Date(),
      sellerName: 'Test',
      sellerCif: 'A12345678',
      lines: [],
      total: 10,
      vatBreakdown: [],
      chainId: 'abc123',
      providerRef: 'MOCK-TB-00000001',
      qrUrl: 'https://tbai.eus/qr?s=TB&n=1&c=abc123',
      xmlPayload: null,
      status: 'MOCK',
    });
    const res = await tbaiInvoicesGet(makeRequest('http://localhost'), makeParams('assoc-1'));
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].invoiceNumber).toBe(1);
    expect(body[0].series).toBe('TB');
  });
});

// ── GET /api/orders/[orderId]/ticketbai-invoice ───────────────────────────────

describe('GET /api/orders/[orderId]/ticketbai-invoice', () => {
  it('returns 404 when no invoice for the order', async () => {
    const res = await orderInvoiceGet(
      makeRequest('http://localhost'),
      makeOrderParams('nonexistent-order')
    );
    expect(res.status).toBe(404);
  });

  it('returns the invoice when it exists', async () => {
    await ticketBaiInvoiceRepo.create({
      associationId: 'assoc-1',
      orderId: 'order-y',
      orderNumber: 7,
      series: 'TB',
      invoiceNumber: 3,
      issuedAt: new Date(),
      sellerName: 'Elkartea',
      sellerCif: 'A12345678',
      lines: [],
      total: 21.5,
      vatBreakdown: [],
      chainId: 'deadbeef',
      providerRef: 'MOCK-TB-00000003',
      qrUrl: 'https://tbai.eus/qr?s=TB&n=3&c=deadbeef',
      xmlPayload: null,
      status: 'MOCK',
    });
    const res = await orderInvoiceGet(makeRequest('http://localhost'), makeOrderParams('order-y'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.invoiceNumber).toBe(3);
    expect(body.total).toBe(21.5);
  });
});

// ── Invoice issuance integration ──────────────────────────────────────────────

describe('Invoice issuance on order confirmation', () => {
  it('issues a TicketBAI invoice when ticketBaiEnabled and config exists', async () => {
    await associationRepo.update('assoc-1', { ticketBaiEnabled: true });
    await ticketBaiConfigRepo.upsert('assoc-1', { series: 'TB', providerType: 'MOCK' });

    const { issueTicketBaiInvoice } = await import('@/lib/ticketbai/service');
    const order = await orderRepo.findById(
      [...(await orderRepo.listByTxosna('txosna-1'))][0]?.id ?? ''
    );
    if (!order) return;

    await issueTicketBaiInvoice(order, 'assoc-1');

    const invoice = await ticketBaiInvoiceRepo.findByOrder(order.id);
    expect(invoice).not.toBeNull();
    expect(invoice?.series).toBe('TB');
    expect(invoice?.status).toBe('MOCK');
    expect(invoice?.qrUrl).toMatch(/^https:\/\/tbai\.eus\/qr/);
  });

  it('does nothing when ticketBaiEnabled is false', async () => {
    await ticketBaiConfigRepo.upsert('assoc-1', { series: 'TB', providerType: 'MOCK' });

    const { issueTicketBaiInvoice } = await import('@/lib/ticketbai/service');
    const orders = await orderRepo.listByTxosna('txosna-1');
    const order = orders[0];
    if (!order) return;

    await issueTicketBaiInvoice(order, 'assoc-1');
    const invoice = await ticketBaiInvoiceRepo.findByOrder(order.id);
    expect(invoice).toBeNull();
  });

  it('invoice numbers increment correctly for the same series', async () => {
    await associationRepo.update('assoc-1', { ticketBaiEnabled: true });
    await ticketBaiConfigRepo.upsert('assoc-1', { series: 'TB', providerType: 'MOCK' });

    const { issueTicketBaiInvoice } = await import('@/lib/ticketbai/service');
    const orders = await orderRepo.listByTxosna('txosna-1');

    await issueTicketBaiInvoice(orders[0], 'assoc-1');
    await issueTicketBaiInvoice(orders[1], 'assoc-1');

    const allInvoices = await ticketBaiInvoiceRepo.listByAssociation('assoc-1');
    const numbers = allInvoices.map((i) => i.invoiceNumber).sort((a, b) => a - b);
    expect(numbers).toEqual([1, 2]);
  });

  it('second invoice chain references first invoice chainId', async () => {
    await associationRepo.update('assoc-1', { ticketBaiEnabled: true });
    await ticketBaiConfigRepo.upsert('assoc-1', { series: 'TB', providerType: 'MOCK' });

    const { issueTicketBaiInvoice } = await import('@/lib/ticketbai/service');
    const orders = await orderRepo.listByTxosna('txosna-1');

    await issueTicketBaiInvoice(orders[0], 'assoc-1');
    const firstInvoice = await ticketBaiInvoiceRepo.findByOrder(orders[0].id);

    await issueTicketBaiInvoice(orders[1], 'assoc-1');
    const secondInvoice = await ticketBaiInvoiceRepo.findByOrder(orders[1].id);

    expect(firstInvoice?.chainId).toBeTruthy();
    expect(secondInvoice?.chainId).toBeTruthy();
    expect(firstInvoice?.chainId).not.toBe(secondInvoice?.chainId);
  });
});
