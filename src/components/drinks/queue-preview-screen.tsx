'use client';
import { OpsHeader } from '@/components/layout/ops-header';
import type { DrinksQueueOrder } from '@/app/(volunteer)/[locale]/drinks/_types';

interface QueuePreviewScreenProps {
  queuePreview: DrinksQueueOrder;
  onBack: () => void;
  onConfirm: () => void;
}

export function QueuePreviewScreen({ queuePreview, onBack, onConfirm }: QueuePreviewScreenProps) {
  return (
    <div
      className="ops-theme"
      style={{ minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)' }}
    >
      <OpsHeader
        title="Ilaran gehitu"
        left={
          <button
            onClick={onBack}
            style={{
              fontSize: 13,
              color: 'var(--ops-text-sec)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 2px',
            }}
          >
            ← Atzera
          </button>
        }
      />

      <div
        style={{ padding: '24px 14px 160px', display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        <div
          style={{
            background: 'var(--ops-surface)',
            border: '2px solid var(--ops-orange)',
            borderRadius: 16,
            padding: '24px 18px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--ops-text-sec)',
              marginBottom: 8,
            }}
          >
            Zenbakia
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 72,
              fontWeight: 900,
              color: 'var(--ops-orange)',
              lineHeight: 1,
            }}
          >
            #{queuePreview.number}
          </div>
          {queuePreview.customerName && (
            <div
              style={{ marginTop: 10, fontSize: 18, fontWeight: 600, color: 'var(--ops-text-sec)' }}
            >
              {queuePreview.customerName}
            </div>
          )}
        </div>

        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ops-text-sec)',
              marginBottom: 10,
            }}
          >
            EDARIAK
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {queuePreview.items.map((item, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--ops-surface)',
                  border: '1px solid var(--ops-border)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 20,
                    fontWeight: 800,
                    color: 'var(--ops-orange)',
                    minWidth: 36,
                  }}
                >
                  {item.qty}×
                </span>
                <span
                  style={{ flex: 1, fontSize: 16, fontWeight: 600, color: 'var(--ops-text-pri)' }}
                >
                  {item.name}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 14,
                    color: 'var(--ops-text-sec)',
                  }}
                >
                  {(item.qty * item.price).toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: 'var(--ops-surface)',
            border: '1px solid var(--ops-border)',
            borderRadius: 12,
            padding: '16px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ops-text-sec)' }}>
            Guztira
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--ops-text-pri)',
            }}
          >
            {queuePreview.total.toFixed(2)} €
          </span>
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 14px 28px',
          background: 'var(--ops-bg)',
          borderTop: '1px solid var(--ops-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <button
          onClick={onConfirm}
          style={{
            width: '100%',
            background: 'var(--ops-orange)',
            border: 'none',
            borderRadius: 12,
            padding: '18px',
            color: '#fff',
            fontSize: 17,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Ilaran gehitu — #{queuePreview.number}
        </button>
        <button
          onClick={onBack}
          style={{
            width: '100%',
            background: 'none',
            border: '1px solid var(--ops-border)',
            borderRadius: 12,
            padding: '14px',
            color: 'var(--ops-text-sec)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Atzera
        </button>
      </div>
    </div>
  );
}
