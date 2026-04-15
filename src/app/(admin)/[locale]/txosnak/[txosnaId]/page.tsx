'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MOCK_ASSOCIATION, MOCK_TICKETS, MOCK_ORDERS, MOCK_VOLUNTEERS } from '@/lib/mock-data';

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Irekita',
  PAUSED: 'Geldituta',
  CLOSED: 'Itxita',
};
const STATUS_COLOR: Record<string, string> = {
  OPEN: '#22c55e',
  PAUSED: '#f59e0b',
  CLOSED: '#6b7280',
};

function StatCard({
  label,
  value,
  sub,
  accent = '#e85d2f',
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--adm-surface)',
        border: '1px solid var(--adm-border)',
        borderRadius: 12,
        padding: '16px 18px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: 'var(--adm-text-sec)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 30,
          fontWeight: 800,
          color: accent,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--adm-text-sec)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function TxosnaDashboard() {
  const { txosnaId } = useParams<{ txosnaId: string }>();
  const txosna = MOCK_ASSOCIATION.txosnak.find((t) => t.id === txosnaId);

  if (!txosna)
    return <div style={{ padding: 40, color: 'var(--adm-text-sec)' }}>Txosna ez da aurkitu.</div>;

  const openTickets = MOCK_TICKETS.filter(
    (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
  ).length;
  const readyTickets = MOCK_TICKETS.filter((t) => t.status === 'READY').length;
  const totalRevenue = MOCK_ORDERS.reduce((sum, o) => sum + o.total, 0);
  const activeVols = MOCK_VOLUNTEERS.filter((v) => v.active).length;

  const base = `/eu/txosnak/${txosnaId}`;

  return (
    <div style={{ padding: '32px 32px 60px', background: 'var(--adm-bg)', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: 'var(--adm-text-sec)', marginBottom: 12 }}>
        <Link href="/eu/txosnak" style={{ color: 'var(--adm-text-sec)', textDecoration: 'none' }}>
          Elkartea
        </Link>
        <span style={{ margin: '0 6px' }}>›</span>
        <span style={{ color: 'var(--adm-text-pri)' }}>{txosna.name}</span>
      </div>

      {/* Header */}
      <div
        style={{
          marginBottom: 28,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-nunito, sans-serif)',
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--adm-text-pri)',
              margin: '0 0 6px',
            }}
          >
            {txosna.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: STATUS_COLOR[txosna.status],
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 14, color: 'var(--adm-text-sec)' }}>
              {STATUS_LABEL[txosna.status]}
              {txosna.waitMinutes ? ` · ~${txosna.waitMinutes} min itxaron` : ''}
            </span>
            {txosna.location && (
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--adm-text-sec)',
                  borderLeft: '1px solid var(--adm-border)',
                  paddingLeft: 8,
                }}
              >
                {txosna.location}
              </span>
            )}
          </div>
        </div>
        <Link
          href={`${base}/settings`}
          style={{
            background: 'var(--adm-surface)',
            border: '1px solid var(--adm-border)',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            color: 'var(--adm-text-sec)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          ⚙️ Ezarpenak
        </Link>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 28,
        }}
      >
        <StatCard label="Txartel irekiak" value={openTickets} sub="prozesatzen" accent="#e85d2f" />
        <StatCard label="Jasotzeko prest" value={readyTickets} sub="itxaroten" accent="#22c55e" />
        <StatCard
          label="Diru-sarrera gaur"
          value={`${txosna.revenueToday ?? totalRevenue.toFixed(0)} €`}
          sub="demo datuak"
          accent="#3b82f6"
        />
        <StatCard
          label="Boluntarioak"
          value={activeVols}
          sub={`${MOCK_VOLUNTEERS.length} guztira`}
          accent="#8b5cf6"
        />
      </div>

      {/* Two-column content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent orders */}
        <div
          style={{
            background: 'var(--adm-surface)',
            border: '1px solid var(--adm-border)',
            borderRadius: 12,
            padding: '16px 18px',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--adm-text-pri)',
              marginBottom: 12,
            }}
          >
            Azken eskariak
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MOCK_ORDERS.slice(0, 4).map((order) => (
              <div
                key={order.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 700,
                      color: 'var(--adm-text-pri)',
                    }}
                  >
                    #{order.orderNumber}
                  </span>
                  <span style={{ color: 'var(--adm-text-sec)' }}>{order.customerName}</span>
                </div>
                <span style={{ fontWeight: 600, color: '#e85d2f' }}>
                  {order.total.toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div
          style={{
            background: 'var(--adm-surface)',
            border: '1px solid var(--adm-border)',
            borderRadius: 12,
            padding: '16px 18px',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--adm-text-pri)',
              marginBottom: 12,
            }}
          >
            Ekintza azkarrak
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Menua editatu', href: `${base}/menu`, icon: '🍽' },
              { label: 'Boluntarioak kudeatu', href: `${base}/volunteers`, icon: '👥' },
              { label: 'Txostena ikusi', href: `${base}/reports`, icon: '📈' },
              { label: 'Konfigurazioa', href: `${base}/settings`, icon: '⚙️' },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--adm-border)',
                  background: 'var(--adm-surface-hi)',
                  textDecoration: 'none',
                  fontSize: 13,
                  color: 'var(--adm-text-pri)',
                  fontWeight: 500,
                }}
              >
                <span>{a.icon}</span>
                <span>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
