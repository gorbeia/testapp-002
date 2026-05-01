'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CustomerHeader } from '@/components/layout/customer-header';
import { ThemeToggle } from '@/components/ui/theme-toggle';
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

interface TicketBaiInvoiceData {
  id: string;
  series: string;
  invoiceNumber: number;
  issuedAt: string;
  total: number;
  qrUrl: string | null;
  status: string;
}

function TicketBaiSection({ orderId }: { orderId: string }) {
  const [invoice, setInvoice] = useState<TicketBaiInvoiceData | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${orderId}/ticketbai-invoice`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: TicketBaiInvoiceData | null) => {
        if (data) setInvoice(data);
      })
      .catch(() => {});
  }, [orderId]);

  if (!invoice) return null;

  const invoiceRef = `${invoice.series}-${String(invoice.invoiceNumber).padStart(8, '0')}`;

  return (
    <div
      style={{
        background: 'var(--cust-surface, #fff)',
        border: '1px solid var(--cust-border, #e5e7eb)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--cust-text-sec, #6b7280)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 8,
        }}
      >
        Txartel argia / Faktura
      </div>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--cust-text-pri, #111)',
          marginBottom: 4,
        }}
      >
        {invoiceRef}
      </div>
      <div style={{ fontSize: 13, color: 'var(--cust-text-sec, #6b7280)' }}>
        {new Date(invoice.issuedAt).toLocaleString('eu-ES', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </div>
      {invoice.qrUrl && (
        <a
          href={invoice.qrUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginTop: 10,
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: 'var(--cust-primary-light, #fff7f5)',
            color: 'var(--cust-primary, #e85d2f)',
            border: '1px solid var(--cust-primary-light, #fbd0c3)',
            textDecoration: 'none',
          }}
        >
          QR kodea ikusi →
        </a>
      )}
    </div>
  );
}

function ReceiptDownload({ orderId: _orderId }: { orderId: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);

    // Build a plain-text receipt and trigger download via blob
    const lines = [
      '================================',
      `  Txosna Eskaera Agiri`,
      '================================',
      `Eskaera zenbakia: #${_orderId}`,
      `Data: ${new Date().toLocaleString('eu-ES')}`,
      '--------------------------------',
      `GUZTIRA: 0.00€`,
      '================================',
      'Eskerrik asko!',
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `txosna-eskaera-${_orderId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloading(false), 1500);
  };

  return (
    <button
      onClick={handleDownload}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        background: 'var(--cust-surface, #fff)',
        border: '1px solid var(--cust-border, #e5e7eb)',
        borderRadius: 12,
        padding: '13px 20px',
        color: 'var(--cust-text-pri, #111)',
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer',
        marginBottom: 12,
        transition: 'background 0.15s',
      }}
    >
      {downloading ? <>⏳ Deskargatzen...</> : <>⬇️ Ordainagiri digitala deskargatu</>}
    </button>
  );
}

type StatusStep = 'PENDING_PAYMENT' | 'CONFIRMED' | 'IN_PREPARATION' | 'READY' | 'CANCELLED';

const STEPS: {
  key: Exclude<StatusStep, 'PENDING_PAYMENT' | 'CANCELLED'>;
  label: string;
  icon: string;
}[] = [
  { key: 'CONFIRMED', label: 'Jasota', icon: '✓' },
  { key: 'IN_PREPARATION', label: 'Prestatzen', icon: '👨‍🍳' },
  { key: 'READY', label: 'Prest!', icon: '🎉' },
];

export default function OrderStatusPage() {
  const params = useParams();
  const [order, setOrder] = useState<OrderWithTickets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txosnaSlug, setTxosnaSlug] = useState('');

  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Fetch order on mount
  useEffect(() => {
    async function loadOrder() {
      try {
        const slug = localStorage.getItem('txosna_slug');
        if (slug) setTxosnaSlug(slug);

        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Eskaera ez da aurkitu');
          } else {
            setError('Errorea gertatu da');
          }
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

  // Subscribe to SSE updates if we have txosnaSlug
  useEffect(() => {
    if (!txosnaSlug || !order) return;

    const es = new EventSource(`/api/txosnak/${txosnaSlug}/events`);

    const handleUpdate = () => {
      // Refetch order when status changes
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

  // Derive current step from ticket statuses
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
        {/* Order number */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: 'var(--cust-text-sec, #6b7280)', marginBottom: 4 }}>
            Zure eskaera zenbakia
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 56,
              fontWeight: 800,
              color: isCancelled
                ? '#ef4444'
                : isReady
                  ? 'var(--cust-accent, #2d5a3d)'
                  : 'var(--cust-primary, #e85d2f)',
              lineHeight: 1,
            }}
          >
            #{order.orderNumber}
          </div>

          {isPending && (
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--cust-primary, #e85d2f)',
                marginTop: 8,
              }}
            >
              Zain... 📞
            </div>
          )}

          {isCancelled && (
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#ef4444',
                marginTop: 8,
              }}
            >
              Eskaera ezeztatua ❌
            </div>
          )}

          {isReady && (
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--cust-accent, #2d5a3d)',
                marginTop: 8,
              }}
            >
              Zure eskaera prest dago! 🎉
            </div>
          )}
        </div>

        {/* Status info */}
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
          <div
            style={{
              background: 'var(--cust-surface, #fff)',
              borderRadius: 16,
              border: '1px solid var(--cust-border, #e5e7eb)',
              padding: '20px 20px 24px',
              marginBottom: 20,
            }}
          >
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div
                  key={step.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    marginBottom: i < STEPS.length - 1 ? 20 : 0,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background:
                        done || isReady
                          ? 'var(--cust-primary, #e85d2f)'
                          : 'var(--cust-bg, #faf8f5)',
                      border: `2px solid ${done || isReady ? 'var(--cust-primary, #e85d2f)' : 'var(--cust-border, #e5e7eb)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        color: done || isReady ? '#fff' : 'var(--cust-text-dim, #d1d5db)',
                      }}
                    >
                      {done ? '✓' : step.icon}
                    </span>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: active ? 700 : 500,
                        color:
                          done || isReady
                            ? 'var(--cust-text-pri, #111)'
                            : 'var(--cust-text-dim, #d1d5db)',
                      }}
                    >
                      {step.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
