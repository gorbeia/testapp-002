'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { OpsHeader } from '@/components/layout/ops-header';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { HandoffCard } from '@/components/counter/handoff-card';
import { QrCode } from '@/components/qr-code';
import type { StoredOrder } from '@/lib/store/types';

interface CompletedOrderEntry {
  orderNumber: number;
  verificationCode: string;
  customerName: string | null;
  confirmedAt: number;
}

interface LocalProduct {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  allergens: string[];
  dietaryFlags: ('V' | 'VG' | 'GF' | 'HL')[];
  ageRestricted: boolean;
  requiresPreparation: boolean;
  available: boolean;
  soldOut: boolean;
  variantGroups: unknown[];
  modifiers: unknown[];
  removableIngredients: string[];
  splitAllowed: boolean;
  splitMaxWays: number;
  preparationInstructions: string | null;
}

interface LocalOrderLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  selectedVariant: string | null;
  selectedModifiers: string[];
  splitInstructions: string | null;
}

interface LocalTicket {
  id: string;
  orderId: string;
  orderNumber: number;
  customerName: string | null;
  counterType: string;
  status: string;
  lines: LocalOrderLine[];
  notes: string | null;
  elapsedMin: number;
  isSlowOrder: boolean;
  hasAlert: boolean;
  flagged: boolean;
}
import { calcUnitPrice } from '@/lib/hooks/use-product-config';
import type { MockProduct } from '@/lib/mock-data';
import {
  ProductConfigSheet,
  type OrderItemConfig,
} from '@/components/counter/product-config-sheet';
import { useSSE } from '@/hooks/useSSE';

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
  const [pendingOrders, setPendingOrders] = useState<
    {
      id: string;
      orderNumber: number;
      customerName: string | null;
      lines: LocalOrderLine[];
      total: number;
      placedAt: number;
    }[]
  >([]);

  // Read slug from sessionStorage and fetch initial data
  useEffect(() => {
    const storedSlug = typeof window !== 'undefined' ? sessionStorage.getItem('txosna_slug') : null;
    if (!storedSlug) return;
    setSlug(storedSlug);

    // Fetch txosna name and settings
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

    // Fetch FOOD tickets (active statuses)
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

    // Fetch pending (PENDING_PAYMENT) orders
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

    // Fetch food catalog
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

  // SSE: refresh tickets/orders on real-time events
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

    // Optimistic update
    setTickets((prev) =>
      prev
        .map((t) => {
          if (t.id !== id) return t;
          return { ...t, status: next as typeof t.status, elapsedMin: 0, hasAlert: false };
        })
        .filter((t) => t.status !== 'COMPLETED')
    );

    // Persist to API
    fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).catch(() => {
      // Revert optimistic update on failure
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

      // On success, remove from pending and optionally add to tickets
      // (in a real implementation, you'd fetch updated tickets from SSE or API)
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
        // Denormalised for in-memory store compatibility
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
        // Refetch tickets to show new ticket from API
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

  // ── Full-page new order view ────────────────────────────────────────────────
  if (showNewOrder) {
    return (
      <div
        className="ops-theme"
        style={{ minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)' }}
      >
        <OpsHeader
          title="Eskaera berria"
          left={
            <button
              onClick={() => {
                setShowNewOrder(false);
                setNewOrder({ customerName: '', items: [] });
              }}
              style={{
                fontSize: 13,
                color: 'var(--ops-text-sec)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 2px',
              }}
            >
              ← Atzera
            </button>
          }
          right={
            newOrder.items.length > 0 ? (
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--ops-orange)',
                }}
              >
                {currentTotal.toFixed(2)} €
              </span>
            ) : undefined
          }
        />

        <div
          style={{ padding: '14px 14px 120px', display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          {/* Customer name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ops-text-sec)',
                marginBottom: 8,
              }}
            >
              Bezeroaren izena *
            </label>
            <input
              value={newOrder.customerName}
              onChange={(e) => setNewOrder((prev) => ({ ...prev, customerName: e.target.value }))}
              placeholder="Izena"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: `1px solid ${newOrder.customerName.trim() ? 'var(--ops-border)' : 'var(--ops-red)'}`,
                background: 'var(--ops-surface)',
                color: 'var(--ops-text-pri)',
                fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Quick product grid */}
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
              GEHITU PRODUKTUA
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {foodProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openProductConfig(p, undefined, undefined, true)}
                  style={{
                    background: 'var(--ops-surface)',
                    border: '1px solid var(--ops-border)',
                    borderRadius: 10,
                    padding: '12px 6px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>🍔</div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--ops-text-pri)',
                      lineHeight: 1.2,
                    }}
                  >
                    + {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ops-text-dim)', marginTop: 2 }}>
                    {p.price.toFixed(2)} €
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Items list */}
          {newOrder.items.length > 0 && (
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
                PRODUKTUAK
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {newOrder.items.map((item, index) => {
                  const product = foodProducts.find((p) => p.id === item.productId)!;
                  const unitPrice = calcUnitPrice(
                    product as unknown as MockProduct,
                    item.variant,
                    item.modifiers
                  );
                  return (
                    <div
                      key={index}
                      style={{
                        background: 'var(--ops-surface)',
                        border: '1px solid var(--ops-border)',
                        borderRadius: 12,
                        padding: '14px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono, monospace)',
                              fontSize: 16,
                              fontWeight: 700,
                              color: 'var(--ops-orange)',
                            }}
                          >
                            {item.qty}×
                          </span>
                          <span
                            style={{ fontSize: 15, fontWeight: 600, color: 'var(--ops-text-pri)' }}
                          >
                            {product.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => openProductConfig(product, item, index, true)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: '1px solid var(--ops-border)',
                              background: 'transparent',
                              cursor: 'pointer',
                              fontSize: 12,
                              color: 'var(--ops-text-sec)',
                            }}
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => removeItem(index)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: '1px solid var(--ops-red)',
                              background: 'transparent',
                              color: 'var(--ops-red)',
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      {item.variant && (
                        <div style={{ fontSize: 12, color: 'var(--ops-text-sec)', marginLeft: 32 }}>
                          {item.variant}
                        </div>
                      )}
                      {item.modifiers.length > 0 && (
                        <div style={{ fontSize: 12, color: 'var(--ops-text-sec)', marginLeft: 32 }}>
                          {item.modifiers.join(', ')}
                        </div>
                      )}
                      {item.notes && (
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--ops-orange)',
                            marginLeft: 32,
                            marginTop: 4,
                          }}
                        >
                          📝 {item.notes}
                        </div>
                      )}
                      {item.splitWays > 1 && (
                        <div style={{ fontSize: 12, color: 'var(--ops-blue)', marginLeft: 32 }}>
                          ⚡ {item.splitWays}tan banatu
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--ops-text-pri)',
                          marginLeft: 32,
                          marginTop: 6,
                        }}
                      >
                        {(unitPrice * item.qty).toFixed(2)} €
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky bottom bar */}
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
          {newOrder.items.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 10,
                paddingLeft: 4,
                paddingRight: 4,
              }}
            >
              <span style={{ fontSize: 15, color: 'var(--ops-text-sec)' }}>Guztira</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--ops-text-pri)',
                }}
              >
                {currentTotal.toFixed(2)} €
              </span>
            </div>
          )}
          {(() => {
            const ready = newOrder.items.length > 0 && newOrder.customerName.trim().length > 0;
            const label =
              newOrder.items.length === 0
                ? 'Gehitu produktuak'
                : !newOrder.customerName.trim()
                  ? 'Sartu izena lehenik'
                  : `✓ Sortu eta bidali sukaldera — ${currentTotal.toFixed(2)} €`;
            return (
              <button
                onClick={createOrder}
                disabled={!ready}
                style={{
                  width: '100%',
                  background: ready ? 'var(--ops-green)' : 'var(--ops-surface-hi)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '16px',
                  color: ready ? '#0a0a0a' : 'var(--ops-text-dim)',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: ready ? 'pointer' : 'not-allowed',
                }}
              >
                {label}
              </button>
            );
          })()}
        </div>

        {selectedProduct && (
          <ProductConfigSheet
            product={selectedProduct as unknown as MockProduct}
            existingConfig={editingItemIndex !== null ? newOrder.items[editingItemIndex] : null}
            onSave={saveProductConfig}
            onClose={() => {
              setSelectedProduct(null);
              setEditingItemIndex(null);
            }}
          />
        )}
      </div>
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
            <button
              style={{
                fontSize: 12,
                color: 'var(--ops-text-dim)',
                background: 'none',
                border: '1px solid var(--ops-border)',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              Gelditu
            </button>
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
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => {
            setShowOrderDetail(null);
            setAmountPaid('');
          }}
        >
          <div
            style={{
              background: 'var(--ops-surface)',
              borderRadius: '20px 20px 0 0',
              padding: '24px 20px 40px',
              width: '100%',
              maxWidth: 480,
              margin: '0 auto',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 40,
                height: 4,
                background: 'var(--ops-border)',
                borderRadius: 99,
                margin: '0 auto 20px',
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 4,
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 24,
                  fontWeight: 800,
                  color: 'var(--ops-text-pri)',
                }}
              >
                #{selectedOrder.orderNumber}
              </h2>
              <span
                style={{
                  fontSize: 12,
                  background: 'var(--ops-red)',
                  color: '#fff',
                  padding: '2px 10px',
                  borderRadius: 99,
                }}
              >
                Telefonoa • {formatElapsed(selectedOrder.placedAt)}
              </span>
            </div>
            <div style={{ fontSize: 16, color: 'var(--ops-text-sec)', marginBottom: 20 }}>
              {selectedOrder.customerName}
            </div>

            <div
              style={{
                background: 'var(--ops-surface-hi)',
                borderRadius: 10,
                padding: '14px',
                marginBottom: 20,
              }}
            >
              {selectedOrder.lines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    padding: '6px 0',
                    borderBottom:
                      i < selectedOrder.lines.length - 1 ? '1px solid var(--ops-border)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: 'var(--ops-text-pri)' }}>
                      {line.quantity}× {line.productName}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      {(line.quantity * line.unitPrice).toFixed(2)} €
                    </span>
                  </div>
                  {line.selectedVariant && (
                    <div style={{ fontSize: 12, color: 'var(--ops-text-sec)', marginLeft: 16 }}>
                      {line.selectedVariant}
                    </div>
                  )}
                  {line.selectedModifiers.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--ops-text-sec)', marginLeft: 16 }}>
                      {line.selectedModifiers.join(', ')}
                    </div>
                  )}
                  {line.splitInstructions && (
                    <div style={{ fontSize: 12, color: 'var(--ops-blue)', marginLeft: 16 }}>
                      ⚡ {line.splitInstructions}
                    </div>
                  )}
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '2px solid var(--ops-border)',
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700 }}>Guztira:</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--ops-orange)' }}>
                  {selectedOrder.total.toFixed(2)} €
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--ops-text-sec)',
                  marginBottom: 6,
                }}
              >
                Ordaindutakoa (trukerako)
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  border: '1px solid var(--ops-border)',
                  background: 'var(--ops-bg)',
                  color: 'var(--ops-text-pri)',
                  fontSize: 18,
                  fontWeight: 700,
                }}
              />
              {change > 0 && (
                <div style={{ marginTop: 8, fontSize: 14, color: 'var(--ops-green)' }}>
                  Trukea: {change.toFixed(2)} €
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  setShowOrderDetail(null);
                  setAmountPaid('');
                }}
                style={{
                  flex: 1,
                  background: 'var(--ops-surface-hi)',
                  border: '1px solid var(--ops-border)',
                  borderRadius: 10,
                  padding: '14px',
                  color: 'var(--ops-text-pri)',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Utzi
              </button>
              <button
                onClick={() => confirmPayment(selectedOrder.id)}
                style={{
                  flex: 2,
                  background: 'var(--ops-green)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '14px',
                  color: '#0a0a0a',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✓ Ordaindu · Sukaldera bidali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed orders panel */}
      {mobileTrackingEnabled && completedOrders.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--ops-surface)',
            borderTop: '2px solid var(--ops-border)',
            zIndex: 200,
          }}
        >
          <button
            onClick={() => setCompletedPanelOpen((o) => !o)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              color: 'var(--ops-text-pri)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Bukatutako eskaerak ({completedOrders.length})</span>
            <span>{completedPanelOpen ? '▴' : '▾'}</span>
          </button>
          {completedPanelOpen && (
            <div style={{ maxHeight: 320, overflowY: 'auto', padding: '0 12px 12px' }}>
              {completedOrders.map((o) => {
                const trackUrl =
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/eu/${slug}/track/${o.verificationCode}`
                    : '';
                return (
                  <div
                    key={o.orderNumber}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 0',
                      borderBottom: '1px solid var(--ops-border)',
                    }}
                  >
                    <div style={{ flex: 1, fontSize: 13 }}>
                      <span style={{ fontWeight: 700 }}>#{o.orderNumber}</span>
                      {o.customerName && <span style={{ opacity: 0.7 }}> · {o.customerName}</span>}
                      <br />
                      <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 600 }}>
                        {o.verificationCode}
                      </span>
                    </div>
                    <div
                      onClick={() =>
                        setExpandedQr(expandedQr === o.verificationCode ? null : o.verificationCode)
                      }
                      style={{ cursor: 'pointer' }}
                      title="QR handitu"
                    >
                      <QrCode value={trackUrl} size={48} />
                    </div>
                    <a
                      href={trackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 18, textDecoration: 'none' }}
                      title="Ireki jarraipena"
                    >
                      ↗
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Expanded QR overlay */}
      {expandedQr && slug && (
        <div
          onClick={() => setExpandedQr(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <QrCode
            value={
              typeof window !== 'undefined'
                ? `${window.location.origin}/eu/${slug}/track/${expandedQr}`
                : ''
            }
            size={280}
          />
        </div>
      )}

      {/* Handoff card */}
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
