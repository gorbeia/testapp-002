'use client';
import { OpsHeader } from '@/components/layout/ops-header';
import type { DrinkProduct } from '@/app/(volunteer)/[locale]/drinks/_types';

interface NewDrinkOrderSheetProps {
  drinkProducts: DrinkProduct[];
  cart: Record<string, number>;
  customerName: string;
  setCustomerName: (v: string) => void;
  cartTotal: number;
  cartCount: number;
  onBack: () => void;
  onAddToCart: (name: string) => void;
  onRemoveFromCart: (name: string) => void;
  onServeCart: () => void;
  onAddToQueue: () => void;
}

export function NewDrinkOrderSheet({
  drinkProducts,
  cart,
  customerName,
  setCustomerName,
  cartTotal,
  cartCount,
  onBack,
  onAddToCart,
  onRemoveFromCart,
  onServeCart,
  onAddToQueue,
}: NewDrinkOrderSheetProps) {
  return (
    <div
      className="ops-theme"
      style={{ minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)' }}
    >
      <OpsHeader
        title="Eskaera berria"
        left={
          <button
            onClick={onBack}
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
                onClick={() => onAddToCart(p.name)}
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
                      onClick={() => onRemoveFromCart(name)}
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

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 14px 28px',
          background: 'var(--ops-bg)',
          borderTop: '1px solid var(--ops-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {cartCount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
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
          onClick={cartCount > 0 ? onServeCart : undefined}
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
          {cartCount === 0 ? 'Gehitu edariak' : `✓ Entregatu orain — ${cartTotal.toFixed(2)} €`}
        </button>
        <button
          onClick={cartCount > 0 ? onAddToQueue : undefined}
          disabled={cartCount === 0}
          style={{
            width: '100%',
            background: 'none',
            border: `1px solid ${cartCount === 0 ? 'var(--ops-border)' : 'var(--ops-orange)'}`,
            borderRadius: 12,
            padding: '14px',
            color: cartCount === 0 ? 'var(--ops-text-dim)' : 'var(--ops-orange)',
            fontSize: 15,
            fontWeight: 700,
            cursor: cartCount === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Ilaran gehitu
        </button>
        <button
          onClick={onBack}
          style={{
            width: '100%',
            background: 'none',
            border: '1px solid var(--ops-border)',
            borderRadius: 12,
            padding: '14px',
            color: 'var(--ops-text-sec)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Utzi
        </button>
      </div>
    </div>
  );
}
