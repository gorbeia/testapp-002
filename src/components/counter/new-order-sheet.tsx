'use client';
import { OpsHeader } from '@/components/layout/ops-header';
import {
  ProductConfigSheet,
  type OrderItemConfig,
} from '@/components/counter/product-config-sheet';
import { calcUnitPrice } from '@/lib/hooks/use-product-config';
import type { MockProduct } from '@/lib/mock-data';
import type { LocalProduct } from '@/app/(volunteer)/[locale]/counter/_types';

interface NewOrderSheetProps {
  foodProducts: LocalProduct[];
  newOrder: { customerName: string; items: OrderItemConfig[] };
  setNewOrder: React.Dispatch<
    React.SetStateAction<{ customerName: string; items: OrderItemConfig[] }>
  >;
  currentTotal: number;
  selectedProduct: LocalProduct | null;
  editingItemIndex: number | null;
  onBack: () => void;
  onCreateOrder: () => void;
  onOpenProductConfig: (
    product: LocalProduct,
    existingItem?: OrderItemConfig,
    index?: number,
    fromNewOrder?: boolean
  ) => void;
  onSaveProductConfig: (config: OrderItemConfig) => void;
  onCloseProductConfig: () => void;
  onRemoveItem: (index: number) => void;
}

export function NewOrderSheet({
  foodProducts,
  newOrder,
  setNewOrder,
  currentTotal,
  selectedProduct,
  editingItemIndex,
  onBack,
  onCreateOrder,
  onOpenProductConfig,
  onSaveProductConfig,
  onCloseProductConfig,
  onRemoveItem,
}: NewOrderSheetProps) {
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
                onClick={() => onOpenProductConfig(p, undefined, undefined, true)}
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
                          onClick={() => onOpenProductConfig(product, item, index, true)}
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
                          onClick={() => onRemoveItem(index)}
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
              onClick={onCreateOrder}
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
          onSave={onSaveProductConfig}
          onClose={onCloseProductConfig}
        />
      )}
    </div>
  );
}
