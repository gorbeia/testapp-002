'use client';
import { QrCode } from '@/components/qr-code';

interface HandoffCardProps {
  orderNumber: number;
  verificationCode: string;
  trackingUrl: string;
  trackingEntryPath: string;
  onDismiss: () => void;
}

export function HandoffCard({
  orderNumber,
  verificationCode,
  trackingUrl,
  trackingEntryPath,
  onDismiss,
}: HandoffCardProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: 'var(--vol-surface, #1a1a2e)',
          border: '2px solid #e85d2f',
          borderRadius: 16,
          padding: '28px 24px',
          maxWidth: 340,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          color: '#fff',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.7, letterSpacing: 1 }}>
          ESKAERA #{orderNumber}
        </div>

        <div style={{ fontSize: 13, textAlign: 'center', opacity: 0.85 }}>
          Eman kode hau bezeroari
        </div>

        <div
          style={{
            background: '#fff',
            color: '#000',
            borderRadius: 10,
            padding: '14px 28px',
            fontFamily: 'monospace',
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 4,
          }}
        >
          {verificationCode}
        </div>

        <QrCode value={trackingUrl} size={160} />

        <div style={{ fontSize: 12, opacity: 0.6, textAlign: 'center' }}>
          Edo geroago idatzi hemen:
          <br />
          <span style={{ fontFamily: 'monospace', opacity: 0.9 }}>{trackingEntryPath}</span>
        </div>

        <button
          onClick={onDismiss}
          style={{
            width: '100%',
            padding: '14px 0',
            background: '#e85d2f',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Itxi
        </button>
      </div>
    </div>
  );
}
