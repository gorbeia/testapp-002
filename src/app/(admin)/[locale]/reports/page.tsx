'use client';
import { useState, useEffect } from 'react';

interface ReportData {
  ordersTotal: number;
  ordersConfirmed: number;
  revenue: number;
  avgOrderValue: number;
  topProducts: { name: string; quantitySold: number; revenue: number }[];
  ticketsByStatus: Record<string, number>;
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'all'>('today');
  const [slug, setSlug] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [txosnaName, setTxosnaName] = useState('Txosna');

  // For admin pages, get slug from the first txosna in the association
  useEffect(() => {
    fetch('/api/admin/txosnak')
      .then((r) => r.json())
      .then((d: { txosnak?: { slug: string; name: string }[] }) => {
        const first = d.txosnak?.[0];
        if (first) {
          setSlug(first.slug);
          setTxosnaName(first.name);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/txosnak/${slug}/reports?period=${dateRange}`)
      .then((r) => r.json())
      .then((d: ReportData) => setReport(d))
      .catch(() => {});
  }, [slug, dateRange]);

  const totalOrders = report?.ordersTotal ?? 0;
  const completedOrders = report?.ordersConfirmed ?? 0;
  const totalRevenue = report?.revenue ?? 0;
  const avgOrderValue = report?.avgOrderValue ?? 0;
  const productStats = report?.topProducts ?? [];
  const ticketStats = {
    received: report?.ticketsByStatus?.RECEIVED ?? 0,
    inPrep: report?.ticketsByStatus?.IN_PREPARATION ?? 0,
    ready: report?.ticketsByStatus?.READY ?? 0,
    completed: report?.ticketsByStatus?.COMPLETED ?? 0,
  };

  return (
    <div style={{ padding: '32px 32px 60px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: 'var(--font-nunito, sans-serif)',
            fontSize: 26,
            fontWeight: 800,
            color: 'var(--adm-text-pri)',
            margin: '0 0 4px',
          }}
        >
          Txostena
        </h1>
        <div style={{ fontSize: 14, color: 'var(--adm-text-sec)' }}>
          {txosnaName} · Gertaera amaierako laburpena
        </div>
      </div>

      {/* Date range selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { key: 'today', label: 'Gaur' },
          { key: 'week', label: 'Asteburu' },
          { key: 'all', label: 'Guztia' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setDateRange(opt.key as typeof dateRange)}
            style={{
              background: dateRange === opt.key ? 'var(--adm-text-pri)' : 'var(--adm-surface-hi)',
              border: '1px solid var(--adm-border)',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              color: dateRange === opt.key ? 'var(--adm-surface)' : 'var(--adm-text-pri)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Key metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: 'Eskariak',
            value: totalOrders,
            sub: `${completedOrders} baieztatuta`,
            accent: 'var(--adm-text-pri)',
          },
          {
            label: 'Diru-sarrera',
            value: `${totalRevenue.toFixed(0)}€`,
            sub: 'guztira',
            accent: 'var(--adm-text-pri)',
          },
          {
            label: 'Batez besteko',
            value: `${avgOrderValue.toFixed(2)}€`,
            sub: 'eskaera bakoitzeko',
            accent: 'var(--adm-text-pri)',
          },
          {
            label: 'Osatuta',
            value: completedOrders,
            sub: 'baieztatutakoak',
            accent: 'var(--adm-text-pri)',
          },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              background: 'var(--adm-surface)',
              border: '1px solid var(--adm-border)',
              borderRadius: 12,
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--adm-text-sec)',
                marginBottom: 8,
              }}
            >
              {m.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 32,
                fontWeight: 800,
                color: m.accent,
              }}
            >
              {m.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--adm-text-sec)', marginTop: 4 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Product popularity */}
        <div
          style={{
            background: 'var(--adm-surface)',
            border: '1px solid var(--adm-border)',
            borderRadius: 12,
            padding: '20px 22px',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--adm-text-pri)',
              marginBottom: 16,
            }}
          >
            Produktu salduenak
          </div>
          {productStats.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--adm-text-sec)' }}>Ez dago daturik.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {productStats.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--adm-text-dim)',
                      width: 20,
                    }}
                  >
                    {i + 1}.
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--adm-text-pri)' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--adm-text-sec)' }}>
                      {p.quantitySold} saldu · {p.revenue.toFixed(0)}€
                    </div>
                  </div>
                  <div
                    style={{
                      width: 80,
                      height: 6,
                      background: 'var(--adm-surface-hi)',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${productStats[0] ? (p.quantitySold / productStats[0].quantitySold) * 100 : 0}%`,
                        height: '100%',
                        background: '#e85d2f',
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ticket flow */}
        <div
          style={{
            background: 'var(--adm-surface)',
            border: '1px solid var(--adm-border)',
            borderRadius: 12,
            padding: '20px 22px',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--adm-text-pri)',
              marginBottom: 16,
            }}
          >
            Txartelen egoera
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Jasota', count: ticketStats.received, color: '#3b82f6' },
              { label: 'Prestatzen', count: ticketStats.inPrep, color: '#f59e0b' },
              { label: 'Prest', count: ticketStats.ready, color: '#22c55e' },
              { label: 'Osatuta', count: ticketStats.completed, color: 'var(--adm-text-sec)' },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'var(--adm-surface-hi)',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }}
                  />
                  <span style={{ fontSize: 14, color: 'var(--adm-text-pri)' }}>{s.label}</span>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--adm-text-pri)',
                  }}
                >
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
