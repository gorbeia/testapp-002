'use client';
import { useState } from 'react';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import type { CartItem } from '@/lib/mock-data';

interface EditItemSheetProps {
  item: CartItem;
  index: number;
  onSave: (index: number, patch: Partial<CartItem>) => void;
  onRemove: (index: number) => void;
  onClose: () => void;
}

export function EditItemSheet({ item, index, onSave, onRemove, onClose }: EditItemSheetProps) {
  const product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
  const [qty, setQty] = useState(item.quantity);
  const [variant, setVariant] = useState(item.selectedVariant);
  const [mods, setMods] = useState<string[]>(item.selectedModifiers);
  const [removals, setRemovals] = useState<string[]>([]);

  const toggleMod = (name: string) =>
    setMods((prev) => (prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]));
  const toggleRemoval = (name: string) =>
    setRemovals((prev) => (prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name]));

  const unitPrice = product
    ? product.price +
      (product.variantGroups.flatMap((vg) => vg.options).find((o) => o.name === variant)
        ?.priceDelta ?? 0) +
      mods.reduce((s, name) => s + (product.modifiers.find((m) => m.name === name)?.price ?? 0), 0)
    : item.unitPrice;

  const handleSave = () => {
    onSave(index, { quantity: qty, selectedVariant: variant, selectedModifiers: mods, unitPrice });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 200,
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

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-nunito, sans-serif)',
                fontSize: 20,
                fontWeight: 800,
                color: 'var(--cust-text-pri, #111)',
                margin: 0,
              }}
            >
              {item.productName}
            </h2>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--cust-primary, #e85d2f)',
                marginTop: 4,
              }}
            >
              {unitPrice.toFixed(2)} €
            </div>
          </div>
          <button
            onClick={() => {
              onRemove(index);
              onClose();
            }}
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              padding: '6px 12px',
              color: '#ef4444',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🗑 Kendu
          </button>
        </div>

        {/* Variants */}
        {product?.variantGroups.map((vg) => (
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

        {/* Removable ingredients */}
        {product && product.removableIngredients.length > 0 && (
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
                  onClick={() => toggleRemoval(ing)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 99,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: `2px solid ${removals.includes(ing) ? '#ef4444' : 'var(--cust-border, #e5e7eb)'}`,
                    background: removals.includes(ing) ? 'rgba(239,68,68,0.08)' : 'transparent',
                    color: removals.includes(ing) ? '#ef4444' : 'var(--cust-text-sec, #6b7280)',
                    transition: 'all 0.15s',
                  }}
                >
                  {removals.includes(ing) ? '✕ ' : ''}
                  {ing}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modifiers */}
        {product && product.modifiers.length > 0 && (
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
              {product.modifiers.map((mod) => (
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
                  {mod.price > 0 && (
                    <span style={{ fontSize: 13, color: 'var(--cust-text-sec, #6b7280)' }}>
                      +{mod.price.toFixed(2)} €
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cust-text-sec, #6b7280)' }}>
            Kopurua
          </span>
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            style={{
              width: 38,
              height: 38,
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
              width: 38,
              height: 38,
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
          onClick={handleSave}
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
          Gorde — {(unitPrice * qty).toFixed(2)} €
        </button>
      </div>
    </div>
  );
}
