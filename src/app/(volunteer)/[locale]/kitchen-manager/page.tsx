'use client';
import { useState, useEffect } from 'react';
import { StockPanel } from '@/components/kds/stock-panel';
import { KdsProduct } from '@/components/kds/types';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSSE } from '@/hooks/useSSE';

interface RawTicket {
  id: string;
  orderId: string;
  kitchenPost: string | null;
  status: string;
  orderNumber: number | null;
  customerName: string | null;
  flagged: boolean;
  orderChangedAlert: boolean;
  createdAt: string;
}

interface OrderCard {
  orderId: string;
  orderNumber: number;
  customerName: string | null;
  tickets: RawTicket[];
  allReady: boolean;
  hasAlert: boolean;
  oldestCreatedAt: number;
}

function buildOrderCards(rawTickets: RawTicket[]): OrderCard[] {
  const byOrder = new Map<string, RawTicket[]>();
  for (const t of rawTickets) {
    const bucket = byOrder.get(t.orderId) ?? [];
    bucket.push(t);
    byOrder.set(t.orderId, bucket);
  }

  const cards: OrderCard[] = [];
  for (const [orderId, tks] of byOrder) {
    const allReady = tks.length > 0 && tks.every((t) => t.status === 'READY');
    const hasAlert = tks.some((t) => t.orderChangedAlert || t.flagged);
    const orderNumber = tks[0].orderNumber ?? 0;
    const customerName = tks[0].customerName ?? null;
    const oldestCreatedAt = Math.min(...tks.map((t) => new Date(t.createdAt).getTime()));
    cards.push({
      orderId,
      orderNumber,
      customerName,
      tickets: tks,
      allReady,
      hasAlert,
      oldestCreatedAt,
    });
  }

  // All-ready orders first (need collection call), then oldest first
  return cards.sort((a, b) => {
    if (a.allReady !== b.allReady) return a.allReady ? -1 : 1;
    return a.oldestCreatedAt - b.oldestCreatedAt;
  });
}

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: 'Jasota',
  IN_PREPARATION: 'Prestatzen',
  READY: 'Prest ✓',
  COMPLETED: 'Amaituta',
  CANCELLED: 'Ezeztatuta',
};

const STATUS_COLOR: Record<string, string> = {
  RECEIVED: 'var(--ops-blue, #3b82f6)',
  IN_PREPARATION: 'var(--ops-amber, #f59e0b)',
  READY: 'var(--ops-green)',
  COMPLETED: 'var(--ops-text-dim)',
  CANCELLED: 'var(--ops-text-dim)',
};

export default function KitchenManagerPage() {
  const [slug, setSlug] = useState<string | null>(null);
  const [txosnaName, setTxosnaName] = useState('Txosna · Kudeaketa');
  const [rawTickets, setRawTickets] = useState<RawTicket[]>([]);
  const [showStock, setShowStock] = useState(false);
  const [products, setProducts] = useState<KdsProduct[]>([]);

  function fetchTickets(storedSlug: string) {
    fetch(
      `/api/txosnak/${storedSlug}/tickets?counterType=FOOD&status=RECEIVED,IN_PREPARATION,READY`
    )
      .then((r) => r.json())
      .then((data: { tickets: RawTicket[] }) => setRawTickets(data.tickets))
      .catch(() => {});
  }

  useEffect(() => {
    const storedSlug = typeof window !== 'undefined' ? sessionStorage.getItem('txosna_slug') : null;
    if (!storedSlug) return;
    setSlug(storedSlug);

    fetch(`/api/txosnak/${storedSlug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.name) setTxosnaName(d.name + ' · Kudeaketa');
      })
      .catch(() => {});

    fetchTickets(storedSlug);
  }, []);

  useSSE(slug, {
    'order:confirmed': () => {
      if (slug) fetchTickets(slug);
    },
    'ticket:status_changed': () => {
      if (slug) fetchTickets(slug);
    },
  });

  const orderCards = buildOrderCards(rawTickets);
  const inKitchen = orderCards.filter((c) => !c.allReady).length;
  const readyToCollect = orderCards.filter((c) => c.allReady).length;

  const toggleProduct = (pi: number, ci?: number) => {
    setProducts((prev) =>
      prev.map((p, i) => {
        if (i !== pi) return p;
        if (ci === undefined) return { ...p, soldOut: !p.soldOut };
        return {
          ...p,
          complements: p.complements?.map((c, j) => (j === ci ? { ...c, soldOut: !c.soldOut } : c)),
        };
      })
    );
  };

  return (
    <div className="ops-theme" style={{ minHeight: '100vh', background: 'var(--ops-bg)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--ops-surface)',
          borderBottom: '1px solid var(--ops-border)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--ops-text-sec)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            📋 Sukalde Kudeaketa
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--ops-text-pri)',
              fontFamily: 'var(--font-nunito, sans-serif)',
            }}
          >
            {txosnaName}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--ops-text-sec)' }}>
            <span>
              🍳 Sukaldean: <strong style={{ color: 'var(--ops-text-pri)' }}>{inKitchen}</strong>
            </span>
            <span>
              ✅ Jasotzeko: <strong style={{ color: 'var(--ops-green)' }}>{readyToCollect}</strong>
            </span>
          </div>
          <button
            onClick={() => setShowStock(true)}
            style={{
              background: 'var(--ops-surface-hi)',
              border: '1px solid var(--ops-border)',
              borderRadius: 8,
              padding: '6px 12px',
              color: 'var(--ops-text-sec)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📦 Stock
          </button>
          <ThemeToggle variant="ops" />
        </div>
      </div>

      {/* Order cards */}
      <div
        style={{
          padding: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 12,
        }}
      >
        {orderCards.length === 0 && (
          <div
            style={{
              gridColumn: '1/-1',
              textAlign: 'center',
              padding: '64px 16px',
              color: 'var(--ops-text-dim)',
              fontSize: 14,
              border: '1px dashed var(--ops-border)',
              borderRadius: 14,
            }}
          >
            Eskaera aktiborik ez
          </div>
        )}
        {orderCards.map((card) => {
          const progress =
            card.tickets.filter((t) => t.status === 'READY').length /
            Math.max(card.tickets.length, 1);
          return (
            <div
              key={card.orderId}
              style={{
                background: card.allReady ? 'rgba(34,197,94,0.1)' : 'var(--ops-surface)',
                border: `1px solid ${card.allReady ? 'var(--ops-green)' : 'var(--ops-border)'}`,
                borderRadius: 14,
                padding: 16,
              }}
            >
              {/* Order header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: 'var(--ops-text-pri)',
                      fontFamily: 'var(--font-nunito, sans-serif)',
                    }}
                  >
                    #{card.orderNumber}
                  </span>
                  {card.customerName && (
                    <span style={{ marginLeft: 8, fontSize: 14, color: 'var(--ops-text-sec)' }}>
                      {card.customerName}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {card.hasAlert && <span style={{ fontSize: 16 }}>🔔</span>}
                  {card.allReady && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--ops-green)',
                        background: 'rgba(34,197,94,0.15)',
                        padding: '3px 8px',
                        borderRadius: 20,
                      }}
                    >
                      PREST ✓
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: 'var(--ops-border)',
                  marginBottom: 12,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress * 100}%`,
                    background: card.allReady ? 'var(--ops-green)' : 'var(--ops-amber, #f59e0b)',
                    borderRadius: 3,
                    transition: 'width 0.3s',
                  }}
                />
              </div>

              {/* Post rows */}
              {card.tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderTop: '1px solid var(--ops-border)',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--ops-text-sec)', fontWeight: 600 }}>
                    {ticket.kitchenPost ?? '—'}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: STATUS_COLOR[ticket.status] ?? 'var(--ops-text-sec)',
                    }}
                  >
                    {STATUS_LABEL[ticket.status] ?? ticket.status}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Stock panel */}
      {showStock && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setShowStock(false)}
        >
          <div
            style={{
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              background: 'var(--ops-surface)',
              borderRadius: '20px 20px 0 0',
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <StockPanel
              products={products}
              onToggle={toggleProduct}
              onClose={() => setShowStock(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
