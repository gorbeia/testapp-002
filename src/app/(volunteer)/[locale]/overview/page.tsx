'use client';
import Link from 'next/link';
import { OpsHeader } from '@/components/layout/ops-header';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MOCK_TXOSNA, MOCK_TICKETS, MOCK_VOLUNTEERS } from '@/lib/mock-data';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

function StatCard({ label, value, sub, accent = 'var(--ops-orange)' }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--ops-surface)',
        border: '1px solid var(--ops-border)',
        borderRadius: 12,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: 'var(--ops-text-sec)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 32,
          fontWeight: 800,
          color: accent,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ops-text-dim)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function OverviewPage() {
  const tickets = MOCK_TICKETS;
  const received = tickets.filter((t) => t.status === 'RECEIVED').length;
  const inPrep = tickets.filter((t) => t.status === 'IN_PREPARATION').length;
  const ready = tickets.filter((t) => t.status === 'READY').length;
  const slow = tickets.filter((t) => t.isSlowOrder).length;
  const activeVols = MOCK_VOLUNTEERS.filter((v) => v.active).length;

  return (
    <div
      className="ops-theme"
      style={{ minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)' }}
    >
      <OpsHeader
        title={MOCK_TXOSNA.name}
        subtitle="Egoera ikuspegi"
        statusColor="green"
        right={<ThemeToggle variant="ops" />}
      />

      <div style={{ padding: '16px 14px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Live stats */}
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
            Orain bertan
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <StatCard
              label="Itxaroten"
              value={received}
              sub="eskaera"
              accent="var(--ops-blue, #3b82f6)"
            />
            <StatCard
              label="Prestatzen"
              value={inPrep}
              sub="eskaera"
              accent="var(--ops-amber, #f59e0b)"
            />
            <StatCard label="Prest" value={ready} sub="jasotzeko" accent="var(--ops-green)" />
            <StatCard
              label="Motel"
              value={slow}
              sub="eskaera"
              accent={slow > 0 ? 'var(--ops-red)' : 'var(--ops-text-dim)'}
            />
          </div>
        </div>

        {/* Txosna status */}
        <div
          style={{
            background: 'var(--ops-surface)',
            border: '1px solid var(--ops-border)',
            borderRadius: 12,
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ops-text-sec)',
              marginBottom: 12,
            }}
          >
            Txosna egoera
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              {
                label: 'Egoera',
                value:
                  MOCK_TXOSNA.status === 'OPEN'
                    ? 'IREKITA'
                    : MOCK_TXOSNA.status === 'PAUSED'
                      ? 'GELDITUTA'
                      : 'ITXITA',
                color:
                  MOCK_TXOSNA.status === 'OPEN'
                    ? 'var(--ops-green)'
                    : MOCK_TXOSNA.status === 'PAUSED'
                      ? 'var(--ops-amber, #f59e0b)'
                      : 'var(--ops-text-dim)',
              },
              {
                label: 'Itxaron denbora',
                value: `~${MOCK_TXOSNA.waitMinutes ?? 0} min`,
                color: 'var(--ops-text-pri)',
              },
              {
                label: 'Boluntarioak aktibo',
                value: `${activeVols} / ${MOCK_VOLUNTEERS.length}`,
                color: 'var(--ops-text-pri)',
              },
            ].map((row) => (
              <div
                key={row.label}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ fontSize: 13, color: 'var(--ops-text-sec)' }}>{row.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
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
            Mostradoreak
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Janari Mostradore', href: '/eu/counter', icon: '🍽' },
              { label: 'Edari Mostradore', href: '/eu/drinks', icon: '🍺' },
              { label: 'Sukaldea (KDS)', href: '/eu/kitchen', icon: '👨‍🍳' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'var(--ops-surface)',
                  border: '1px solid var(--ops-border)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  textDecoration: 'none',
                  color: 'var(--ops-text-pri)',
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--ops-text-dim)' }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
