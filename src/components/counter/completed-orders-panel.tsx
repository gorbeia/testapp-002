'use client';
import { QrCode } from '@/components/qr-code';
import type { CompletedOrderEntry } from '@/app/(volunteer)/[locale]/counter/_types';

interface CompletedOrdersPanelProps {
  completedOrders: CompletedOrderEntry[];
  completedPanelOpen: boolean;
  setCompletedPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  expandedQr: string | null;
  setExpandedQr: (v: string | null) => void;
  slug: string;
}

export function CompletedOrdersPanel({
  completedOrders,
  completedPanelOpen,
  setCompletedPanelOpen,
  expandedQr,
  setExpandedQr,
  slug,
}: CompletedOrdersPanelProps) {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--ops-surface)',
          borderTop: '2px solid var(--ops-border)',
          zIndex: 200,
        }}
      >
        <button
          onClick={() => setCompletedPanelOpen((o) => !o)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            color: 'var(--ops-text-pri)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Bukatutako eskaerak ({completedOrders.length})</span>
          <span>{completedPanelOpen ? '▴' : '▾'}</span>
        </button>
        {completedPanelOpen && (
          <div style={{ maxHeight: 320, overflowY: 'auto', padding: '0 12px 12px' }}>
            {completedOrders.map((o) => {
              const trackUrl =
                typeof window !== 'undefined'
                  ? `${window.location.origin}/eu/${slug}/track/${o.verificationCode}`
                  : '';
              return (
                <div
                  key={o.orderNumber}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: '1px solid var(--ops-border)',
                  }}
                >
                  <div style={{ flex: 1, fontSize: 13 }}>
                    <span style={{ fontWeight: 700 }}>#{o.orderNumber}</span>
                    {o.customerName && <span style={{ opacity: 0.7 }}> · {o.customerName}</span>}
                    <br />
                    <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 600 }}>
                      {o.verificationCode}
                    </span>
                  </div>
                  <div
                    onClick={() =>
                      setExpandedQr(expandedQr === o.verificationCode ? null : o.verificationCode)
                    }
                    style={{ cursor: 'pointer' }}
                    title="QR handitu"
                  >
                    <QrCode value={trackUrl} size={48} />
                  </div>
                  <a
                    href={trackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 18, textDecoration: 'none' }}
                    title="Ireki jarraipena"
                  >
                    ↗
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expanded QR overlay */}
      {expandedQr && (
        <div
          onClick={() => setExpandedQr(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <QrCode
            value={
              typeof window !== 'undefined'
                ? `${window.location.origin}/eu/${slug}/track/${expandedQr}`
                : ''
            }
            size={280}
          />
        </div>
      )}
    </>
  );
}
