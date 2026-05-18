'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { OpsHeader } from '@/components/layout/ops-header';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LogoutButton } from '@/components/auth/logout-button';
import { HandoffCard } from '@/components/counter/handoff-card';
import { NewOrderSheet } from '@/components/counter/new-order-sheet';
import { PendingOrderSheet } from '@/components/counter/pending-order-sheet';
import { CompletedOrdersPanel } from '@/components/counter/completed-orders-panel';
import { calcUnitPrice } from '@/lib/hooks/use-product-config';
import type { MockProduct } from '@/lib/mock-data';
import type { OrderItemConfig } from '@/components/counter/product-config-sheet';
import { useSSE } from '@/hooks/useSSE';
import type { StoredOrder } from '@/lib/store/types';
import type {
  CompletedOrderEntry,
  LocalProduct,
  LocalOrderLine,
  LocalTicket,
  PendingOrder,
} from './_types';

export default function CounterPage() {
  const nextOrderNumRef = useRef(50);
  const fromNewOrderRef = useRef(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [txosnaName, setTxosnaName] = useState('Txosna');

  const [mobileTrackingEnabled, setMobileTrackingEnabled] = useState(false);
  const [handoffOrder, setHandoffOrder] = useState<{
    orderNumber: number;
    verificationCode: string;
  } | null>(null);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrderEntry[]>([]);
  const [completedPanelOpen, setCompletedPanelOpen] = useState(false);
  const [expandedQr, setExpandedQr] = useState<string | null>(null);

  const [tickets, setTickets] = useState<LocalTicket[]>([]);
  const [foodProducts, setFoodProducts] = useState<LocalProduct[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);

  useEffect(() => {
    const storedSlug = typeof window !== 'undefined' ? sessionStorage.getItem('txosna_slug') : null;
    if (!storedSlug) return;
    setSlug(storedSlug);

    fetch(`/api/txosnak/${storedSlug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.name) setTxosnaName(d.name);
      })
      .catch(() => {});

    fetch(`/api/txosnak/${storedSlug}/settings`)
      .then((r) => r.json())
      .then((s) => {
        if (s.mobileTrackingEnabled) setMobileTrackingEnabled(true);
      })
      .catch(() => {});

    fetch(
      `/api/txosnak/${storedSlug}/tickets?counterType=FOOD&status=RECEIVED,IN_PREPARATION,READY`
    )
      .then((r) => r.json())
      .then(
        (data: {
          tickets: (LocalTicket & { orderNumber: number; customerName: string | null })[];
        }) => {
          setTickets(
            data.tickets.map((t) => ({
              ...t,
              elapsedMin: 0,
              isSlowOrder: false,
              hasAlert: false,
            }))
          );
        }
      )
      .catch(() => {});

    fetch(`/api/txosnak/${storedSlug}/orders?status=PENDING_PAYMENT`)
      .then((r) => r.json())
      .then((orders: StoredOrder[]) => {
        setPendingOrders(
          orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName,
            lines: (o.pendingLines?.[0]?.lines ?? []) as LocalOrderLine[],
            total: o.total,
            placedAt: new Date(o.createdAt).getTime(),
          }))
        );
      })
      .catch(() => {});

    fetch(`/api/txosnak/${storedSlug}/catalog`)
      .then((r) => r.json())
      .then(
        (categories: { id: string; name: string; type: string; products: LocalProduct[] }[]) => {
          const foodCats = categories.filter((c) => c.type === 'FOOD');
          const products = foodCats.flatMap((c) =>
            c.products.map((p) => ({
              ...p,
              price: (p as unknown as { effectivePrice: number }).effectivePrice ?? 0,
              categoryId: c.id,
            }))
          );
          setFoodProducts(products);
        }
      )
      .catch(() => {});
  }, []);

  useSSE(slug, {
    'order:confirmed': () => {
      if (!slug) return;
      fetch(`/api/txosnak/${slug}/tickets?counterType=FOOD&status=RECEIVED,IN_PREPARATION,READY`)
        .then((r) => r.json())
        .then(
          (data: {
            tickets: (LocalTicket & { orderNumber: number; customerName: string | null })[];
          }) => {
            setTickets(
              data.tickets.map((t) => ({
                ...t,
                elapsedMin: 0,
                isSlowOrder: false,
                hasAlert: false,
              }))
            );
          }
        )
        .catch(() => {});
      fetch(`/api/txosnak/${slug}/orders?status=PENDING_PAYMENT`)
        .then((r) => r.json())
        .then((orders: StoredOrder[]) => {
          setPendingOrders(
            orders.map((o) => ({
              id: o.id,
              orderNumber: o.orderNumber,
              customerName: o.customerName,
              lines: (o.pendingLines?.[0]?.lines ?? []) as LocalOrderLine[],
              total: o.total,
              placedAt: new Date(o.createdAt).getTime(),
            }))
          );
        })
        .catch(() => {});
    },
    'ticket:status_changed': (data: unknown) => {
      const { ticketId, newStatus } = data as { ticketId: string; newStatus: string };
      setTickets((prev) =>
        prev
          .map((t) =>
            t.id === ticketId ? { ...t, status: newStatus as LocalTicket['status'] } : t
          )
          .filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
      );
    },
  });

  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<LocalProduct | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const [newOrder, setNewOrder] = useState<{ customerName: string; items: OrderItemConfig[] }>({
    customerName: '',
    items: [],
  });
  const [amountPaid, setAmountPaid] = useState<string>('');

  const [confirmReadyId, setConfirmReadyId] = useState<string | null>(null);

  const readyTickets = tickets.filter((t) => t.status === 'READY');
  const receivedPrepTickets = tickets.filter(
    (t) => t.status === 'RECEIVED' || t.status === 'IN_PREPARATION'
  );

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
          return { ...t, status: next as typeof t.status, elapsedMin: 0, hasAlert: false };
        })
        .filter((t) => t.status !== 'COMPLETED')
    );

    fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).catch(() => {
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: ticket.status } : t)));
    });
  };

  const confirmPayment = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/confirm`, {
        method: 'POST',
      });

      if (!response.ok) {
        console.error('Failed to confirm order');
        return;
      }

      const order = pendingOrders.find((o) => o.id === orderId);
      if (order) {
        const newTicket: LocalTicket = {
          id: 'ticket-' + Date.now(),
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          counterType: 'FOOD',
          status: 'RECEIVED',
          lines: order.lines,
          notes: null,
          elapsedMin: 0,
          isSlowOrder: false,
          hasAlert: false,
          flagged: false,
        };
        setTickets((prev) => [...prev, newTicket]);
      }

      setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
      setShowOrderDetail(null);
      setAmountPaid('');
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  const createOrder = async () => {
    if (newOrder.items.length === 0 || !slug) return;

    const lines = newOrder.items.map((item) => {
      const product = foodProducts.find((p) => p.id === item.productId)!;
      const unitPrice = calcUnitPrice(
        product as unknown as MockProduct,
        item.variant,
        item.modifiers
      );
      return {
        productId: item.productId,
        quantity: item.qty,
        selectedVariantOptionId: null,
        selectedModifierIds: [],
        splitInstructions: item.splitWays > 1 ? `${item.splitWays}tan banatu` : null,
        productName: product.name,
        unitPrice,
        selectedVariant: item.variant,
        selectedModifiers: item.modifiers,
      };
    });

    setShowNewOrder(false);
    const savedOrder = { ...newOrder };
    setNewOrder({ customerName: '', items: [] });

    try {
      const res = await fetch(`/api/txosnak/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'COUNTER',
          customerName: savedOrder.customerName || null,
          notes: null,
          paymentMethod: 'CASH',
          lines,
        }),
      });
      if (res.ok) {
        const createdOrder = (await res.clone().json()) as StoredOrder;
        if (mobileTrackingEnabled && createdOrder.verificationCode) {
          setHandoffOrder({
            orderNumber: createdOrder.orderNumber,
            verificationCode: createdOrder.verificationCode,
          });
          setCompletedOrders((prev) =>
            [
              {
                orderNumber: createdOrder.orderNumber,
                verificationCode: createdOrder.verificationCode,
                customerName: createdOrder.customerName,
                confirmedAt: Date.now(),
              },
              ...prev,
            ].slice(0, 20)
          );
        }
        const data = (await fetch(
          `/api/txosnak/${slug}/tickets?counterType=FOOD&status=RECEIVED,IN_PREPARATION,READY`
        ).then((r) => r.json())) as {
          tickets: (LocalTicket & { orderNumber: number; customerName: string | null })[];
        };
        setTickets(
          data.tickets.map((t) => ({ ...t, elapsedMin: 0, isSlowOrder: false, hasAlert: false }))
        );
      }
    } catch {
      // Silent failure — the order form was already reset
    }

    nextOrderNumRef.current++;
  };

  const openProductConfig = (
    product: LocalProduct,
    existingItem?: OrderItemConfig,
    index?: number,
    fromNewOrder = false
  ) => {
    fromNewOrderRef.current = fromNewOrder;
    setSelectedProduct(product);
    if (existingItem && index !== undefined) {
      setEditingItemIndex(index);
    } else {
      setEditingItemIndex(null);
    }
  };

  const saveProductConfig = (config: OrderItemConfig) => {
    if (editingItemIndex !== null) {
      setNewOrder((prev) => ({
        ...prev,
        items: prev.items.map((item, i) => (i === editingItemIndex ? config : item)),
      }));
    } else {
      setNewOrder((prev) => ({ ...prev, items: [...prev.items, config] }));
    }
    setSelectedProduct(null);
    setEditingItemIndex(null);
    if (fromNewOrderRef.current) {
      setShowNewOrder(true);
    }
  };

  const removeItem = (index: number) => {
    setNewOrder((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const formatElapsed = (placedAt: number) => {
    const mins = Math.floor((Date.now() - placedAt) / 60000);
    if (mins < 1) return 'Oraintxe';
    if (mins === 1) return 'Duela 1 min';
    return 'Duela ' + mins + ' min';
  };

  const currentTotal = newOrder.items.reduce((sum, item) => {
    const product = foodProducts.find((p) => p.id === item.productId)!;
    return (
      sum +
      calcUnitPrice(product as unknown as MockProduct, item.variant, item.modifiers) * item.qty
    );
  }, 0);

  const selectedOrder = pendingOrders.find((o) => o.id === showOrderDetail);
  const change = selectedOrder && amountPaid ? parseFloat(amountPaid) - selectedOrder.total : 0;

  if (showNewOrder) {
    return (
      <NewOrderSheet
        foodProducts={foodProducts}
        newOrder={newOrder}
        setNewOrder={setNewOrder}
        currentTotal={currentTotal}
        selectedProduct={selectedProduct}
        editingItemIndex={editingItemIndex}
        onBack={() => {
          setShowNewOrder(false);
          setNewOrder({ customerName: '', items: [] });
          setSelectedProduct(null);
          setEditingItemIndex(null);
        }}
        onCreateOrder={createOrder}
        onOpenProductConfig={openProductConfig}
        onSaveProductConfig={saveProductConfig}
        onCloseProductConfig={() => {
          setSelectedProduct(null);
          setEditingItemIndex(null);
        }}
        onRemoveItem={removeItem}
      />
    );
  }

  return (
    <div
      className="ops-theme"
      style={{ minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)' }}
    >
      <OpsHeader
        title={txosnaName}
        subtitle="Janaria · Mostradore"
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
        style={{ padding: '14px 14px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        {pendingOrders.length > 0 && (
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
              ORDAINKETARIK GABE ({pendingOrders.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setShowOrderDetail(order.id)}
                  style={{
                    background: 'var(--ops-surface)',
                    border: '1px solid var(--ops-red)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: 18,
                        fontWeight: 800,
                        color: 'var(--ops-text-pri)',
                      }}
                    >
                      #{order.orderNumber}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ops-text-sec)' }}>
                      {order.customerName} — {order.lines.length} elementu
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--ops-red)' }}>
                      {formatElapsed(order.placedAt)}
                    </span>
                    <span style={{ fontSize: 18, color: 'var(--ops-text-dim)' }}>›</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

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
            letterSpacing: '0.01em',
          }}
        >
          + Eskaera berria
        </button>

        {receivedPrepTickets.length > 0 && (
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
              SUKALDEAN ({receivedPrepTickets.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {receivedPrepTickets.map((ticket) => (
                <div
                  key={ticket.id}
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
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: 16,
                          fontWeight: 700,
                          color: 'var(--ops-text-pri)',
                        }}
                      >
                        #{ticket.orderNumber}
                      </span>
                      {ticket.customerName && (
                        <span
                          style={{ fontSize: 13, color: 'var(--ops-text-sec)', marginLeft: 10 }}
                        >
                          {ticket.customerName}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setConfirmReadyId(ticket.id)}
                      style={{
                        background: 'var(--ops-orange)',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 12px',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      → Prest
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ops-text-dim)' }}>
                    {ticket.lines
                      .slice(0, 2)
                      .map((l) => l.quantity + '× ' + l.productName)
                      .join(', ')}
                    {ticket.lines.length > 2 && ' +' + (ticket.lines.length - 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {readyTickets.length > 0 && (
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--ops-green)',
                marginBottom: 10,
              }}
            >
              PREST JASOTZEKO ({readyTickets.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {readyTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  style={{
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid var(--ops-green)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: 18,
                        fontWeight: 800,
                        color: 'var(--ops-green)',
                      }}
                    >
                      #{ticket.orderNumber}
                    </div>
                    {ticket.customerName && (
                      <div style={{ fontSize: 13, color: 'var(--ops-text-sec)' }}>
                        {ticket.customerName}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => advance(ticket.id)}
                    style={{
                      background: 'var(--ops-green)',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 14px',
                      color: '#0a0a0a',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Jasota
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {confirmReadyId &&
        (() => {
          const t = tickets.find((x) => x.id === confirmReadyId)!;
          return (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
              }}
              onClick={() => setConfirmReadyId(null)}
            >
              <div
                style={{
                  background: 'var(--ops-surface)',
                  borderRadius: 16,
                  padding: '28px 24px',
                  width: '100%',
                  maxWidth: 360,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>🎉</div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: 'var(--ops-text-pri)',
                    textAlign: 'center',
                    marginBottom: 8,
                  }}
                >
                  Eskaera #{t.orderNumber} prest?
                </div>
                {t.customerName && (
                  <div
                    style={{
                      fontSize: 14,
                      color: 'var(--ops-text-sec)',
                      textAlign: 'center',
                      marginBottom: 20,
                    }}
                  >
                    {t.customerName}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--ops-text-dim)',
                    textAlign: 'center',
                    marginBottom: 24,
                  }}
                >
                  {t.lines
                    .slice(0, 3)
                    .map((l) => l.quantity + '× ' + l.productName)
                    .join(', ')}
                  {t.lines.length > 3 && ' +' + (t.lines.length - 3)}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setConfirmReadyId(null)}
                    style={{
                      flex: 1,
                      background: 'var(--ops-surface-hi)',
                      border: '1px solid var(--ops-border)',
                      borderRadius: 10,
                      padding: '13px',
                      color: 'var(--ops-text-pri)',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Utzi
                  </button>
                  <button
                    onClick={() => {
                      advance(confirmReadyId);
                      setConfirmReadyId(null);
                    }}
                    style={{
                      flex: 2,
                      background: 'var(--ops-green)',
                      border: 'none',
                      borderRadius: 10,
                      padding: '13px',
                      color: '#0a0a0a',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Bai, prest dago
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {selectedOrder && (
        <PendingOrderSheet
          order={selectedOrder}
          amountPaid={amountPaid}
          setAmountPaid={setAmountPaid}
          change={change}
          formatElapsed={formatElapsed}
          onClose={() => {
            setShowOrderDetail(null);
            setAmountPaid('');
          }}
          onConfirmPayment={confirmPayment}
        />
      )}

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
    </div>
  );
}
