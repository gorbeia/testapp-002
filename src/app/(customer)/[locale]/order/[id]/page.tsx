'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CustomerHeader } from '@/components/layout/customer-header';
import { PrototypeNav } from '@/components/prototype-nav';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MOCK_TXOSNA } from '@/lib/mock-data';

// ── Mock order data for receipt ────────────────────────────────────────────────
const MOCK_ORDER_DETAIL = {
  number: 42,
  customerName: 'Josu',
  lines: [
    { name: 'Burgerra', variant: 'Patata frijituak', qty: 1, unitPrice: 8.5 },
    { name: 'Txorizoa ogian', variant: null, qty: 2, unitPrice: 4.0 },
  ],
  total: 16.5,
  createdAt: new Date().toLocaleString('eu-ES'),
};

function ReceiptDownload({ orderId: _orderId }: { orderId: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);

    // Build a plain-text receipt and trigger download via blob
    const o = MOCK_ORDER_DETAIL;
    const lines = [
      '================================',
      `  ${MOCK_TXOSNA.name}`,
      '================================',
      `Eskaera:    #${o.number}`,
      `Izena:      ${o.customerName}`,
      `Data:       ${o.createdAt}`,
      '--------------------------------',
      ...o.lines.map(
        (l) =>
          `${l.qty}x ${l.name}${l.variant ? ` (${l.variant})` : ''}  ${(l.qty * l.unitPrice).toFixed(2)}€`
      ),
      '--------------------------------',
      `GUZTIRA:    ${o.total.toFixed(2)}€`,
      '================================',
      'Eskerrik asko!',
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `txosna-eskaera-${o.number}.txt`;
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

type StatusStep = 'CONFIRMED' | 'IN_PREPARATION' | 'READY';

const STEPS: { key: StatusStep; label: string; icon: string }[] = [
  { key: 'CONFIRMED', label: 'Jasota', icon: '✓' },
  { key: 'IN_PREPARATION', label: 'Prestatzen', icon: '👨‍🍳' },
  { key: 'READY', label: 'Prest!', icon: '🎉' },
];

export default function OrderStatusPage() {
  const params = useParams();
  const [status, setStatus] = useState<StatusStep>('CONFIRMED');
  const [tick, setTick] = useState(0);

  // Simulate status progression for demo
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (tick === 8) setStatus('IN_PREPARATION');
    if (tick === 18) setStatus('READY');
  }, [tick]);

  const currentIdx = STEPS.findIndex((s) => s.key === status);
  const isReady = status === 'READY';

  return (
    <div className="cust-theme" style={{ minHeight: '100vh', background: 'var(--cust-bg)' }}>
      <CustomerHeader
        txosnaName={MOCK_TXOSNA.name}
        status={MOCK_TXOSNA.status}
        waitMinutes={MOCK_TXOSNA.waitMinutes ?? undefined}
        right={<ThemeToggle variant="cust" />}
      />
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
              color: isReady ? 'var(--cust-accent, #2d5a3d)' : 'var(--cust-primary, #e85d2f)',
              lineHeight: 1,
            }}
          >
            #42
          </div>
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

        {/* Progress steps */}
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
            const done = i < currentIdx;
            const active = i === currentIdx;
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
                      done || active
                        ? isReady && active
                          ? 'var(--cust-accent, #2d5a3d)'
                          : 'var(--cust-primary, #e85d2f)'
                        : 'var(--cust-bg, #faf8f5)',
                    border: `2px solid ${done || active ? (isReady && active ? 'var(--cust-accent, #2d5a3d)' : 'var(--cust-primary, #e85d2f)') : 'var(--cust-border, #e5e7eb)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                    transition: 'all 0.4s',
                  }}
                >
                  <span
                    style={{ color: done || active ? '#fff' : 'var(--cust-text-dim, #d1d5db)' }}
                  >
                    {done ? '✓' : step.icon}
                  </span>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: active ? 700 : 500,
                      color: active
                        ? 'var(--cust-text-pri, #111)'
                        : done
                          ? 'var(--cust-text-sec, #6b7280)'
                          : 'var(--cust-text-dim, #d1d5db)',
                    }}
                  >
                    {step.label}
                  </div>
                </div>
                {active && !isReady && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--cust-primary, #e85d2f)',
                          animation: `bounce 1.2s ease-in-out ${d * 0.2}s infinite`,
                          display: 'inline-block',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isReady && (
          <>
            <Link
              href={`/eu/order/${params.id}/proof`}
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
            <ReceiptDownload orderId={String(params.id)} />
          </>
        )}

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
          <strong style={{ color: 'var(--cust-text-pri, #111)' }}>Proto modua:</strong> Egoera
          automatikoki aldatzen da ({tick}s). Demo bakarrik.
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
      <PrototypeNav />
    </div>
  );
}
