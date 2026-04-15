'use client';
import { useState } from 'react';
import { calcUnitPrice } from '@/lib/hooks/use-product-config';
import type { MockProduct } from '@/lib/mock-data';

export interface OrderItemConfig {
  productId: string;
  qty: number;
  variant: string | null;
  modifiers: string[];
  notes: string;
  splitWays: number; // 1 = no split
}

interface ProductConfigSheetProps {
  product: MockProduct;
  existingConfig: OrderItemConfig | null;
  onSave: (config: OrderItemConfig) => void;
  onClose: () => void;
}

export function ProductConfigSheet({
  product,
  existingConfig,
  onSave,
  onClose,
}: ProductConfigSheetProps) {
  const [qty, setQty] = useState(existingConfig?.qty ?? 1);
  const [variant, setVariant] = useState<string | null>(
    existingConfig?.variant ?? product.variantGroups[0]?.options[0]?.name ?? null
  );
  const [modifiers, setModifiers] = useState<string[]>(existingConfig?.modifiers ?? []);
  const [removals, setRemovals] = useState<string[]>([]);
  const [notes, setNotes] = useState(existingConfig?.notes ?? '');
  const [splitWays, setSplitWays] = useState(existingConfig?.splitWays ?? 1);

  const toggleRemoval = (name: string) =>
    setRemovals((prev) => (prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name]));

  const toggleMod = (name: string) =>
    setModifiers((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    );

  const handleSave = () => {
    const removalNote = removals.length > 0 ? `Kendu: ${removals.join(', ')}` : '';
    const fullNotes = [removalNote, notes].filter(Boolean).join(' | ');
    onSave({ productId: product.id, qty, variant, modifiers, notes: fullNotes, splitWays });
  };

  const unitPrice = calcUnitPrice(product, variant, modifiers);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
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
        <h2
          style={{ fontSize: 20, fontWeight: 800, color: 'var(--ops-text-pri)', marginBottom: 4 }}
        >
          {product.name}
        </h2>
        <div
          style={{ fontSize: 16, fontWeight: 700, color: 'var(--ops-orange)', marginBottom: 20 }}
        >
          {product.price.toFixed(2)} €
        </div>

        {product.variantGroups.map((vg) => (
          <div key={vg.id} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ops-text-sec)',
                marginBottom: 8,
              }}
            >
              {vg.name}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {vg.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setVariant(opt.name)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 99,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border:
                      '2px solid ' +
                      (variant === opt.name ? 'var(--ops-orange)' : 'var(--ops-border)'),
                    background: variant === opt.name ? 'var(--ops-orange)' : 'transparent',
                    color: variant === opt.name ? '#fff' : 'var(--ops-text-pri)',
                  }}
                >
                  {opt.name}
                  {opt.priceDelta > 0 ? ' +' + opt.priceDelta.toFixed(2) + '€' : ''}
                </button>
              ))}
            </div>
          </div>
        ))}

        {product.removableIngredients.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ops-text-sec)',
                marginBottom: 8,
              }}
            >
              Kendu
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {product.removableIngredients.map((ing) => (
                <button
                  key={ing}
                  onClick={() => toggleRemoval(ing)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 99,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border:
                      '2px solid ' + (removals.includes(ing) ? '#ef4444' : 'var(--ops-border)'),
                    background: removals.includes(ing) ? 'rgba(239,68,68,0.1)' : 'transparent',
                    color: removals.includes(ing) ? '#ef4444' : 'var(--ops-text-sec)',
                  }}
                >
                  {removals.includes(ing) ? '✕ ' : ''}
                  {ing}
                </button>
              ))}
            </div>
            {removals.length > 0 && (
              <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>
                Kendu: {removals.join(', ')}
              </div>
            )}
          </div>
        )}

        {product.modifiers.filter((m) => m.price > 0).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ops-text-sec)',
                marginBottom: 8,
              }}
            >
              Gehigarriak
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {product.modifiers
                .filter((m) => m.price > 0)
                .map((mod) => (
                  <label
                    key={mod.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border:
                        '1px solid ' +
                        (modifiers.includes(mod.name) ? 'var(--ops-orange)' : 'var(--ops-border)'),
                      cursor: 'pointer',
                      background: modifiers.includes(mod.name)
                        ? 'rgba(232,98,47,0.08)'
                        : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={modifiers.includes(mod.name)}
                      onChange={() => toggleMod(mod.name)}
                      style={{ width: 18, height: 18, accentColor: 'var(--ops-orange)' }}
                    />
                    <span style={{ flex: 1, fontSize: 14, color: 'var(--ops-text-pri)' }}>
                      {mod.name}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--ops-text-sec)' }}>
                      +{mod.price.toFixed(2)} €
                    </span>
                  </label>
                ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--ops-text-sec)',
              marginBottom: 8,
            }}
          >
            Oharrak
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Adib: tipulaik gabe, ondo egina..."
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 8,
              border: '1px solid var(--ops-border)',
              background: 'var(--ops-bg)',
              color: 'var(--ops-text-pri)',
              fontSize: 14,
            }}
          />
        </div>

        {product.splitAllowed && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ops-text-sec)',
                marginBottom: 8,
              }}
            >
              Banatu
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                background: 'var(--ops-surface-hi)',
                borderRadius: 10,
                border: '1px solid var(--ops-border)',
                overflow: 'hidden',
              }}
            >
              {Array.from({ length: product.splitMaxWays }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setSplitWays(n)}
                  style={{
                    flex: 1,
                    padding: '12px 4px',
                    border: 'none',
                    borderRight: n < product.splitMaxWays ? '1px solid var(--ops-border)' : 'none',
                    background: splitWays === n ? 'var(--ops-orange)' : 'transparent',
                    color: splitWays === n ? '#fff' : 'var(--ops-text-sec)',
                    fontSize: n === 1 ? 12 : 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {n === 1 ? 'Ez' : n}
                </button>
              ))}
            </div>
            {splitWays > 1 && (
              <div style={{ fontSize: 12, color: 'var(--ops-blue)', marginTop: 6 }}>
                ⚡ {splitWays} pertsonatan banatuko da ·{' '}
                {((unitPrice * qty) / splitWays).toFixed(2)} € bakoitzeko
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '2px solid var(--ops-border)',
              background: 'transparent',
              fontSize: 20,
              cursor: 'pointer',
              color: 'var(--ops-text-pri)',
            }}
          >
            −
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>
            {qty}
          </span>
          <button
            onClick={() => setQty((q) => q + 1)}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--ops-orange)',
              fontSize: 20,
              cursor: 'pointer',
              color: '#fff',
            }}
          >
            +
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'var(--ops-surface-hi)',
              border: '1px solid var(--ops-border)',
              borderRadius: 10,
              padding: '14px',
              color: 'var(--ops-text-pri)',
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Utzi
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 2,
              background: 'var(--ops-green)',
              border: 'none',
              borderRadius: 10,
              padding: '14px',
              color: '#0a0a0a',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {existingConfig ? 'Gorde' : 'Gehitu'} — {(unitPrice * qty).toFixed(2)} €
          </button>
        </div>
      </div>
    </div>
  );
}
