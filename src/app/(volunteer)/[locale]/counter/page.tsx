'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { OpsHeader } from '@/components/layout/ops-header';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  MOCK_TICKETS,
  MOCK_TXOSNA,
  MOCK_PRODUCTS,
  type MockTicket,
  type MockOrderLine,
  type MockProduct,
} from '@/lib/mock-data';
import { calcUnitPrice } from '@/lib/hooks/use-product-config';
import {
  ProductConfigSheet,
  type OrderItemConfig,
} from '@/components/counter/product-config-sheet';

export default function CounterPage() {
  const nextOrderNumRef = useRef(50);
  const fromNewOrderRef = useRef(false);

  const foodTickets = MOCK_TICKETS.filter(
    (t) => t.counterType === 'FOOD' && t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
  );
  const [tickets, setTickets] = useState<MockTicket[]>(foodTickets);
  const [pendingOrders, setPendingOrders] = useState<
    {
      id: string;
      orderNumber: number;
      customerName: string | null;
      lines: MockOrderLine[];
      total: number;
      placedAt: number;
    }[]
  >([
    {
      id: 'phone-1',
      orderNumber: 45,
      customerName: 'Miren',
      lines: [
        {
          id: 'l1',
          productId: 'prod-1',
          productName: 'Burgerra',
          quantity: 2,
          unitPrice: 8.5,
          selectedVariant: 'Patata frijituak',
          selectedModifiers: [],
          splitInstructions: null,
        },
      ],
      total: 17.0,
      placedAt: Date.now() - 5 * 60 * 1000,
    },
    {
      id: 'phone-2',
      orderNumber: 44,
      customerName: 'Ane',
      lines: [
        {
          id: 'l2',
          productId: 'prod-2',
          productName: 'Txorizoa ogian',
          quantity: 1,
          unitPrice: 4.0,
          selectedVariant: null,
          selectedModifiers: [],
          splitInstructions: null,
        },
      ],
      total: 4.0,
      placedAt: Date.now() - 12 * 60 * 1000,
    },
  ]);

  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const [newOrder, setNewOrder] = useState<{ customerName: string; items: OrderItemConfig[] }>({
    customerName: '',
    items: [],
  });
  const [amountPaid, setAmountPaid] = useState<string>('');

  const foodProducts = MOCK_PRODUCTS.filter(
    (p) => p.categoryId === 'cat-1' && p.available && !p.soldOut
  );
  const topProducts = foodProducts.slice(0, 6);

  const [confirmReadyId, setConfirmReadyId] = useState<string | null>(null);

  const readyTickets = tickets.filter((t) => t.status === 'READY');
  const receivedPrepTickets = tickets.filter(
    (t) => t.status === 'RECEIVED' || t.status === 'IN_PREPARATION'
  );

  const advance = (id: string) => {
    setTickets((prev) =>
      prev
        .map((t) => {
          if (t.id !== id) return t;
          const next = (
            { RECEIVED: 'IN_PREPARATION', IN_PREPARATION: 'READY', READY: 'COMPLETED' } as Record<
              string,
              string
            >
          )[t.status];
          return {
            ...t,
            status: (next ?? t.status) as typeof t.status,
            elapsedMin: 0,
            hasAlert: false,
          };
        })
        .filter((t) => t.status !== 'COMPLETED')
    );
  };

  const confirmPayment = (orderId: string) => {
    const order = pendingOrders.find((o) => o.id === orderId);
    if (!order) return;
    const newTicket: MockTicket = {
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
    setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
    setShowOrderDetail(null);
    setAmountPaid('');
  };

  const createOrder = () => {
    if (newOrder.items.length === 0) return;
    const orderNum = nextOrderNumRef.current++;
    const lines: MockOrderLine[] = newOrder.items.map((item, i) => {
      const product = MOCK_PRODUCTS.find((p) => p.id === item.productId)!;
      const unitPrice = calcUnitPrice(product, item.variant, item.modifiers);

      return {
        id: 'l-' + Date.now() + '-' + i,
        productId: item.productId,
        productName: product.name,
        quantity: item.qty,
        unitPrice,
        selectedVariant: item.variant,
        selectedModifiers: item.modifiers,
        splitInstructions: item.splitWays > 1 ? `${item.splitWays}tan banatu` : null,
      };
    });

    const newTicket: MockTicket = {
      id: 'ticket-' + Date.now(),
      orderId: 'order-' + Date.now(),
      orderNumber: orderNum,
      customerName: newOrder.customerName || null,
      counterType: 'FOOD',
      status: 'RECEIVED',
      lines,
      notes: null,
      elapsedMin: 0,
      isSlowOrder: false,
      hasAlert: false,
      flagged: false,
    };
    setTickets((prev) => [...prev, newTicket]);
    setShowNewOrder(false);
    setNewOrder({ customerName: '', items: [] });
  };

  const openProductConfig = (
    product: MockProduct,
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
    const product = MOCK_PRODUCTS.find((p) => p.id === item.productId)!;
    return sum + calcUnitPrice(product, item.variant, item.modifiers) * item.qty;
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
                  const product = MOCK_PRODUCTS.find((p) => p.id === item.productId)!;
                  const unitPrice = calcUnitPrice(product, item.variant, item.modifiers);
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
            product={selectedProduct}
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
        title={MOCK_TXOSNA.name}
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
    </div>
  );
}
