'use client';
import type { PendingOrder } from '@/app/(volunteer)/[locale]/counter/_types';

interface PendingOrderSheetProps {
  order: PendingOrder;
  amountPaid: string;
  setAmountPaid: (v: string) => void;
  change: number;
  formatElapsed: (at: number) => string;
  onClose: () => void;
  onConfirmPayment: (orderId: string) => void;
}

export function PendingOrderSheet({
  order,
  amountPaid,
  setAmountPaid,
  change,
  formatElapsed,
  onClose,
  onConfirmPayment,
}: PendingOrderSheetProps) {
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
            #{order.orderNumber}
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
            Telefonoa • {formatElapsed(order.placedAt)}
          </span>
        </div>
        <div style={{ fontSize: 16, color: 'var(--ops-text-sec)', marginBottom: 20 }}>
          {order.customerName}
        </div>

        <div
          style={{
            background: 'var(--ops-surface-hi)',
            borderRadius: 10,
            padding: '14px',
            marginBottom: 20,
          }}
        >
          {(() => {
            const groups = order.lines.reduce<
              { productId: string; productName: string; indices: number[] }[]
            >((acc, line, i) => {
              const g = acc.find((g) => g.productId === line.productId);
              if (g) g.indices.push(i);
              else
                acc.push({
                  productId: line.productId,
                  productName: line.productName,
                  indices: [i],
                });
              return acc;
            }, []);
            return groups.map((group, gi) => {
              const isLastGroup = gi === groups.length - 1;
              if (group.indices.length === 1) {
                const line = order.lines[group.indices[0]];
                return (
                  <div
                    key={group.productId + gi}
                    style={{
                      padding: '6px 0',
                      borderBottom: isLastGroup ? 'none' : '1px solid var(--ops-border)',
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
                );
              }
              const groupTotal = group.indices.reduce(
                (sum, i) => sum + order.lines[i].quantity * order.lines[i].unitPrice,
                0
              );
              return (
                <div
                  key={group.productId + gi}
                  style={{ borderBottom: isLastGroup ? 'none' : '1px solid var(--ops-border)' }}
                >
                  <div
                    style={{ padding: '6px 0', display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ops-text-pri)' }}>
                      {group.productName}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{groupTotal.toFixed(2)} €</span>
                  </div>
                  {group.indices.map((lineIdx, si) => {
                    const line = order.lines[lineIdx];
                    const isLastSub = si === group.indices.length - 1;
                    return (
                      <div
                        key={lineIdx}
                        style={{
                          padding: '4px 0 4px 16px',
                          borderTop: '1px dashed var(--ops-border)',
                          borderBottom: isLastSub ? 'none' : '1px dashed var(--ops-border)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13, color: 'var(--ops-text-pri)' }}>
                            {line.quantity}×
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>
                            {(line.quantity * line.unitPrice).toFixed(2)} €
                          </span>
                        </div>
                        {line.selectedVariant && (
                          <div style={{ fontSize: 12, color: 'var(--ops-text-sec)' }}>
                            {line.selectedVariant}
                          </div>
                        )}
                        {line.selectedModifiers.length > 0 && (
                          <div style={{ fontSize: 12, color: 'var(--ops-text-sec)' }}>
                            {line.selectedModifiers.join(', ')}
                          </div>
                        )}
                        {line.splitInstructions && (
                          <div style={{ fontSize: 12, color: 'var(--ops-blue)' }}>
                            ⚡ {line.splitInstructions}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            });
          })()}
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
              {order.total.toFixed(2)} €
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
            onClick={onClose}
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
            onClick={() => onConfirmPayment(order.id)}
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
  );
}
