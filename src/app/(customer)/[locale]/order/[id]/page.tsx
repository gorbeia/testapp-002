'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CustomerHeader } from '@/components/layout/customer-header';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { OrderNumberHeading } from '@/components/order-status/order-number-heading';
import { OrderProgressSteps } from '@/components/order-status/order-progress-steps';
import { OrderReadyBanner } from '@/components/order-status/order-ready-banner';
import {
  FiscalInvoiceCard,
  type FiscalInvoiceData,
} from '@/components/order-status/fiscal-invoice-card';
import { ReceiptDownload } from '@/components/order-status/receipt-download';

interface OrderWithTickets {
  id: string;
  orderNumber: number;
  txosnaId: string;
  status: string;
  verificationCode: string;
  customerName: string | null;
  total: number;
  channel: string;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
  expiresAt?: string | null;
  cancellationReason?: string | null;
  fiscalReceiptRef?: string | null;
  tickets: {
    id: string;
    counterType: string;
    status: string;
    readyAt: string | null;
    completedAt: string | null;
  }[];
}

function TicketBaiSection({ orderId }: { orderId: string }) {
  const [invoice, setInvoice] = useState<FiscalInvoiceData | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${orderId}/ticketbai-invoice`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: FiscalInvoiceData | null) => {
        if (data) setInvoice(data);
      })
      .catch(() => {});
  }, [orderId]);

  if (!invoice) return null;
  return <FiscalInvoiceCard invoice={invoice} />;
}

export default function OrderStatusPage() {
  const params = useParams();
  const [order, setOrder] = useState<OrderWithTickets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txosnaSlug, setTxosnaSlug] = useState('');

  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    async function loadOrder() {
      try {
        const slug = localStorage.getItem('txosna_slug');
        if (slug) setTxosnaSlug(slug);

        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          setError(response.status === 404 ? 'Eskaera ez da aurkitu' : 'Errorea gertatu da');
          return;
        }

        const data = await response.json();
        setOrder(data);
      } catch {
        setError('Ezin izan da eskaera kargatu');
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  useEffect(() => {
    if (!txosnaSlug || !order) return;

    const es = new EventSource(`/api/txosnak/${txosnaSlug}/events`);

    const handleUpdate = () => {
      fetch(`/api/orders/${orderId}`)
        .then((r) => r.json())
        .then(setOrder)
        .catch(() => {});
    };

    es.addEventListener('order:confirmed', handleUpdate);
    es.addEventListener('order:cancelled', handleUpdate);
    es.addEventListener('ticket:status_changed', handleUpdate);

    return () => es.close();
  }, [orderId, txosnaSlug, order]);

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handleCompletePayment = useCallback(async () => {
    setPaying(true);
    setPayError(null);
    try {
      const locale = Array.isArray(params.locale) ? params.locale[0] : (params.locale ?? '');
      const returnUrl = `${window.location.origin}/${locale}/order/${orderId}`;
      const res = await fetch('/api/payments/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, returnUrl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Errorea (${res.status})`);
      }
      const session = await res.json();
      window.location.href = session.url;
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Errorea gertatu da');
      setPaying(false);
    }
  }, [orderId, params.locale]);

  if (loading) {
    return (
      <div className="cust-theme" style={{ minHeight: '100vh', background: 'var(--cust-bg)' }}>
        <CustomerHeader txosnaName="Txosna" status="OPEN" right={<ThemeToggle variant="cust" />} />
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--cust-text-sec, #6b7280)' }}>Kargatzen...</div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="cust-theme" style={{ minHeight: '100vh', background: 'var(--cust-bg)' }}>
        <CustomerHeader txosnaName="Txosna" status="OPEN" right={<ThemeToggle variant="cust" />} />
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#ef4444', marginBottom: 16 }}>
            ⚠️ {error || 'Eskaera ez da aurkitu'}
          </div>
          <Link
            href={txosnaSlug ? `/${txosnaSlug}` : '/'}
            style={{
              color: 'var(--cust-primary, #e85d2f)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Itzuli menura →
          </Link>
        </div>
      </div>
    );
  }

  const isPending = order.status === 'PENDING_PAYMENT';
  const isOnlinePending = isPending && order.paymentMethod === 'ONLINE';
  const isCancelled = order.status === 'CANCELLED';

  const ticketStatuses = order.tickets?.map((t) => t.status) ?? [];
  const allReady =
    ticketStatuses.length > 0 && ticketStatuses.every((s) => s === 'READY' || s === 'COMPLETED');
  const anyInPrep = ticketStatuses.some((s) => s === 'IN_PREPARATION');
  const currentStep = allReady ? 2 : anyInPrep ? 1 : order.status === 'CONFIRMED' ? 0 : -1;
  const isReady = allReady;

  return (
    <div className="cust-theme" style={{ minHeight: '100vh', background: 'var(--cust-bg)' }}>
      <CustomerHeader txosnaName="Txosna" status="OPEN" right={<ThemeToggle variant="cust" />} />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 16px 60px' }}>
        <OrderNumberHeading
          orderNumber={order.orderNumber}
          isCancelled={isCancelled}
          isReady={isReady}
          isPending={isPending}
        />

        {isPending && !isOnlinePending && (
          <div
            style={{
              background: 'var(--cust-surface, #fff)',
              borderRadius: 14,
              border: '1px solid var(--cust-border, #e5e7eb)',
              padding: '16px',
              marginBottom: 20,
              fontSize: 13,
              color: 'var(--cust-text-sec, #6b7280)',
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: 8 }}>
              Zeure eskaera ordaindu nahi duzala itxaroten ari gara volontarioari.
            </div>
            <div style={{ fontSize: 12, fontStyle: 'italic' }}>
              {order.expiresAt && (
                <>Gehienez {new Date(order.expiresAt).toLocaleTimeString('eu-ES')}arte </>
              )}
              zain egongo da.
            </div>
          </div>
        )}

        {isOnlinePending && (
          <div
            style={{
              background: 'var(--cust-surface, #fff)',
              borderRadius: 14,
              border: '1px solid var(--cust-border, #e5e7eb)',
              padding: '16px',
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--cust-text-sec, #6b7280)', marginBottom: 12 }}>
              Ordainketa osatu gabe dago. Jarraitu ordainketak egiteko.
            </div>
            {payError && (
              <div
                style={{
                  fontSize: 12,
                  color: '#ef4444',
                  marginBottom: 10,
                  background: 'rgba(239,68,68,0.08)',
                  borderRadius: 8,
                  padding: '8px 12px',
                }}
              >
                {payError}
              </div>
            )}
            <button
              onClick={handleCompletePayment}
              disabled={paying}
              style={{
                background: 'var(--cust-primary, #e85d2f)',
                border: 'none',
                borderRadius: 10,
                padding: '12px 24px',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: paying ? 'not-allowed' : 'pointer',
                opacity: paying ? 0.7 : 1,
                width: '100%',
              }}
            >
              {paying ? 'Kargatzen...' : '💳 Ordainketa osatu'}
            </button>
          </div>
        )}

        {isCancelled && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              borderRadius: 14,
              border: '1px solid #ef4444',
              padding: '16px',
              marginBottom: 20,
              fontSize: 13,
              color: '#ef4444',
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: 600 }}>Eskaera ezeztatua dago</div>
            <div style={{ fontSize: 12 }}>Arrazoia: {order.cancellationReason || 'Ezeztatua'}</div>
          </div>
        )}

        {!isPending && !isCancelled && (
          <OrderProgressSteps currentStep={currentStep} isReady={isReady} />
        )}

        {isReady && orderId && (
          <>
            <Link
              href={`/${params.locale}/${orderId}/proof`}
              style={{
                display: 'block',
                background: 'var(--cust-accent, #2d5a3d)',
                borderRadius: 12,
                padding: '15px 20px',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                marginBottom: 10,
              }}
            >
              Jasotzeko kodea ikusi →
            </Link>
            <ReceiptDownload orderId={orderId} />
            {order.fiscalReceiptRef && <TicketBaiSection orderId={orderId} />}
          </>
        )}

        {!isReady && !isCancelled && (
          <div
            style={{
              background: 'var(--cust-surface, #fff)',
              borderRadius: 14,
              border: '1px solid var(--cust-border, #e5e7eb)',
              padding: '14px 16px',
              fontSize: 13,
              color: 'var(--cust-text-sec, #6b7280)',
            }}
          >
            <strong style={{ color: 'var(--cust-text-pri, #111)' }}>Edukia:</strong> Orri hau
            automatikoki eguneratzen da. Freskatzen ez bada, berritzen saia zaitez.
          </div>
        )}
      </div>
    </div>
  );
}
