'use client';
import { QrCode } from '@/components/qr-code';

export interface FiscalInvoiceData {
  series: string;
  invoiceNumber: number;
  issuedAtFormatted: string;
  qrUrl: string | null;
  providerRef?: string | null;
}

export function FiscalInvoiceCard({ invoice }: { invoice: FiscalInvoiceData }) {
  const ref = `${invoice.series}-${String(invoice.invoiceNumber).padStart(8, '0')}`;
  const tbaiCode = invoice.providerRef ?? ref;

  return (
    <div
      style={{
        background: 'var(--cust-surface, #fff)',
        border: '1px solid var(--cust-border, #e5e7eb)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 12,
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--cust-text-sec, #9ca3af)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 8,
        }}
      >
        Txartel argia / Faktura
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {invoice.qrUrl && (
          <a
            href={invoice.qrUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Egiaztatu zerga agintaritzan"
            style={{ flexShrink: 0 }}
          >
            <QrCode value={invoice.qrUrl} size={96} />
          </a>
        )}

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--cust-text-pri, #111)',
              marginBottom: 2,
              wordBreak: 'break-all',
            }}
          >
            {tbaiCode}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--cust-text-sec, #6b7280)',
              marginBottom: invoice.qrUrl ? 8 : 0,
            }}
          >
            {invoice.issuedAtFormatted}
          </div>
          {invoice.qrUrl && (
            <a
              href={invoice.qrUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                background: 'var(--cust-primary-light, #fff7f5)',
                color: 'var(--cust-primary, #e85d2f)',
                border: '1px solid var(--cust-primary-light, #fbd0c3)',
                textDecoration: 'none',
              }}
            >
              Egiaztatu →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
