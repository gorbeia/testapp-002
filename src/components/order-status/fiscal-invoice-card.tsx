'use client';

export interface FiscalInvoiceData {
  series: string;
  invoiceNumber: number;
  issuedAt: string;
  qrUrl: string | null;
}

export function FiscalInvoiceCard({ invoice }: { invoice: FiscalInvoiceData }) {
  const ref = `${invoice.series}-${String(invoice.invoiceNumber).padStart(8, '0')}`;

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
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--cust-text-pri, #111)',
          marginBottom: 4,
        }}
      >
        {ref}
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--cust-text-sec, #6b7280)',
          marginBottom: invoice.qrUrl ? 8 : 0,
        }}
      >
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
            marginTop: 2,
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
