import { notFound } from 'next/navigation';
import { txosnaRepo, orderRepo, ticketRepo, ticketBaiInvoiceRepo } from '@/lib/store';
import { TrackStatusClient } from './track-status-client';

interface Props {
  params: Promise<{ locale: string; slug: string; code: string }>;
}

export default async function TrackStatusPage({ params }: Props) {
  const { locale, slug, code } = await params;

  const txosna = await txosnaRepo.findBySlug(slug);
  if (!txosna || !txosna.mobileTrackingEnabled) notFound();

  const order = await orderRepo.findByVerificationCode(txosna.id, code.toUpperCase());
  if (!order) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 360,
            width: '100%',
            background: '#fff',
            borderRadius: 16,
            padding: '32px 24px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Koderik ez da aurkitu
          </div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
            Egiaztatu kodea eta saiatu berriro.
          </div>
          <a
            href={`/${locale}/${slug}/track`}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#e85d2f',
              color: '#fff',
              borderRadius: 10,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            ← Itzuli
          </a>
        </div>
      </div>
    );
  }

  const [tickets, fiscalInvoice] = await Promise.all([
    ticketRepo.listByOrder(order.id),
    order.fiscalReceiptRef ? ticketBaiInvoiceRepo.findByOrder(order.id) : null,
  ]);

  return (
    <TrackStatusClient
      slug={slug}
      locale={locale}
      txosnaName={txosna.name}
      code={code.toUpperCase()}
      initialOrder={{
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        status: order.status,
        confirmedAt: order.confirmedAt ? order.confirmedAt.toISOString() : null,
      }}
      initialTickets={tickets.map((t) => ({
        id: t.id,
        counterType: t.counterType,
        status: t.status,
      }))}
      fiscalInvoice={
        fiscalInvoice
          ? {
              series: fiscalInvoice.series,
              invoiceNumber: fiscalInvoice.invoiceNumber,
              issuedAt: fiscalInvoice.issuedAt.toISOString(),
              qrUrl: fiscalInvoice.qrUrl,
            }
          : null
      }
    />
  );
}
