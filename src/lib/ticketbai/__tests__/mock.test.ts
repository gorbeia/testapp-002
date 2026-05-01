import { describe, expect, it } from 'vitest';
import { MockTicketBaiProvider } from '../mock';
import type { IssueInvoiceInput } from '../types';

const BASE_INPUT: IssueInvoiceInput = {
  orderId: 'order-1',
  orderNumber: 1,
  series: 'TB',
  invoiceNumber: 1,
  issuedAt: new Date('2026-04-30T10:00:00Z'),
  sellerName: 'Elkartea',
  sellerCif: 'A12345678',
  lines: [{ description: 'Burgerra', quantity: 2, unitPrice: 3.5, vatRate: 0 }],
  total: 7.0,
  vatBreakdown: [{ rate: 0, base: 7.0, vatAmount: 0 }],
  previousChainId: null,
};

describe('MockTicketBaiProvider', () => {
  it('validate() always returns ok', async () => {
    const provider = new MockTicketBaiProvider();
    const result = await provider.validate();
    expect(result.ok).toBe(true);
  });

  it('issue() returns a result with status MOCK', async () => {
    const provider = new MockTicketBaiProvider();
    const result = await provider.issue(BASE_INPUT);
    expect(result.status).toBe('MOCK');
  });

  it('issue() returns a providerRef containing series and invoice number', async () => {
    const provider = new MockTicketBaiProvider();
    const result = await provider.issue(BASE_INPUT);
    expect(result.providerRef).toContain('TB');
    expect(result.providerRef).toContain('00000001');
  });

  it('issue() returns a qrUrl', async () => {
    const provider = new MockTicketBaiProvider();
    const result = await provider.issue(BASE_INPUT);
    expect(result.qrUrl).toMatch(/^https:\/\/tbai\.eus\/qr/);
  });

  it('issue() returns a 64-char hex chainId', async () => {
    const provider = new MockTicketBaiProvider();
    const result = await provider.issue(BASE_INPUT);
    expect(result.chainId).toMatch(/^[0-9a-f]{64}$/);
  });

  it('records each issued input in the issued array', async () => {
    const provider = new MockTicketBaiProvider();
    await provider.issue(BASE_INPUT);
    await provider.issue({ ...BASE_INPUT, invoiceNumber: 2, orderNumber: 2 });
    expect(provider.issued).toHaveLength(2);
    expect(provider.issued[0].invoiceNumber).toBe(1);
    expect(provider.issued[1].invoiceNumber).toBe(2);
  });

  it('produces different chainIds for different inputs', async () => {
    const provider = new MockTicketBaiProvider();
    const r1 = await provider.issue(BASE_INPUT);
    const r2 = await provider.issue({
      ...BASE_INPUT,
      invoiceNumber: 2,
      previousChainId: r1.chainId,
    });
    expect(r1.chainId).not.toBe(r2.chainId);
  });

  it('chainId changes when previousChainId changes', async () => {
    const provider = new MockTicketBaiProvider();
    const r1 = await provider.issue({ ...BASE_INPUT, previousChainId: null });
    const r2 = await provider.issue({ ...BASE_INPUT, previousChainId: 'some-other-hash' });
    expect(r1.chainId).not.toBe(r2.chainId);
  });
});
