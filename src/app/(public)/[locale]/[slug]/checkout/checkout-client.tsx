'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { CustomerHeader } from '@/components/layout/customer-header';
import { EditItemSheet } from '@/components/checkout/edit-item-sheet';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { StoredTxosna } from '@/lib/store/types';

interface CheckoutClientProps {
  txosna: Pick<StoredTxosna, 'name' | 'status' | 'waitMinutes' | 'enabledPaymentMethods'>;
}

export function CheckoutClient({ txosna }: CheckoutClientProps) {
  const router = useRouter();
  const params = useParams();
  const { items, total, clear, updateItem, removeAt } = useCart();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const hasCash = txosna.enabledPaymentMethods.includes('CASH');
  const hasOnline = txosna.enabledPaymentMethods.includes('ONLINE');
  const defaultMethod = hasCash ? 'CASH' : 'ONLINE';
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE'>(defaultMethod);

  const canSubmit = name.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug ?? '');
      const locale = Array.isArray(params.locale) ? params.locale[0] : (params.locale ?? '');

      const response = await fetch(`/api/txosnak/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'SELF_SERVICE',
          customerName: name.trim(),
          notes: notes.trim() || null,
          paymentMethod,
          lines: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedVariantOptionId: item.selectedVariantOptionId ?? null,
            selectedModifierIds: item.selectedModifierIds ?? [],
            splitInstructions: null,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? `Order creation failed (${response.status})`);
      }

      const order = await response.json();

      localStorage.setItem('txosna_order_id', order.id);
      localStorage.setItem('txosna_slug', slug);

      if (paymentMethod === 'ONLINE') {
        const returnUrl = `${window.location.origin}/${locale}/order/${order.id}`;
        const sessionRes = await fetch('/api/payments/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, returnUrl }),
        });

        if (!sessionRes.ok) {
          const sessionErr = await sessionRes.json().catch(() => ({}));
          throw new Error(sessionErr.error ?? `Payment session failed (${sessionRes.status})`);
        }

        const session = await sessionRes.json();
        clear();
        window.location.href = session.url;
        return;
      }

      clear();
      router.push(`/${locale}/order/${order.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errorea gertatu da';
      setError(message);
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <>
        <CustomerHeader
          txosnaName={txosna.name}
          status={txosna.status}
          right={<ThemeToggle variant="cust" />}
        />
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <p style={{ color: 'var(--cust-text-sec, #6b7280)', marginBottom: 20 }}>
            Saskia hutsik dago
          </p>
          <Link
            href={`/eu/${params.slug}`}
            style={{
              color: 'var(--cust-primary, #e85d2f)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            ← Menura itzuli
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <CustomerHeader
        txosnaName={txosna.name}
        status={txosna.status}
        right={<ThemeToggle variant="cust" />}
      />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 60px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-nunito, sans-serif)',
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--cust-text-pri, #111)',
            marginBottom: 20,
          }}
        >
          Eskaeraren laburpena
        </h1>

        {/* Items */}
        <div
          style={{
            background: 'var(--cust-surface, #fff)',
            borderRadius: 14,
            border: '1px solid var(--cust-border, #e5e7eb)',
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                padding: '13px 16px',
                borderBottom:
                  i < items.length - 1 ? '1px solid var(--cust-border, #e5e7eb)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Qty stepper */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() =>
                      item.quantity <= 1
                        ? removeAt(i)
                        : updateItem(i, { quantity: item.quantity - 1 })
                    }
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: '1.5px solid var(--cust-border, #e5e7eb)',
                      background: 'transparent',
                      fontSize: 16,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.quantity <= 1 ? '#ef4444' : 'var(--cust-text-sec, #6b7280)',
                      lineHeight: 1,
                    }}
                  >
                    {item.quantity <= 1 ? '🗑' : '−'}
                  </button>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 15,
                      fontWeight: 700,
                      minWidth: 18,
                      textAlign: 'center',
                      color: 'var(--cust-text-pri, #111)',
                    }}
                  >
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateItem(i, { quantity: item.quantity + 1 })}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'var(--cust-primary, #e85d2f)',
                      fontSize: 16,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      lineHeight: 1,
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Name + details */}
                <button
                  onClick={() => setEditingIndex(i)}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: 0,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: 'var(--cust-text-pri, #111)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {item.productName}
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--cust-primary, #e85d2f)',
                        fontWeight: 500,
                        background: 'rgba(232,93,47,0.08)',
                        borderRadius: 4,
                        padding: '1px 5px',
                      }}
                    >
                      Editatu
                    </span>
                  </div>
                  {item.selectedVariant && (
                    <div
                      style={{ fontSize: 12, color: 'var(--cust-text-sec, #6b7280)', marginTop: 1 }}
                    >
                      {item.selectedVariant}
                    </div>
                  )}
                  {item.selectedModifiers.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--cust-text-sec, #6b7280)' }}>
                      {item.selectedModifiers.join(', ')}
                    </div>
                  )}
                </button>

                {/* Line total */}
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--cust-text-pri, #111)',
                    flexShrink: 0,
                  }}
                >
                  {(item.unitPrice * item.quantity).toFixed(2)} €
                </span>
              </div>
            </div>
          ))}

          {/* Total row */}
          <div
            style={{
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              background: 'var(--cust-bg, #faf8f5)',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--cust-text-pri, #111)' }}>Guztira</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--cust-primary, #e85d2f)' }}>
              {total.toFixed(2)} €
            </span>
          </div>
        </div>

        {/* Wait time */}
        {txosna.waitMinutes && (
          <div
            style={{
              background: 'rgba(245,158,11,0.15)',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 13,
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>⏱</span>
            <span>
              Itxaron denbora gutxi gorabehera <strong>{txosna.waitMinutes} minutu</strong>
            </span>
          </div>
        )}

        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid #ef4444',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 14,
              fontSize: 13,
              color: '#ef4444',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--cust-text-sec, #6b7280)',
                marginBottom: 6,
              }}
            >
              Izena *
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Zure izena"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: `1px solid ${name.trim() ? 'var(--cust-border, #e5e7eb)' : '#fca5a5'}`,
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {!name.trim() && (
              <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
                Izena beharrezkoa da
              </div>
            )}
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--cust-text-sec, #6b7280)',
                marginBottom: 6,
              }}
            >
              Oharrak (aukerazkoa)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alergiak, nahiago duzuna..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid var(--cust-border, #e5e7eb)',
                fontSize: 14,
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Payment method selector — only shown when both methods are available */}
          {hasCash && hasOnline && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--cust-text-sec, #6b7280)',
                  marginBottom: 8,
                }}
              >
                Ordainketa modua
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(
                  [
                    { value: 'CASH', label: 'Dirutan', icon: '💵' },
                    { value: 'ONLINE', label: 'Online — Txartela', icon: '💳' },
                  ] as const
                ).map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: `2px solid ${paymentMethod === value ? 'var(--cust-primary, #e85d2f)' : 'var(--cust-border, #e5e7eb)'}`,
                      background:
                        paymentMethod === value
                          ? 'rgba(232,93,47,0.06)'
                          : 'var(--cust-surface, #fff)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{icon}</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color:
                          paymentMethod === value
                            ? 'var(--cust-primary, #e85d2f)'
                            : 'var(--cust-text-pri, #111)',
                      }}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !canSubmit}
            style={{
              background: !canSubmit ? 'var(--cust-surface-hi)' : 'var(--cust-primary, #e85d2f)',
              border: '1px solid var(--cust-border)',
              borderRadius: 12,
              padding: '15px 20px',
              color: !canSubmit ? 'var(--cust-text-sec)' : '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: submitting || !canSubmit ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              minHeight: 52,
            }}
          >
            {submitting
              ? paymentMethod === 'ONLINE'
                ? 'Ordainketara bidaltzen...'
                : 'Bidaltzen...'
              : paymentMethod === 'ONLINE'
                ? `Ordaindu online — ${total.toFixed(2)} €`
                : `Eskatu — ${total.toFixed(2)} €`}
          </button>
          <Link
            href={`/eu/${params.slug}`}
            style={{
              textAlign: 'center',
              color: 'var(--cust-text-sec, #6b7280)',
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            ← Menura itzuli
          </Link>
        </form>
      </div>

      {editingIndex !== null && (
        <EditItemSheet
          item={items[editingIndex]}
          index={editingIndex}
          onSave={updateItem}
          onRemove={removeAt}
          onClose={() => setEditingIndex(null)}
        />
      )}
    </>
  );
}
