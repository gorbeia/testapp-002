import { createHash } from 'crypto';
import type { ITicketBaiProvider, IssueInvoiceInput, IssueInvoiceResult } from './types';

/**
 * Mock TicketBAI provider for development and testing.
 * Issues invoices without contacting any external API.
 * Stores all issued inputs in `issued` for test assertions.
 */
export class MockTicketBaiProvider implements ITicketBaiProvider {
  public issued: IssueInvoiceInput[] = [];

  async validate(): Promise<{ ok: boolean; error?: string }> {
    return { ok: true };
  }

  async issue(input: IssueInvoiceInput): Promise<IssueInvoiceResult> {
    this.issued.push(input);
    const chainId = this.computeChainId(input);
    const paddedNumber = String(input.invoiceNumber).padStart(8, '0');
    const providerRef = `MOCK-${input.series}-${paddedNumber}`;
    const qrUrl = `https://tbai.eus/qr?s=${input.series}&n=${input.invoiceNumber}&c=${chainId.substring(0, 8)}`;
    return { providerRef, qrUrl, xmlPayload: null, chainId, status: 'MOCK' };
  }

  private computeChainId(input: IssueInvoiceInput): string {
    const data = [
      input.series,
      input.invoiceNumber,
      input.sellerCif,
      input.total.toFixed(2),
      input.issuedAt.toISOString(),
      input.previousChainId ?? 'FIRST',
    ].join('|');
    return createHash('sha256').update(data).digest('hex');
  }
}
