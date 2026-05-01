'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useSSE } from '@/hooks/useSSE';
import { OrderNumberHeading } from '@/components/order-status/order-number-heading';
import {
  TicketStatusCards,
  type TicketSummary,
} from '@/components/order-status/ticket-status-cards';
import { OrderReadyBanner } from '@/components/order-status/order-ready-banner';
import {
  FiscalInvoiceCard,
  type FiscalInvoiceData,
} from '@/components/order-status/fiscal-invoice-card';
import { ReceiptDownload } from '@/components/order-status/receipt-download';

interface OrderSummary {
  orderNumber: number;
  customerName: string | null;
  status: string;
  confirmedAt: string | null;
}

interface Props {
  slug: string;
  locale: string;
  txosnaName: string;
  code: string;
  initialOrder: OrderSummary;
  initialTickets: TicketSummary[];
  fiscalInvoice: FiscalInvoiceData | null;
}

export function TrackStatusClient({
  slug,
  locale,
  txosnaName,
  code,
  initialOrder,
  initialTickets,
  fiscalInvoice,
}: Props) {
  const [order, setOrder] = useState<OrderSummary>(initialOrder);
  const [tickets, setTickets] = useState<TicketSummary[]>(initialTickets);

  const refresh = useCallback(() => {
    fetch(`/api/txosnak/${slug}/orders/lookup?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then(
        (data: {
          status: string;
          confirmedAt: string | null;
          customerName: string | null;
          orderNumber: number;
          tickets: TicketSummary[];
        }) => {
          setOrder((prev) => ({
            ...prev,
            status: data.status,
            confirmedAt: data.confirmedAt,
          }));
          setTickets(data.tickets);
        }
      )
      .catch(() => {});
  }, [slug, code]);

  useSSE(slug, {
    'ticket:status_changed': refresh,
    'order:cancelled': refresh,
    'order:confirmed': refresh,
  });

  const allReady =
    tickets.length > 0 && tickets.every((t) => t.status === 'READY' || t.status === 'COMPLETED');
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--cust-bg, #f8f8f8)',
        fontFamily: 'system-ui, sans-serif',
        padding: '24px 16px 40px',
      }}
    >
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        <div style={{ marginBottom: 8 }}>
          <Link
            href={`/${locale}/${slug}/track`}
            style={{ fontSize: 13, color: 'var(--cust-text-sec, #999)', textDecoration: 'none' }}
          >
            ← {txosnaName}
          </Link>
        </div>

        <OrderNumberHeading
          orderNumber={order.orderNumber}
          customerName={order.customerName}
          isCancelled={isCancelled}
          isReady={allReady}
          isPending={order.status === 'PENDING_PAYMENT'}
        />

        <TicketStatusCards tickets={tickets} pendingPayment={order.status === 'PENDING_PAYMENT'} />

        {allReady && <OrderReadyBanner />}

        {fiscalInvoice && <FiscalInvoiceCard invoice={fiscalInvoice} />}

        <ReceiptDownload href={`/${locale}/${slug}/track/${encodeURIComponent(code)}/receipt`} />

        <div
          style={{
            fontSize: 11,
            color: 'var(--cust-text-sec, #bbb)',
            textAlign: 'center',
            marginTop: 16,
          }}
        >
          Kodea: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{code}</span>
        </div>
      </div>
    </div>
  );
}
