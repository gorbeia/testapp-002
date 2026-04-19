'use client';
import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import type { StoredProductView } from '@/lib/store/types';

interface ProductSheetProps {
  product: StoredProductView;
  onClose: () => void;
}

export function ProductSheet({ product, onClose }: ProductSheetProps) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState<string | null>(
    product.variantGroups[0]?.options[0]?.name ?? null
  );
  const [mods, setMods] = useState<string[]>([]);

  const toggleMod = (name: string) =>
    setMods((prev) => (prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]));

  const handleAdd = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitPrice: product.effectivePrice,
      selectedVariant: variant,
      selectedModifiers: mods,
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--cust-surface, #fff)',
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
            background: 'var(--cust-border, #e5e7eb)',
            borderRadius: 99,
            margin: '0 auto 20px',
          }}
        />
        <h2
          style={{
            fontFamily: 'var(--font-nunito, sans-serif)',
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--cust-text-pri, #111)',
            marginBottom: 4,
          }}
        >
          {product.name}
        </h2>
        {product.description && (
          <p style={{ fontSize: 14, color: 'var(--cust-text-sec, #6b7280)', marginBottom: 16 }}>
            {product.description}
          </p>
        )}
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--cust-primary, #e85d2f)',
            marginBottom: 20,
          }}
        >
          {product.effectivePrice.toFixed(2)} €
        </div>

        {product.variantGroups.map((vg) => (
          <div key={vg.id} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--cust-text-sec, #6b7280)',
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
                    border: `2px solid ${variant === opt.name ? 'var(--cust-primary, #e85d2f)' : 'var(--cust-border, #e5e7eb)'}`,
                    background:
                      variant === opt.name ? 'var(--cust-primary, #e85d2f)' : 'transparent',
                    color: variant === opt.name ? '#fff' : 'var(--cust-text-pri, #111)',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.name}
                  {opt.priceDelta > 0 ? ` +${opt.priceDelta.toFixed(2)}€` : ''}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Removable ingredients - KENDU */}
        {product.removableIngredients.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--cust-text-sec, #6b7280)',
                marginBottom: 8,
              }}
            >
              Kendu
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {product.removableIngredients.map((ing) => (
                <button
                  key={ing}
                  onClick={() => toggleMod(`KENDU:${ing}`)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 99,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: `2px solid ${mods.includes(`KENDU:${ing}`) ? '#ef4444' : 'var(--cust-border, #e5e7eb)'}`,
                    background: mods.includes(`KENDU:${ing}`)
                      ? 'rgba(239,68,68,0.08)'
                      : 'transparent',
                    color: mods.includes(`KENDU:${ing}`)
                      ? '#ef4444'
                      : 'var(--cust-text-sec, #6b7280)',
                    transition: 'all 0.15s',
                  }}
                >
                  {mods.includes(`KENDU:${ing}`) ? '✕ ' : ''}
                  {ing}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modifiers with price - GEHIGARRIAK */}
        {product.modifiers.filter((m) => m.price > 0).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--cust-text-sec, #6b7280)',
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
                      border: `1px solid ${mods.includes(mod.name) ? 'var(--cust-primary, #e85d2f)' : 'var(--cust-border, #e5e7eb)'}`,
                      cursor: 'pointer',
                      background: mods.includes(mod.name) ? 'rgba(232,93,47,0.06)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={mods.includes(mod.name)}
                      onChange={() => toggleMod(mod.name)}
                      style={{ width: 18, height: 18, accentColor: 'var(--cust-primary, #e85d2f)' }}
                    />
                    <span style={{ flex: 1, fontSize: 14, color: 'var(--cust-text-pri, #111)' }}>
                      {mod.name}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--cust-text-sec, #6b7280)' }}>
                      +{mod.price.toFixed(2)} €
                    </span>
                  </label>
                ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '2px solid var(--cust-border, #e5e7eb)',
              background: 'transparent',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cust-text-pri, #111)',
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
              background: 'var(--cust-primary, #e85d2f)',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            +
          </button>
        </div>

        <button
          onClick={handleAdd}
          style={{
            width: '100%',
            background: 'var(--cust-primary, #e85d2f)',
            border: 'none',
            borderRadius: 12,
            padding: '15px 20px',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            minHeight: 52,
          }}
        >
          Saskira gehitu — {(product.effectivePrice * qty).toFixed(2)} €
        </button>
      </div>
    </div>
  );
}
