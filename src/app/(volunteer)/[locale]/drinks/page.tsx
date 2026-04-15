'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { OpsHeader } from '@/components/layout/ops-header';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MOCK_PRODUCTS, MOCK_TXOSNA } from '@/lib/mock-data';

interface DrinksQueueOrder {
  id: string;
  number: number;
  customerName: string | null;
  items: { name: string; qty: number; price: number }[];
  total: number;
  placedAt: number;
}

const INITIAL_QUEUE: DrinksQueueOrder[] = [
  {
    id: 'd1',
    number: 41,
    customerName: 'Josu',
    items: [
      { name: 'Garagardoa', qty: 2, price: 2.5 },
      { name: 'Ura', qty: 1, price: 1.0 },
    ],
    total: 6.0,
    placedAt: Date.now() - 4 * 60 * 1000,
  },
  {
    id: 'd2',
    number: 38,
    customerName: null,
    items: [{ name: 'Ardoa', qty: 3, price: 3.0 }],
    total: 9.0,
    placedAt: Date.now() - 9 * 60 * 1000,
  },
];

export default function DrinksPage() {
  const _nextOrderNumRef = useRef(50);
  const drinkProducts = MOCK_PRODUCTS.filter((p) => p.categoryId === 'cat-2');
  const [queue, setQueue] = useState<DrinksQueueOrder[]>(INITIAL_QUEUE);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState('');
  const [showNewOrder, setShowNewOrder] = useState(false);

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
  };

  const formatElapsed = (placedAt: number) => {
    const mins = Math.floor((Date.now() - placedAt) / 60000);
    if (mins < 1) return 'Oraintxe';
    if (mins === 1) return 'Duela 1 min';
    return `Duela ${mins} min`;
  };

  // ── Full-page new order view ──────────────────────────────────────────────
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
                setCart({});
                setCustomerName('');
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
            cartCount > 0 ? (
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--ops-orange)',
                }}
              >
                {cartTotal.toFixed(2)} €
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
              Bezeroaren izena
            </label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="(aukerakoa)"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: '1px solid var(--ops-border)',
                background: 'var(--ops-surface)',
                color: 'var(--ops-text-pri)',
                fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Drinks grid */}
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
              EDARIAK
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {drinkProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p.name)}
                  style={{
                    background: 'var(--ops-surface)',
                    border: `2px solid ${cart[p.name] ? 'var(--ops-orange)' : 'var(--ops-border)'}`,
                    borderRadius: 10,
                    padding: '12px 6px',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 4 }}>🍺</div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--ops-text-pri)',
                      lineHeight: 1.2,
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ops-text-dim)', marginTop: 2 }}>
                    {p.price.toFixed(2)} €
                  </div>
                  {cart[p.name] > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        background: 'var(--ops-orange)',
                        color: '#fff',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 800,
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {cart[p.name]}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Cart summary */}
          {cartCount > 0 && (
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
                SASKIA
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(cart).map(([name, qty]) => {
                  const p = drinkProducts.find((p) => p.name === name);
                  return (
                    <div
                      key={name}
                      style={{
                        background: 'var(--ops-surface)',
                        border: '1px solid var(--ops-border)',
                        borderRadius: 10,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'var(--ops-orange)',
                          minWidth: 28,
                        }}
                      >
                        {qty}×
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--ops-text-pri)',
                        }}
                      >
                        {name}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--ops-text-sec)' }}>
                        {((p?.price ?? 0) * qty).toFixed(2)} €
                      </span>
                      <button
                        onClick={() => removeFromCart(name)}
                        style={{
                          background: 'none',
                          border: '1px solid var(--ops-border)',
                          borderRadius: 6,
                          padding: '2px 8px',
                          fontSize: 14,
                          color: 'var(--ops-text-dim)',
                          cursor: 'pointer',
                        }}
                      >
                        −
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky bottom */}
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
          {cartCount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 15, color: 'var(--ops-text-sec)' }}>Guztira</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--ops-text-pri)',
                }}
              >
                {cartTotal.toFixed(2)} €
              </span>
            </div>
          )}
          <button
            onClick={serve}
            disabled={cartCount === 0}
            style={{
              width: '100%',
              background: cartCount === 0 ? 'var(--ops-surface-hi)' : 'var(--ops-green)',
              border: 'none',
              borderRadius: 12,
              padding: '16px',
              color: cartCount === 0 ? 'var(--ops-text-dim)' : '#0a0a0a',
              fontSize: 16,
              fontWeight: 700,
              cursor: cartCount === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {cartCount === 0 ? 'Gehitu edariak' : `✓ Entregatu — ${cartTotal.toFixed(2)} €`}
          </button>
        </div>
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <div
      className="ops-theme"
      style={{ minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)' }}
    >
      <OpsHeader
        title={MOCK_TXOSNA.name}
        subtitle="Edariak · Mostradore"
        statusColor="green"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle variant="ops" />
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
        {/* Pending queue from phone orders */}
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
                      onClick={() => serveFromQueue(o.id)}
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

        {/* New walk-up order CTA */}
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

        {/* Quick-serve grid for single drinks */}
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
            EDARI BAKARRA
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {drinkProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p.name)}
                style={{
                  background: 'var(--ops-surface)',
                  border: `2px solid ${cart[p.name] ? 'var(--ops-orange)' : 'var(--ops-border)'}`,
                  borderRadius: 10,
                  padding: '12px 6px',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>🍺</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ops-text-pri)' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ops-text-dim)', marginTop: 2 }}>
                  {p.price.toFixed(2)} €
                </div>
                {cart[p.name] > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background: 'var(--ops-orange)',
                      color: '#fff',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 800,
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {cart[p.name]}
                  </div>
                )}
              </button>
            ))}
          </div>

          {cartCount > 0 && (
            <div
              style={{
                marginTop: 12,
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
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--ops-text-sec)' }}>
                  {Object.entries(cart)
                    .map(([name, qty]) => `${qty}× ${name}`)
                    .join(', ')}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 15,
                    fontWeight: 800,
                    color: 'var(--ops-orange)',
                  }}
                >
                  {cartTotal.toFixed(2)} €
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setCart({})}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: '1px solid var(--ops-border)',
                    borderRadius: 8,
                    padding: '10px',
                    color: 'var(--ops-text-sec)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Utzi
                </button>
                <button
                  onClick={serve}
                  style={{
                    flex: 2,
                    background: 'var(--ops-green)',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px',
                    color: '#0a0a0a',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ✓ Entregatu — {cartTotal.toFixed(2)} €
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
