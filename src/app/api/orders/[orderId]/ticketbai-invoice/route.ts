import { ticketBaiInvoiceRepo } from '@/lib/store';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const invoice = await ticketBaiInvoiceRepo.findByOrder(orderId);
  if (!invoice) return new Response('Not found', { status: 404 });
  return NextResponse.json({
    series: invoice.series,
    invoiceNumber: invoice.invoiceNumber,
    issuedAtFormatted: invoice.issuedAt.toLocaleString('eu-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    qrUrl: invoice.qrUrl,
  });
}
