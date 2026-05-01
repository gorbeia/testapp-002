'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useSSE } from '@/hooks/useSSE';

interface TicketSummary {
  id: string;
  counterType: string;
  status: string;
}

interface OrderSummary {
  orderNumber: number;
  customerName: string | null;
  status: string;
  confirmedAt: string | null;
}

interface FiscalInvoice {
  series: string;
  invoiceNumber: number;
  issuedAt: string;
  qrUrl: string | null;
}

interface Props {
  slug: string;
  locale: string;
  txosnaName: string;
  code: string;
  initialOrder: OrderSummary;
  initialTickets: TicketSummary[];
  fiscalInvoice: FiscalInvoice | null;
}

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: 'Jasota',
  IN_PREPARATION: 'Prestatzen',
  READY: 'Prest! 🎉',
  COMPLETED: 'Amaituta ✓',
  CANCELLED: 'Bertan behera',
};

const STATUS_COLOR: Record<string, string> = {
  RECEIVED: '#888',
  IN_PREPARATION: '#e85d2f',
  READY: '#22c55e',
  COMPLETED: '#22c55e',
  CANCELLED: '#c0392b',
};

const COUNTER_LABEL: Record<string, string> = {
  FOOD: 'Janaria',
  DRINKS: 'Edariak',
};

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

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f8f8',
        fontFamily: 'system-ui, sans-serif',
        padding: '24px 16px 40px',
      }}
    >
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link
            href={`/${locale}/${slug}/track`}
            style={{ fontSize: 13, color: '#999', textDecoration: 'none' }}
          >
            ← {txosnaName}
          </Link>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>
            Eskaera #{order.orderNumber}
          </div>
          {order.customerName && (
            <div style={{ fontSize: 14, color: '#666' }}>{order.customerName}</div>
          )}
        </div>

        {/* Tickets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {tickets.length === 0 ? (
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: '20px 16px',
                fontSize: 14,
                color: '#666',
                textAlign: 'center',
              }}
            >
              {order.status === 'PENDING_PAYMENT' ? 'Ordaintze zain...' : 'Txartelik ez'}
            </div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: '16px 18px',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                  borderLeft: `4px solid ${STATUS_COLOR[t.status] ?? '#ccc'}`,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}
                >
                  {COUNTER_LABEL[t.counterType] ?? t.counterType}
                </div>
                <div
                  style={{ fontSize: 18, fontWeight: 700, color: STATUS_COLOR[t.status] ?? '#333' }}
                >
                  {STATUS_LABEL[t.status] ?? t.status}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Ready banner */}
        {allReady && (
          <div
            style={{
              background: '#22c55e',
              color: '#fff',
              borderRadius: 12,
              padding: '18px 20px',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: 17,
              marginBottom: 20,
            }}
          >
            Zure eskaera prest dago! Jaso dezakezu.
          </div>
        )}

        {/* Fiscal invoice */}
        {fiscalInvoice && (
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '16px 18px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
              marginBottom: 12,
              border: '1px solid #e5e7eb',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 6,
              }}
            >
              Txartel argia / Faktura
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 15,
                fontWeight: 700,
                color: '#111',
                marginBottom: 4,
              }}
            >
              {fiscalInvoice.series}-{String(fiscalInvoice.invoiceNumber).padStart(8, '0')}
            </div>
            <div
              style={{ fontSize: 13, color: '#6b7280', marginBottom: fiscalInvoice.qrUrl ? 8 : 0 }}
            >
              {new Date(fiscalInvoice.issuedAt).toLocaleString('eu-ES', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </div>
            {fiscalInvoice.qrUrl && (
              <a
                href={fiscalInvoice.qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  background: '#fff7f5',
                  color: '#e85d2f',
                  border: '1px solid #fbd0c3',
                  textDecoration: 'none',
                }}
              >
                QR kodea ikusi →
              </a>
            )}
          </div>
        )}

        {/* Download receipt */}
        <a
          href={`/${locale}/${slug}/track/${encodeURIComponent(code)}/receipt`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '14px 0',
            background: '#fff',
            border: '2px solid #e85d2f',
            borderRadius: 10,
            color: '#e85d2f',
            fontWeight: 700,
            fontSize: 15,
            textDecoration: 'none',
          }}
        >
          ↓ Deskargatu txartela
        </a>

        <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 16 }}>
          Kodea: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{code}</span>
        </div>
      </div>
    </div>
  );
}
