'use client';
import { useState, useEffect } from 'react';
import { Ticket, KdsProduct } from './types';
import { TicketCard } from './ticket-card';
import { InstructionsOverlay } from './instructions-overlay';
import { StockPanel } from './stock-panel';
import { OverflowMenu } from './overflow-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSSE } from '@/hooks/useSSE';

const NEW_ORDER_POOL = [
  {
    name: 'Gorka',
    lines: [
      { name: 'Burgerra', qty: 1, detail: 'entsalada' },
      { name: 'Pintxo nahasia', qty: 2, detail: null },
    ],
    notes: null,
  },
  {
    name: 'Xabi',
    lines: [
      { name: 'Tortilla', qty: 3, detail: '2tan banatu' },
      { name: 'Ogia gurinarekin', qty: 1, detail: null },
    ],
    notes: 'Azkar mesedez',
  },
  {
    name: null,
    lines: [
      { name: 'Txorizoa ogian', qty: 2, detail: null },
      { name: 'Entsalada', qty: 1, detail: 'alkate-saltsa barik' },
    ],
    notes: null,
  },
  {
    name: 'Amaia',
    lines: [
      { name: 'Burgerra', qty: 2, detail: 'patata frijituak' },
      { name: 'Pintxo nahasia', qty: 1, detail: null },
    ],
    notes: 'Burgerrak ondo eginda',
  },
];

function useWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 900);
  useEffect(() => {
    const f = () => setW(window.innerWidth);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return w;
}

const COL_DEFS = [
  { status: 'RECEIVED' as const, label: 'Jasota', accent: 'var(--ops-blue, #3b82f6)' },
  { status: 'IN_PREPARATION' as const, label: 'Prestatzen', accent: 'var(--ops-amber, #f59e0b)' },
  { status: 'READY' as const, label: 'Prest', accent: 'var(--ops-green)' },
];

// Map enriched StoredTicket to KDS Ticket shape
function toKdsTicket(t: {
  id: string;
  orderNumber: number | null;
  customerName: string | null;
  status: string;
  notes: string | null;
  flagged: boolean;
  lines: {
    productName: string;
    quantity: number;
    selectedVariant: string | null;
    selectedModifiers: string[];
    splitInstructions: string | null;
  }[];
}): Ticket {
  return {
    id: t.id,
    orderNumber: t.orderNumber ?? 0,
    customerName: t.customerName,
    status: t.status as Ticket['status'],
    elapsedMin: 0,
    isSlowOrder: false,
    hasAlert: t.flagged,
    notes: t.notes,
    lines: t.lines.map((l) => ({
      name: l.productName,
      qty: l.quantity,
      detail:
        l.selectedVariant ??
        (l.selectedModifiers.length ? l.selectedModifiers.join(', ') : null) ??
        l.splitInstructions,
    })),
  };
}

export default function KdsBoard() {
  const width = useWidth();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  const [slug, setSlug] = useState<string | null>(null);
  const [kitchenPost, setKitchenPost] = useState<string | null>(null);
  const [txosnaName, setTxosnaName] = useState('Txosna · Sukaldea');

  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Load slug and kitchenPost from sessionStorage and fetch initial tickets
  useEffect(() => {
    const storedSlug = typeof window !== 'undefined' ? sessionStorage.getItem('txosna_slug') : null;
    if (!storedSlug) return;
    const storedPost =
      typeof window !== 'undefined' ? sessionStorage.getItem('kitchen_post') : null;
    setSlug(storedSlug);
    setKitchenPost(storedPost);

    fetch(`/api/txosnak/${storedSlug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.name) {
          const postLabel = storedPost ? ` · ${storedPost}` : ' · Sukaldea';
          setTxosnaName(d.name + postLabel);
        }
      })
      .catch(() => {});

    const postParam = storedPost ? `&kitchenPost=${encodeURIComponent(storedPost)}` : '';
    fetch(
      `/api/txosnak/${storedSlug}/tickets?counterType=FOOD&status=RECEIVED,IN_PREPARATION,READY${postParam}`
    )
      .then((r) => r.json())
      .then((data: { tickets: Parameters<typeof toKdsTicket>[0][] }) => {
        setTickets(data.tickets.map(toKdsTicket));
      })
      .catch(() => {});
  }, []);

  // SSE: receive real-time ticket events
  useSSE(slug, {
    'order:confirmed': () => {
      if (!slug) return;
      const postParam = kitchenPost ? `&kitchenPost=${encodeURIComponent(kitchenPost)}` : '';
      fetch(
        `/api/txosnak/${slug}/tickets?counterType=FOOD&status=RECEIVED,IN_PREPARATION,READY${postParam}`
      )
        .then((r) => r.json())
        .then((data: { tickets: Parameters<typeof toKdsTicket>[0][] }) => {
          setTickets(data.tickets.map(toKdsTicket));
        })
        .catch(() => {});
    },
    'ticket:status_changed': (data: unknown) => {
      const { ticketId, newStatus } = data as { ticketId: string; newStatus: string };
      setTickets((prev) =>
        prev
          .map((t) =>
            t.id === ticketId
              ? { ...t, status: newStatus as Ticket['status'], elapsedMin: 0, hasAlert: false }
              : t
          )
          .filter(
            (t) => (t.status as string) !== 'COMPLETED' && (t.status as string) !== 'CANCELLED'
          )
      );
    },
  });
  const [paused, setPaused] = useState(false);
  const [closed, setClosed] = useState(false);
  const [activeTab, setActiveTab] = useState<'RECEIVED' | 'IN_PREPARATION' | 'READY'>('RECEIVED');
  const [instrTicket, setInstrTicket] = useState<Ticket | null>(null);
  const [showStock, setShowStock] = useState(false);
  const [orderIdx, setOrderIdx] = useState(0);
  const [products, setProducts] = useState<KdsProduct[]>([
    {
      name: 'Burgerra',
      soldOut: false,
      complements: [
        { name: 'Patata frijituak', soldOut: false },
        { name: 'Entsalada', soldOut: true },
      ],
    },
    { name: 'Tortilla', soldOut: false },
    { name: 'Pintxo nahasia', soldOut: false },
    { name: 'Txorizoa ogian', soldOut: false },
    { name: 'Ogia gurinarekin', soldOut: false },
  ]);

  const advance = async (id: string) => {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) return;
    const next = (
      { RECEIVED: 'IN_PREPARATION', IN_PREPARATION: 'READY', READY: 'COMPLETED' } as Record<
        string,
        string
      >
    )[ticket.status];
    if (!next) return;

    setTickets((prev) =>
      prev
        .map((t) => {
          if (t.id !== id) return t;
          if (next === 'COMPLETED') return { ...t, status: 'COMPLETED' as never };
          return { ...t, status: next as Ticket['status'], elapsedMin: 0, hasAlert: false };
        })
        .filter((t) => t.status !== ('COMPLETED' as never))
    );

    fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).catch(() => {
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: ticket.status } : t)));
    });
  };

  const addOrder = () => {
    const tmpl = NEW_ORDER_POOL[orderIdx % NEW_ORDER_POOL.length];
    setOrderIdx((i) => i + 1);
    setTickets((prev) => [
      ...prev,
      {
        id: `t${Date.now()}`,
        orderNumber: Math.max(0, ...prev.map((t) => t.orderNumber), 40) + 1,
        customerName: tmpl.name,
        status: 'RECEIVED',
        elapsedMin: 0,
        isSlowOrder: false,
        hasAlert: false,
        lines: tmpl.lines,
        notes: tmpl.notes,
      },
    ]);
    if (isMobile) setActiveTab('RECEIVED');
  };

  const byStatus = (s: Ticket['status']) =>
    tickets.filter((t) => t.status === s).sort((a, b) => a.orderNumber - b.orderNumber);
  const counts = {
    RECEIVED: byStatus('RECEIVED').length,
    IN_PREPARATION: byStatus('IN_PREPARATION').length,
    READY: byStatus('READY').length,
  };
  const nextTicketId = byStatus('RECEIVED')[0]?.id ?? null;
  const soldOutCount = products.reduce((acc, p) => {
    return acc + (p.soldOut ? 1 : 0) + (p.complements?.filter((c) => c.soldOut).length ?? 0);
  }, 0);
  const slowCount = byStatus('IN_PREPARATION').filter((t) => t.isSlowOrder).length;

  if (closed) {
    return (
      <div
        className="ops-theme"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h1
            style={{
              fontFamily: 'var(--font-nunito, sans-serif)',
              fontSize: 24,
              fontWeight: 800,
              color: 'var(--ops-text-pri)',
              marginBottom: 8,
            }}
          >
            Jardunaldia itxita
          </h1>
          <p style={{ color: 'var(--ops-text-sec)', fontSize: 15 }}>
            Eskaera guztiak ezeztatuta daude.
          </p>
        </div>
      </div>
    );
  }

  const renderTicketList = (status: Ticket['status'], tabActive = true) => {
    const list = byStatus(status);
    if (!tabActive) return null;
    return list.length === 0 ? (
      <div
        style={{
          textAlign: 'center',
          padding: '48px 16px',
          color: 'var(--ops-text-dim)',
          fontSize: 14,
          border: '1px dashed var(--ops-border)',
          borderRadius: 14,
        }}
      >
        {status === 'READY' ? 'Prest dagoen eskaera gabe' : 'Eskaera gabe'}
      </div>
    ) : (
      list.map((t) => (
        <TicketCard
          key={t.id}
          ticket={t}
          onAdvance={advance}
          onShowInstructions={() => setInstrTicket(t)}
          isNext={t.id === nextTicketId && status === 'RECEIVED'}
        />
      ))
    );
  };

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
          padding: isMobile ? '10px 14px' : '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          gap: 10,
        }}
      >
        <div style={{ minWidth: 0, position: 'relative' }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-nunito, sans-serif)',
                fontSize: isMobile ? 14 : 17,
                fontWeight: 800,
                color: 'var(--ops-text-pri)',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {txosnaName ?? '…'}
            </div>
            <span style={{ color: 'var(--ops-text-dim)', fontSize: 12 }}>▾</span>
          </button>
          <div
            style={{
              fontSize: 11,
              color: 'var(--ops-text-sec)',
              marginTop: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: paused ? 'var(--ops-amber, #f59e0b)' : 'var(--ops-green)',
                flexShrink: 0,
              }}
            />
            <span style={{ whiteSpace: 'nowrap' }}>
              {paused ? 'GELDITUTA' : 'Janaria · Sukaldea'}
            </span>
            {!isMobile && slowCount > 0 && (
              <span style={{ color: 'var(--ops-red)', fontWeight: 700, marginLeft: 8 }}>
                · ⚠ {slowCount} motel
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <ThemeToggle variant="ops" />
          <button
            onClick={() => setShowStock(true)}
            style={{
              position: 'relative',
              background: 'var(--ops-surface-hi)',
              border: `1px solid ${soldOutCount > 0 ? 'var(--ops-red)' : 'var(--ops-border)'}`,
              borderRadius: 8,
              padding: '7px 12px',
              color: soldOutCount > 0 ? 'var(--ops-red)' : 'var(--ops-text-sec)',
              fontSize: 12,
              fontWeight: soldOutCount > 0 ? 700 : 400,
              cursor: 'pointer',
              minHeight: 36,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            📦{!isMobile && <span style={{ marginLeft: 2 }}>Stocka</span>}
            {soldOutCount > 0 && (
              <span
                style={{
                  background: 'var(--ops-red)',
                  color: '#fff',
                  borderRadius: 99,
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '1px 5px',
                  marginLeft: 2,
                }}
              >
                {soldOutCount}
              </span>
            )}
          </button>
          <button
            onClick={addOrder}
            style={{
              background: 'var(--ops-orange)',
              border: 'none',
              borderRadius: 8,
              padding: '7px 12px',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: 36,
              whiteSpace: 'nowrap',
            }}
          >
            + Eskaera
          </button>
          <OverflowMenu
            paused={paused}
            onPause={() => setPaused(true)}
            onResume={() => setPaused(false)}
            onClose={() => {
              setTickets([]);
              setClosed(true);
            }}
          />
        </div>
      </div>

      {paused && (
        <div
          style={{
            background: 'var(--ops-amber-dim, #78350f)',
            borderBottom: '1px solid rgba(245,158,11,0.25)',
            padding: '9px 16px',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--ops-amber, #f59e0b)',
            textAlign: 'center',
            letterSpacing: '0.04em',
          }}
        >
          ⏸ Sukaldea geldituta — ez da eskaera berririk onartzen
        </div>
      )}

      {/* Mobile tabs */}
      {isMobile && (
        <div
          style={{
            display: 'flex',
            background: 'var(--ops-surface)',
            borderBottom: '1px solid var(--ops-border)',
            position: 'sticky',
            top: 56,
            zIndex: 40,
          }}
        >
          {COL_DEFS.map((tab) => (
            <button
              key={tab.status}
              onClick={() => setActiveTab(tab.status)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                borderBottom: `3px solid ${activeTab === tab.status ? tab.accent : 'transparent'}`,
                padding: '10px 4px 8px',
                color: activeTab === tab.status ? tab.accent : 'var(--ops-text-dim)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                transition: 'color 0.15s',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 20,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                {counts[tab.status]}
              </span>
              <span style={{ fontSize: 10 }}>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Mobile single column */}
      {isMobile && (
        <div
          style={{ padding: '16px 14px 80px', display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {renderTicketList(activeTab)}
        </div>
      )}

      {/* Tablet 2-column */}
      {isTablet && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
            padding: '18px 18px 32px',
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {COL_DEFS.slice(0, 2).map((col) => (
              <div key={col.status}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    paddingBottom: 10,
                    marginBottom: 10,
                    borderBottom: `2px solid ${col.accent}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase' as const,
                      color: col.accent,
                    }}
                  >
                    {col.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--ops-text-pri)',
                      background: 'var(--ops-surface-hi)',
                      border: '1px solid var(--ops-border)',
                      borderRadius: 6,
                      padding: '1px 7px',
                    }}
                  >
                    {counts[col.status]}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {renderTicketList(col.status)}
                </div>
              </div>
            ))}
          </div>
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                paddingBottom: 10,
                marginBottom: 10,
                borderBottom: `2px solid ${COL_DEFS[2].accent}`,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  color: COL_DEFS[2].accent,
                }}
              >
                {COL_DEFS[2].label}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--ops-text-pri)',
                  background: 'var(--ops-surface-hi)',
                  border: '1px solid var(--ops-border)',
                  borderRadius: 6,
                  padding: '1px 7px',
                }}
              >
                {counts.READY}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {renderTicketList('READY')}
            </div>
          </div>
        </div>
      )}

      {/* Desktop 3-column */}
      {!isMobile && !isTablet && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 16,
            padding: '20px 24px 32px',
            alignItems: 'start',
          }}
        >
          {COL_DEFS.map((col) => (
            <div key={col.status}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  paddingBottom: 12,
                  marginBottom: 12,
                  borderBottom: `2px solid ${col.accent}`,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    color: col.accent,
                  }}
                >
                  {col.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--ops-text-pri)',
                    background: 'var(--ops-surface-hi)',
                    border: '1px solid var(--ops-border)',
                    borderRadius: 6,
                    padding: '1px 7px',
                  }}
                >
                  {counts[col.status]}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {renderTicketList(col.status)}
              </div>
            </div>
          ))}
        </div>
      )}

      {instrTicket && (
        <InstructionsOverlay ticket={instrTicket} onClose={() => setInstrTicket(null)} />
      )}
      {showStock && (
        <StockPanel
          products={products}
          onToggle={(productIdx, compIdx) =>
            setProducts((prev) =>
              prev.map((p, i) => {
                if (i !== productIdx) return p;
                if (compIdx === undefined) return { ...p, soldOut: !p.soldOut };
                return {
                  ...p,
                  complements: p.complements?.map((c, j) =>
                    j === compIdx ? { ...c, soldOut: !c.soldOut } : c
                  ),
                };
              })
            )
          }
          onClose={() => setShowStock(false)}
        />
      )}
    </div>
  );
}
