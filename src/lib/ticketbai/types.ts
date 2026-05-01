// TicketBAI provider abstraction.
//
// TicketBAI is a Basque Country fiscal regulation requiring every sale to
// produce a signed, chained invoice submitted to the tax authority. Each
// invoice references the previous one via a chain hash, creating an
// auditable ledger. The provider abstraction lets each association choose
// their own implementation (BATUZ for Araba, Gipuzkoa platform, etc.)
// while the app maintains its own ledger independently of the provider.

export interface TicketBaiInvoiceLineInput {
  description: string;
  quantity: number;
  /** Unit price including VAT. */
  unitPrice: number;
  /** VAT rate as a percentage (e.g. 10 for 10%). Use 0 when unknown. */
  vatRate: number;
}

export interface VatBreakdown {
  rate: number;
  base: number;
  vatAmount: number;
}

export interface IssueInvoiceInput {
  orderId: string;
  orderNumber: number;
  series: string;
  invoiceNumber: number;
  issuedAt: Date;
  sellerName: string;
  sellerCif: string;
  lines: TicketBaiInvoiceLineInput[];
  total: number;
  vatBreakdown: VatBreakdown[];
  /** Hash from the previous invoice in the chain. Null for the first invoice. */
  previousChainId: string | null;
}

export interface IssueInvoiceResult {
  providerRef: string;
  qrUrl: string;
  xmlPayload: string | null;
  chainId: string;
  status: 'SUBMITTED' | 'ACCEPTED' | 'MOCK';
}

export interface ITicketBaiProvider {
  /**
   * Issue a TicketBAI invoice. The returned chainId must be stored and
   * passed as previousChainId when issuing the next invoice in the series.
   */
  issue(input: IssueInvoiceInput): Promise<IssueInvoiceResult>;

  /** Check that provider credentials are valid (used by admin UI test button). */
  validate(): Promise<{ ok: boolean; error?: string }>;
}
