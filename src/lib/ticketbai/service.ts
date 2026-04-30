import {
  associationRepo,
  orderRepo,
  ticketBaiConfigRepo,
  ticketBaiInvoiceRepo,
  ticketRepo,
} from '@/lib/store';
import type { StoredOrder, TicketBaiInvoiceLine, TicketBaiVatBreakdown } from '@/lib/store/types';
import { createTicketBaiProvider } from './index';
import type { IssueInvoiceInput } from './types';

/**
 * Issue a TicketBAI invoice for a confirmed order.
 *
 * Called after order confirmation. Silently exits when TicketBAI is disabled
 * for the association or no config exists, so it is safe to call unconditionally.
 *
 * Failures are propagated to the caller — wrap in try/catch if invoice errors
 * must not block order confirmation.
 */
export async function issueTicketBaiInvoice(
  order: StoredOrder,
  associationId: string
): Promise<void> {
  const association = await associationRepo.findById(associationId);
  if (!association?.ticketBaiEnabled) return;

  const config = await ticketBaiConfigRepo.findByAssociation(associationId);
  if (!config) return;

  const series = config.series;
  const [invoiceNumber, previousInvoice] = await Promise.all([
    ticketBaiInvoiceRepo.nextInvoiceNumber(associationId, series),
    ticketBaiInvoiceRepo.getLastByAssociation(associationId, series),
  ]);

  const tickets = await ticketRepo.listByOrder(order.id);
  const lines: TicketBaiInvoiceLine[] = tickets.flatMap((ticket) =>
    ticket.lines.map((line) => ({
      description: line.selectedVariant
        ? `${line.productName} (${line.selectedVariant})`
        : line.productName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      vatRate: 0,
      vatAmount: 0,
      total: line.unitPrice * line.quantity,
    }))
  );

  const vatBreakdown: TicketBaiVatBreakdown[] = [{ rate: 0, base: order.total, vatAmount: 0 }];

  const input: IssueInvoiceInput = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    series,
    invoiceNumber,
    issuedAt: order.confirmedAt ?? new Date(),
    sellerName: association.name,
    sellerCif: association.cif ?? '',
    lines: lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      vatRate: l.vatRate,
    })),
    total: order.total,
    vatBreakdown,
    previousChainId: previousInvoice?.chainId ?? null,
  };

  const provider = createTicketBaiProvider(config);
  const result = await provider.issue(input);

  await ticketBaiInvoiceRepo.create({
    associationId,
    orderId: order.id,
    orderNumber: order.orderNumber,
    series,
    invoiceNumber,
    issuedAt: input.issuedAt,
    sellerName: association.name,
    sellerCif: association.cif ?? '',
    lines,
    total: order.total,
    vatBreakdown,
    chainId: result.chainId,
    providerRef: result.providerRef,
    qrUrl: result.qrUrl,
    xmlPayload: result.xmlPayload,
    status: result.status,
  });

  const invoice = await ticketBaiInvoiceRepo.findByOrder(order.id);
  if (invoice) {
    await orderRepo.update(order.id, { fiscalReceiptRef: invoice.id });
  }
}
