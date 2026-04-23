'use client';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// ── i18n ──────────────────────────────────────────────────────────────────────
const eu = {
  ready: 'PREST',
  inPrep: 'PRESTATZEN',
  waitTime: 'itxaron ~',
  waitMin: 'min',
  paused: 'Momentuz ezin da eskaerarik hartu — laster itzuliko gara',
  closed: 'Gaur ez dago zerbitzurik',
  pausedTitle: 'GELDITUTA',
  closedTitle: 'ITXITA',
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface BoardOrder {
  id: string;
  number: number;
  name: string | null;
  status: 'IN_PREPARATION' | 'READY';
  slowOrder: boolean;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const f = () => setW(window.innerWidth);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return w;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ReadyCard({ order, animIn }: { order: BoardOrder; animIn: boolean }) {
  return (
    <div
      style={{
        background: 'var(--ops-green-dark, #14532d)',
        border: '2px solid var(--ops-green)',
        borderRadius: 14,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        animation: animIn ? 'slideIn 0.4s ease' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--ops-green)',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          #{order.number}
        </span>
        {order.name && (
          <span
            style={{
              fontFamily: 'var(--font-nunito, sans-serif)',
              fontSize: 22,
              fontWeight: 800,
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {order.name.toUpperCase()}
          </span>
        )}
      </div>
      <span style={{ fontSize: 22, flexShrink: 0 }}>✓</span>
    </div>
  );
}

function PrepRow({ order }: { order: BoardOrder }) {
  return (
    <div
      style={{
        background: order.slowOrder ? 'var(--ops-amber-dark, #78350f)' : 'var(--ops-surface-hi)',
        border: `1px solid ${order.slowOrder ? 'var(--ops-amber, #f59e0b)' : 'var(--ops-border)'}`,
        borderRadius: 10,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        transition: 'background 0.3s, border-color 0.3s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 20,
            fontWeight: 700,
            color: order.slowOrder ? 'var(--ops-amber, #f59e0b)' : 'var(--ops-text-sec)',
            flexShrink: 0,
          }}
        >
          #{order.number}
        </span>
        {order.name && (
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: order.slowOrder ? 'var(--ops-amber, #f59e0b)' : 'var(--ops-text-pri)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {order.name}
          </span>
        )}
      </div>
      {order.slowOrder && (
        <span style={{ fontSize: 16, flexShrink: 0 }} title="Motel">
          ⏱
        </span>
      )}
    </div>
  );
}

function WaitPill({ minutes }: { minutes: number }) {
  return (
    <div
      style={{
        background: 'var(--ops-surface)',
        border: '1px solid var(--ops-border-hi)',
        borderRadius: 99,
        padding: '6px 18px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 15,
        color: 'var(--ops-text-sec)',
      }}
    >
      <span style={{ color: 'var(--ops-amber, #f59e0b)' }}>⏱</span>
      <span>{eu.waitTime}</span>
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontWeight: 800,
          fontSize: 18,
          color: 'var(--ops-text-pri)',
        }}
      >
        {minutes}
      </span>
      <span>{eu.waitMin}</span>
    </div>
  );
}

function StatusOverlay({ type }: { type: 'paused' | 'closed' }) {
  const isPaused = type === 'paused';
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13,15,20,0.92)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        zIndex: 100,
      }}
    >
      <span style={{ fontSize: 56 }}>{isPaused ? '⏸' : '🔒'}</span>
      <h1
        style={{
          fontFamily: 'var(--font-nunito, sans-serif)',
          fontSize: 36,
          fontWeight: 900,
          color: isPaused ? 'var(--ops-amber, #f59e0b)' : 'var(--ops-text-sec)',
          letterSpacing: '0.06em',
        }}
      >
        {isPaused ? eu.pausedTitle : eu.closedTitle}
      </h1>
      <p style={{ fontSize: 18, color: 'var(--ops-text-sec)', textAlign: 'center', maxWidth: 480 }}>
        {isPaused ? eu.paused : eu.closed}
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OrderBoard({ slug }: { slug?: string }) {
  const width = useWidth();
  const isPortrait = width < 768;

  const [orders, setOrders] = useState<BoardOrder[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [simMode, setSimMode] = useState<'open' | 'paused' | 'closed'>('open');
  const [waitMin] = useState(8);

  function fetchOrders(s: string) {
    fetch(`/api/txosnak/${s}/tickets?status=IN_PREPARATION,READY`)
      .then((r) => r.json())
      .then(
        (d: {
          tickets?: {
            id: string;
            orderNumber: number | null;
            customerName: string | null;
            status: string;
          }[];
        }) => {
          const mapped: BoardOrder[] = (d.tickets ?? [])
            .filter((t) => t.status === 'IN_PREPARATION' || t.status === 'READY')
            .map((t) => ({
              id: t.id,
              number: t.orderNumber ?? 0,
              name: t.customerName,
              status: t.status as 'IN_PREPARATION' | 'READY',
              slowOrder: false,
            }));
          setOrders(mapped);
        }
      )
      .catch(() => {});
  }

  useEffect(() => {
    if (slug) fetchOrders(slug);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    const es = new EventSource(`/api/txosnak/${slug}/events`);
    const handleEvent = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.ticketId) {
          if (data.newStatus === 'READY') {
            setOrders((prev) => {
              const updated = prev.map((o) =>
                o.id === data.ticketId ? { ...o, status: 'READY' as const } : o
              );
              setNewIds((s) => new Set([...s, data.ticketId]));
              setTimeout(
                () =>
                  setNewIds((s) => {
                    const n = new Set(s);
                    n.delete(data.ticketId);
                    return n;
                  }),
                600
              );
              return updated;
            });
          } else if (data.newStatus === 'COMPLETED') {
            setOrders((prev) => prev.filter((o) => o.id !== data.ticketId));
          }
        } else {
          fetchOrders(slug);
        }
      } catch {
        fetchOrders(slug);
      }
    };
    es.addEventListener('ticket:status_changed', handleEvent);
    es.addEventListener('order:confirmed', () => fetchOrders(slug));
    es.addEventListener('order:ready', () => fetchOrders(slug));
    return () => es.close();
  }, [slug]);

  const readyOrders = orders
    .filter((o) => o.status === 'READY')
    .sort((a, b) => a.number - b.number);
  const prepOrders = orders
    .filter((o) => o.status === 'IN_PREPARATION')
    .sort((a, b) => a.number - b.number);

  const colHeaderReady = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 18,
        paddingBottom: 14,
        borderBottom: '2px solid var(--ops-green)',
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          color: 'var(--ops-green)',
        }}
      >
        {eu.ready}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 14,
          fontWeight: 800,
          color: 'var(--ops-text-pri)',
          background: 'var(--ops-surface-hi)',
          border: '1px solid var(--ops-border)',
          borderRadius: 6,
          padding: '2px 9px',
        }}
      >
        {readyOrders.length}
      </span>
    </div>
  );

  const colHeaderPrep = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 18,
        paddingBottom: 14,
        borderBottom: '2px solid var(--ops-amber, #f59e0b)',
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          color: 'var(--ops-amber, #f59e0b)',
        }}
      >
        {eu.inPrep}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 14,
          fontWeight: 800,
          color: 'var(--ops-text-pri)',
          background: 'var(--ops-surface-hi)',
          border: '1px solid var(--ops-border)',
          borderRadius: 6,
          padding: '2px 9px',
        }}
      >
        {prepOrders.length}
      </span>
    </div>
  );

  const emptyCell = (style?: React.CSSProperties) => (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 16px',
        color: 'var(--ops-text-dim)',
        fontSize: 14,
        border: '1px dashed var(--ops-border)',
        borderRadius: 14,
        ...style,
      }}
    >
      —
    </div>
  );

  return (
    <div
      className="ops-theme"
      style={{
        minHeight: '100vh',
        fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
        color: 'var(--ops-text-pri)',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          background: 'var(--ops-surface)',
          borderBottom: '1px solid var(--ops-border)',
          padding: isPortrait ? '10px 14px' : '12px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 64,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background:
                simMode === 'open'
                  ? 'var(--ops-green)'
                  : simMode === 'paused'
                    ? 'var(--ops-amber, #f59e0b)'
                    : 'var(--ops-text-dim)',
              boxShadow: simMode === 'open' ? '0 0 7px var(--ops-green)' : 'none',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-nunito, sans-serif)',
              fontSize: isPortrait ? 16 : 20,
              fontWeight: 900,
              color: 'var(--ops-text-pri)',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Aste Nagusia 2026
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <ThemeToggle variant="ops" />
          {simMode === 'open' && <WaitPill minutes={waitMin} />}
          <div
            style={{
              display: 'flex',
              gap: 4,
              background: 'var(--ops-surface-hi)',
              border: '1px solid var(--ops-border)',
              borderRadius: 8,
              padding: '3px 4px',
            }}
          >
            {(['open', 'paused', 'closed'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSimMode(mode)}
                style={{
                  background: simMode === mode ? 'var(--ops-border-hi)' : 'none',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 10px',
                  color: simMode === mode ? 'var(--ops-text-pri)' : 'var(--ops-text-dim)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {mode === 'open' ? '▶' : mode === 'paused' ? '⏸' : '✕'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      {isPortrait ? (
        <div
          style={{ display: 'flex', flexDirection: 'column', padding: '16px 14px 32px', gap: 24 }}
        >
          {readyOrders.length > 0 && (
            <div>
              {colHeaderReady}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {readyOrders.map((o) => (
                  <ReadyCard key={o.id} order={o} animIn={newIds.has(o.id)} />
                ))}
              </div>
            </div>
          )}
          <div>
            {colHeaderPrep}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {prepOrders.map((o) => (
                <PrepRow key={o.id} order={o} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', height: 'calc(100vh - 64px)', gap: 0 }}>
          {/* READY column */}
          <div
            style={{
              width: 300,
              minWidth: 260,
              borderRight: '2px solid rgba(34,197,94,0.18)',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 20px 24px',
              gap: 0,
              overflow: 'hidden',
            }}
          >
            {colHeaderReady}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {readyOrders.length === 0
                ? emptyCell()
                : readyOrders.map((o) => (
                    <ReadyCard key={o.id} order={o} animIn={newIds.has(o.id)} />
                  ))}
            </div>
          </div>
          {/* IN_PREPARATION column */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 24px 24px',
              overflow: 'hidden',
            }}
          >
            {colHeaderPrep}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: 10,
                alignContent: 'start',
              }}
            >
              {prepOrders.length === 0
                ? emptyCell({ gridColumn: '1/-1' })
                : prepOrders.map((o) => <PrepRow key={o.id} order={o} />)}
            </div>
          </div>
        </div>
      )}

      {simMode === 'paused' && <StatusOverlay type="paused" />}
      {simMode === 'closed' && <StatusOverlay type="closed" />}
    </div>
  );
}
