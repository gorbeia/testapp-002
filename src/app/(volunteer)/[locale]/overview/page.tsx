'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OpsHeader } from '@/components/layout/ops-header';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSSE } from '@/hooks/useSSE';

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
  const [slug, setSlug] = useState<string | null>(null);
  const [txosnaName, setTxosnaName] = useState('Txosna');
  const [txosnaStatus, setTxosnaStatus] = useState<'OPEN' | 'PAUSED' | 'CLOSED'>('OPEN');
  const [counts, setCounts] = useState({ received: 0, inPrep: 0, ready: 0 });
  const [volunteers, setVolunteers] = useState<{ active: boolean }[]>([]);
  const [associationId, setAssociationId] = useState<string | null>(null);

  useEffect(() => {
    const storedSlug = typeof window !== 'undefined' ? sessionStorage.getItem('txosna_slug') : null;
    if (!storedSlug) return;
    setSlug(storedSlug);

    fetch(`/api/txosnak/${storedSlug}`)
      .then((r) => r.json())
      .then(
        (d: { name?: string; status?: 'OPEN' | 'PAUSED' | 'CLOSED'; associationId?: string }) => {
          if (d.name) setTxosnaName(d.name);
          if (d.status) setTxosnaStatus(d.status);
          if (d.associationId) setAssociationId(d.associationId);
        }
      )
      .catch(() => {});

    fetchCounts(storedSlug);
  }, []);

  useEffect(() => {
    if (!associationId) return;
    fetch(`/api/associations/${associationId}/volunteers`)
      .then((r) => r.json())
      .then((d: { volunteers?: { active: boolean }[] }) => {
        setVolunteers(d.volunteers ?? []);
      })
      .catch(() => {});
  }, [associationId]);

  function fetchCounts(s: string) {
    fetch(`/api/txosnak/${s}/tickets?status=RECEIVED,IN_PREPARATION,READY`)
      .then((r) => r.json())
      .then((d: { tickets?: { status: string }[] }) => {
        const ts = d.tickets ?? [];
        setCounts({
          received: ts.filter((t) => t.status === 'RECEIVED').length,
          inPrep: ts.filter((t) => t.status === 'IN_PREPARATION').length,
          ready: ts.filter((t) => t.status === 'READY').length,
        });
      })
      .catch(() => {});
  }

  useSSE(slug, {
    'ticket:status_changed': () => {
      if (slug) fetchCounts(slug);
    },
    'order:confirmed': () => {
      if (slug) fetchCounts(slug);
    },
  });

  const activeVols = volunteers.filter((v) => v.active).length;
  const statusLabel =
    txosnaStatus === 'OPEN' ? 'IREKITA' : txosnaStatus === 'PAUSED' ? 'GELDITUTA' : 'ITXITA';
  const statusColor =
    txosnaStatus === 'OPEN'
      ? 'var(--ops-green)'
      : txosnaStatus === 'PAUSED'
        ? 'var(--ops-amber, #f59e0b)'
        : 'var(--ops-text-dim)';

  return (
    <div
      className="ops-theme"
      style={{ minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)' }}
    >
      <OpsHeader
        title={txosnaName}
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
              value={counts.received}
              sub="eskaera"
              accent="var(--ops-blue, #3b82f6)"
            />
            <StatCard
              label="Prestatzen"
              value={counts.inPrep}
              sub="eskaera"
              accent="var(--ops-amber, #f59e0b)"
            />
            <StatCard
              label="Prest"
              value={counts.ready}
              sub="jasotzeko"
              accent="var(--ops-green)"
            />
            <StatCard
              label="Aktibo"
              value={activeVols}
              sub="boluntario"
              accent="var(--ops-text-pri)"
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
              { label: 'Egoera', value: statusLabel, color: statusColor },
              {
                label: 'Boluntarioak',
                value: `${activeVols} / ${volunteers.length}`,
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
