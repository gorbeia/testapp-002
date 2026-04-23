'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

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

interface TxosnaData {
  name: string;
  status: 'OPEN' | 'PAUSED' | 'CLOSED';
  waitMinutes?: number | null;
  associationId?: string;
}

interface ReportData {
  ordersConfirmed: number;
  revenue: number;
  ticketsByStatus: Record<string, number>;
}

export default function TxosnaDashboard() {
  const { txosnaId } = useParams<{ txosnaId: string }>();
  const slug = txosnaId;

  const [txosna, setTxosna] = useState<TxosnaData | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [activeVols, setActiveVols] = useState(0);
  const [totalVols, setTotalVols] = useState(0);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/txosnak/${slug}`)
      .then((r) => r.json())
      .then((d: TxosnaData) => {
        setTxosna(d);
        if (d.associationId) {
          fetch(`/api/associations/${d.associationId}/volunteers`)
            .then((r) => r.json())
            .then((vd: { volunteers?: { active: boolean }[] }) => {
              const vols = vd.volunteers ?? [];
              setActiveVols(vols.filter((v) => v.active).length);
              setTotalVols(vols.length);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    fetch(`/api/txosnak/${slug}/reports?period=today`)
      .then((r) => r.json())
      .then((d: ReportData) => setReport(d))
      .catch(() => {});
  }, [slug]);

  if (!txosna) return <div style={{ padding: 40, color: 'var(--adm-text-sec)' }}>Kargatzen…</div>;

  const openTickets =
    (report?.ticketsByStatus?.RECEIVED ?? 0) + (report?.ticketsByStatus?.IN_PREPARATION ?? 0);
  const readyTickets = report?.ticketsByStatus?.READY ?? 0;
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
          value={`${(report?.revenue ?? 0).toFixed(2)} €`}
          sub="baieztatutakoak"
          accent="#3b82f6"
        />
        <StatCard
          label="Boluntarioak"
          value={activeVols}
          sub={`${totalVols} guztira`}
          accent="#8b5cf6"
        />
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
  );
}
