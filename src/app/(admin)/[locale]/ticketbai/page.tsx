'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TicketBaiInvoice {
  id: string;
  associationId: string;
  orderId: string;
  orderNumber: number;
  series: string;
  invoiceNumber: number;
  issuedAt: string;
  sellerName: string;
  sellerCif: string;
  total: number;
  chainId: string;
  providerRef: string | null;
  qrUrl: string | null;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  MOCK: '#9ca3af',
  SUBMITTED: '#3b82f6',
  ACCEPTED: '#22c55e',
  REJECTED: '#ef4444',
  PENDING: '#f59e0b',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        background: (STATUS_COLORS[status] ?? '#9ca3af') + '20',
        color: STATUS_COLORS[status] ?? '#9ca3af',
      }}
    >
      {status}
    </span>
  );
}

export default function TicketBaiInvoicesPage() {
  const [invoices, setInvoices] = useState<TicketBaiInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        const assocId: string = session?.user?.associationId ?? '';
        if (!assocId) return;
        const res = await fetch(`/api/associations/${assocId}/ticketbai/invoices`);
        if (!res.ok) throw new Error(`Errorea (${res.status})`);
        const data: TicketBaiInvoice[] = await res.json();
        setInvoices(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errorea gertatu da');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: '32px 32px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Link
          href="settings"
          style={{
            fontSize: 13,
            color: 'var(--adm-text-sec)',
            textDecoration: 'none',
          }}
        >
          ← Ezarpenak
        </Link>
        <h1
          style={{
            fontFamily: 'var(--font-nunito, sans-serif)',
            fontSize: 24,
            fontWeight: 800,
            color: 'var(--adm-text-pri)',
            margin: 0,
          }}
        >
          TicketBAI Fakturak
        </h1>
      </div>

      {error && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid #ef4444',
            borderRadius: 8,
            fontSize: 13,
            color: '#ef4444',
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--adm-text-sec)', fontSize: 14 }}>Kargatzen...</div>
      ) : invoices.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            background: 'var(--adm-surface)',
            border: '1px dashed var(--adm-border)',
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 14, color: 'var(--adm-text-pri)', fontWeight: 500 }}>
            Ez dago faktura sorturik oraindik
          </div>
          <div style={{ fontSize: 13, color: 'var(--adm-text-sec)', marginTop: 4 }}>
            Agindu bat berretsi ondoren faktura automatikoki sortuko da
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--adm-surface)',
            border: '1px solid var(--adm-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--adm-border)',
                  background: 'var(--adm-surface-hi)',
                }}
              >
                {['Faktura zenbakia', 'Eskaera', 'Data', 'Guztira', 'Egoera', 'QR'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'var(--adm-text-sec)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, idx) => (
                <tr
                  key={inv.id}
                  style={{
                    borderBottom:
                      idx < invoices.length - 1 ? '1px solid var(--adm-border)' : 'none',
                  }}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace' }}>
                    {inv.series}-{String(inv.invoiceNumber).padStart(8, '0')}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--adm-text-sec)' }}>
                    #{inv.orderNumber}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--adm-text-sec)' }}>
                    {new Date(inv.issuedAt).toLocaleString('eu-ES', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontWeight: 600,
                      color: 'var(--adm-text-pri)',
                    }}
                  >
                    {inv.total.toFixed(2)}€
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={inv.status} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {inv.qrUrl ? (
                      <a
                        href={inv.qrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 12,
                          color: 'var(--adm-primary, #e85d2f)',
                          textDecoration: 'none',
                          fontWeight: 500,
                        }}
                      >
                        QR →
                      </a>
                    ) : (
                      <span style={{ color: 'var(--adm-text-sec)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
