'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { OpsHeader } from '@/components/layout/ops-header';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LogoutButton } from '@/components/auth/logout-button';
import { HandoffCard } from '@/components/counter/handoff-card';
import { CompletedOrdersPanel } from '@/components/counter/completed-orders-panel';
import { QueuePreviewScreen } from '@/components/drinks/queue-preview-screen';
import { ConfirmDeliveryScreen } from '@/components/drinks/confirm-delivery-screen';
import { NewDrinkOrderSheet } from '@/components/drinks/new-drink-order-sheet';
import { useSSE } from '@/hooks/useSSE';
import type { CompletedOrderEntry, DrinkProduct, DrinksQueueOrder, ConfirmState } from './_types';

export default function DrinksPage() {
  const _nextOrderNumRef = useRef(50);
  const [slug, setSlug] = useState<string | null>(null);
  const [txosnaName, setTxosnaName] = useState('Txosna');
  const [drinkProducts, setDrinkProducts] = useState<DrinkProduct[]>([]);
  const [queue, setQueue] = useState<DrinksQueueOrder[]>([]);
  const [mobileTrackingEnabled, setMobileTrackingEnabled] = useState(false);
  const [handoffOrder, setHandoffOrder] = useState<{
    orderNumber: number;
    verificationCode: string;
  } | null>(null);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrderEntry[]>([]);
  const [completedPanelOpen, setCompletedPanelOpen] = useState(false);
  const [expandedQr, setExpandedQr] = useState<string | null>(null);

  useEffect(() => {
    const storedSlug = typeof window !== 'undefined' ? sessionStorage.getItem('txosna_slug') : null;
    if (!storedSlug) return;
    setSlug(storedSlug);

    fetch(`/api/txosnak/${storedSlug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.name) setTxosnaName(d.name);
      })
      .catch(() => {});

    fetch(`/api/txosnak/${storedSlug}/settings`)
      .then((r) => r.json())
      .then((s) => {
        if (s.mobileTrackingEnabled) setMobileTrackingEnabled(true);
      })
      .catch(() => {});

    fetch(`/api/txosnak/${storedSlug}/catalog`)
      .then((r) => r.json())
      .then(
        (d: {
          products?: { id: string; name: string; effectivePrice: number; type: string }[];
        }) => {
          const drinks = (d.products ?? [])
            .filter((p) => p.type === 'DRINK')
            .map((p) => ({ id: p.id, name: p.name, price: p.effectivePrice }));
          setDrinkProducts(drinks);
        }
      )
      .catch(() => {});

    fetchQueue(storedSlug);
  }, []);

  function fetchQueue(s: string) {
    fetch(`/api/txosnak/${s}/tickets?counterType=DRINKS&status=RECEIVED,IN_PREPARATION`)
      .then((r) => r.json())
      .then(
        (d: {
          tickets?: {
            id: string;
            orderNumber: number | null;
            customerName: string | null;
            lines: { productName: string; quantity: number }[];
            createdAt: string;
          }[];
        }) => {
          const orders: DrinksQueueOrder[] = (d.tickets ?? []).map((t) => ({
            id: t.id,
            number: t.orderNumber ?? 0,
            customerName: t.customerName,
            items: t.lines.map((l) => ({ name: l.productName, qty: l.quantity, price: 0 })),
            total: 0,
            placedAt: new Date(t.createdAt).getTime(),
          }));
          setQueue(orders);
          if (orders.length > 0)
            _nextOrderNumRef.current = Math.max(...orders.map((o) => o.number)) + 1;
        }
      )
      .catch(() => {});
  }

  useSSE(slug, {
    'order:confirmed': () => {
      if (slug) fetchQueue(slug);
    },
    'ticket:status_changed': (data) => {
      const { ticketId, newStatus } = data as { ticketId: string; newStatus: string };
      if (newStatus === 'COMPLETED') {
        setQueue((prev) => prev.filter((o) => o.id !== ticketId));
      }
    },
  });

  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState('');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [confirmDelivery, setConfirmDelivery] = useState<ConfirmState | null>(null);
  const [queuePreview, setQueuePreview] = useState<DrinksQueueOrder | null>(null);

  const addToCart = (name: string) => setCart((c) => ({ ...c, [name]: (c[name] ?? 0) + 1 }));
  const removeFromCart = (name: string) =>
    setCart((c) => {
      const next = { ...c };
      if (next[name] <= 1) delete next[name];
      else next[name]--;
      return next;
    });

  const cartTotal = Object.entries(cart).reduce((sum, [name, qty]) => {
    const p = drinkProducts.find((p) => p.name === name);
    return sum + (p?.price ?? 0) * qty;
  }, 0);

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);

  const serve = () => {
    setCart({});
    setCustomerName('');
    setShowNewOrder(false);
  };

  const serveFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((o) => o.id !== id));
    fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    }).catch(() => {
      if (slug) fetchQueue(slug);
    });
  };

  const requestServeCart = () => {
    const items = Object.entries(cart).map(([name, qty]) => {
      const p = drinkProducts.find((p) => p.name === name);
      return { name, qty, price: p?.price ?? 0 };
    });
    setConfirmDelivery({ type: 'cart', items, total: cartTotal, customerName });
  };

  const requestServeFromQueue = (order: DrinksQueueOrder) => {
    setConfirmDelivery({ type: 'queue', order });
  };

  const addCartToQueue = () => {
    const items = Object.entries(cart).map(([name, qty]) => {
      const p = drinkProducts.find((p) => p.name === name);
      return { name, qty, price: p?.price ?? 0 };
    });
    const num = _nextOrderNumRef.current++;
    setQueuePreview({
      id: `walk-${num}`,
      number: num,
      customerName: customerName || null,
      items,
      total: cartTotal,
      placedAt: Date.now(),
    });
  };

  const confirmAddToQueue = () => {
    if (!queuePreview || !slug) return;
    const savedPreview = queuePreview;
    const lines = savedPreview.items.map((item) => {
      const p = drinkProducts.find((dp) => dp.name === item.name);
      return { productId: p?.id ?? item.name, quantity: item.qty };
    });
    fetch(`/api/txosnak/${slug}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lines,
        customerName: savedPreview.customerName,
        channel: 'COUNTER',
        paymentMethod: 'CASH',
        notes: null,
      }),
    })
      .then((r) => r.json())
      .then(
        (order: { orderNumber: number; verificationCode: string; customerName: string | null }) => {
          fetchQueue(slug);
          if (mobileTrackingEnabled && order.verificationCode) {
            setHandoffOrder({
              orderNumber: order.orderNumber,
              verificationCode: order.verificationCode,
            });
            setCompletedOrders((prev) =>
              [
                {
                  orderNumber: order.orderNumber,
                  verificationCode: order.verificationCode,
                  customerName: order.customerName,
                  confirmedAt: Date.now(),
                },
                ...prev,
              ].slice(0, 20)
            );
          }
        }
      )
      .catch(() => {});
    setQueuePreview(null);
    setCart({});
    setCustomerName('');
    setShowNewOrder(false);
  };

  const confirmAndDeliver = () => {
    if (!confirmDelivery) return;
    if (confirmDelivery.type === 'queue') {
      serveFromQueue(confirmDelivery.order.id);
    } else {
      serve();
    }
    setConfirmDelivery(null);
  };

  const formatElapsed = (placedAt: number) => {
    const mins = Math.floor((Date.now() - placedAt) / 60000);
    if (mins < 1) return 'Oraintxe';
    if (mins === 1) return 'Duela 1 min';
    return `Duela ${mins} min`;
  };

  if (queuePreview) {
    return (
      <QueuePreviewScreen
        queuePreview={queuePreview}
        onBack={() => setQueuePreview(null)}
        onConfirm={confirmAddToQueue}
      />
    );
  }

  if (confirmDelivery) {
    return (
      <ConfirmDeliveryScreen
        confirmDelivery={confirmDelivery}
        onBack={() => setConfirmDelivery(null)}
        onConfirm={confirmAndDeliver}
      />
    );
  }

  if (showNewOrder) {
    return (
      <NewDrinkOrderSheet
        drinkProducts={drinkProducts}
        cart={cart}
        customerName={customerName}
        setCustomerName={setCustomerName}
        cartTotal={cartTotal}
        cartCount={cartCount}
        onBack={() => {
          setShowNewOrder(false);
          setCart({});
          setCustomerName('');
        }}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        onServeCart={requestServeCart}
        onAddToQueue={addCartToQueue}
      />
    );
  }

  return (
    <>
      <div
        className="ops-theme"
        style={{ minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)' }}
      >
        <OpsHeader
          title={txosnaName}
          subtitle="Edariak · Mostradore"
          statusColor="green"
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ThemeToggle variant="ops" />
              <LogoutButton variant="ops" />
              <Link
                href="/eu/overview"
                style={{ fontSize: 12, color: 'var(--ops-text-dim)', textDecoration: 'none' }}
              >
                Ikuspegi
              </Link>
            </div>
          }
        />

        <div
          style={{ padding: '14px 14px 90px', display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          {queue.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--ops-red)',
                  marginBottom: 10,
                }}
              >
                ZAIN ({queue.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {queue.map((o) => (
                  <div
                    key={o.id}
                    style={{
                      background: 'var(--ops-surface)',
                      border: '1px solid var(--ops-border)',
                      borderRadius: 12,
                      padding: '12px 14px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: 18,
                          fontWeight: 800,
                          color: 'var(--ops-text-pri)',
                        }}
                      >
                        #{o.number}
                      </span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {o.customerName && (
                          <span style={{ fontSize: 13, color: 'var(--ops-text-sec)' }}>
                            {o.customerName}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--ops-text-dim)' }}>
                          {formatElapsed(o.placedAt)}
                        </span>
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      {o.items.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: 13,
                            color: 'var(--ops-text-sec)',
                            display: 'flex',
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-mono, monospace)',
                              color: 'var(--ops-orange)',
                              fontWeight: 700,
                            }}
                          >
                            {item.qty}×
                          </span>
                          <span>{item.name}</span>
                          <span style={{ marginLeft: 'auto', color: 'var(--ops-text-dim)' }}>
                            {(item.qty * item.price).toFixed(2)} €
                          </span>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: 15,
                          fontWeight: 800,
                          color: 'var(--ops-orange)',
                        }}
                      >
                        {o.total.toFixed(2)} €
                      </span>
                      <button
                        onClick={() => requestServeFromQueue(o)}
                        style={{
                          background: 'var(--ops-green)',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 16px',
                          color: '#0a0a0a',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Entregatu
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 14px 28px',
            background: 'var(--ops-bg)',
            borderTop: '1px solid var(--ops-border)',
          }}
        >
          <button
            onClick={() => setShowNewOrder(true)}
            style={{
              width: '100%',
              background: 'var(--ops-orange)',
              border: 'none',
              borderRadius: 14,
              padding: '18px',
              color: '#fff',
              fontSize: 17,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Eskaera berria
          </button>
        </div>
      </div>

      {mobileTrackingEnabled && completedOrders.length > 0 && slug && (
        <CompletedOrdersPanel
          completedOrders={completedOrders}
          completedPanelOpen={completedPanelOpen}
          setCompletedPanelOpen={setCompletedPanelOpen}
          expandedQr={expandedQr}
          setExpandedQr={setExpandedQr}
          slug={slug}
        />
      )}

      {handoffOrder && slug && (
        <HandoffCard
          orderNumber={handoffOrder.orderNumber}
          verificationCode={handoffOrder.verificationCode}
          trackingUrl={
            typeof window !== 'undefined'
              ? `${window.location.origin}/eu/${slug}/track/${handoffOrder.verificationCode}`
              : ''
          }
          trackingEntryPath={`/${slug}/track`}
          onDismiss={() => setHandoffOrder(null)}
        />
      )}
    </>
  );
}
