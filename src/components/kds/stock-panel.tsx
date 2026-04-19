'use client';
import { useState } from 'react';
import { KdsProduct } from './types';

interface StockPanelProps {
  products: KdsProduct[];
  onToggle: (productIndex: number, complementIndex?: number) => void;
  onClose: () => void;
}

const btnStyle = (soldOut: boolean): React.CSSProperties => ({
  background: soldOut ? 'var(--ops-red)' : 'var(--ops-green)',
  border: 'none',
  borderRadius: 8,
  padding: '6px 14px',
  color: '#fff',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  minHeight: 34,
  flexShrink: 0,
});

export function StockPanel({ products, onToggle, onClose }: StockPanelProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => {
    // Auto-expand any product that has a sold-out complement
    const init: Record<number, boolean> = {};
    products.forEach((p, i) => {
      if (p.complements?.some((c) => c.soldOut)) init[i] = true;
    });
    return init;
  });

  const toggle = (i: number) => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--ops-surface)',
          border: '1px solid var(--ops-border-hi)',
          borderRadius: '20px 20px 0 0',
          padding: '24px 24px 40px',
          width: '100%',
          maxWidth: 480,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <span
            style={{
              color: 'var(--ops-text-sec)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Stocka kudeatu
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'var(--ops-surface-hi)',
              border: '1px solid var(--ops-border)',
              color: 'var(--ops-text-sec)',
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Itxi
          </button>
        </div>

        {/* Product list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {products.map((p, i) => {
            const hasComplements = p.complements && p.complements.length > 0;
            const isExpanded = expanded[i] ?? false;
            const compSoldOut = p.complements?.filter((c) => c.soldOut).length ?? 0;

            return (
              <div key={i}>
                {/* Product row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'var(--ops-surface-hi)',
                    borderRadius: isExpanded ? '10px 10px 0 0' : 10,
                    padding: '12px 14px',
                    border: `1px solid ${p.soldOut ? 'var(--ops-red)' : compSoldOut > 0 ? 'rgba(245,158,11,0.5)' : 'var(--ops-border)'}`,
                    borderBottom: isExpanded ? 'none' : undefined,
                  }}
                >
                  {/* Expand toggle */}
                  {hasComplements ? (
                    <button
                      onClick={() => toggle(i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--ops-text-dim)',
                        fontSize: 12,
                        padding: '2px 4px',
                        lineHeight: 1,
                        flexShrink: 0,
                        transition: 'transform 0.15s',
                        transform: isExpanded ? 'rotate(90deg)' : 'none',
                        display: 'inline-block',
                      }}
                      title="Osagarriak erakutsi"
                    >
                      ›
                    </button>
                  ) : (
                    <span style={{ width: 18, flexShrink: 0 }} />
                  )}

                  <span
                    style={{
                      flex: 1,
                      fontSize: 15,
                      fontWeight: 600,
                      color: p.soldOut ? 'var(--ops-red)' : 'var(--ops-text-pri)',
                      textDecoration: p.soldOut ? 'line-through' : 'none',
                    }}
                  >
                    {p.name}
                    {compSoldOut > 0 && !p.soldOut && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--ops-amber, #f59e0b)',
                          textDecoration: 'none',
                        }}
                      >
                        {compSoldOut} osagarri agortuta
                      </span>
                    )}
                  </span>

                  <button onClick={() => onToggle(i)} style={btnStyle(p.soldOut)}>
                    {p.soldOut ? 'Agortuta' : 'Erabilgarri'}
                  </button>
                </div>

                {/* Complements */}
                {hasComplements && isExpanded && (
                  <div
                    style={{
                      background: 'var(--ops-bg, #0f1117)',
                      border: `1px solid ${p.soldOut ? 'var(--ops-red)' : compSoldOut > 0 ? 'rgba(245,158,11,0.5)' : 'var(--ops-border)'}`,
                      borderTop: '1px solid var(--ops-border)',
                      borderRadius: '0 0 10px 10px',
                      overflow: 'hidden',
                    }}
                  >
                    {p.complements!.map((c, j) => (
                      <div
                        key={j}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 14px 9px 36px',
                          borderTop: j > 0 ? '1px solid var(--ops-border)' : undefined,
                        }}
                      >
                        <span
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: c.soldOut ? 'var(--ops-red)' : 'var(--ops-text-sec)',
                            textDecoration: c.soldOut ? 'line-through' : 'none',
                          }}
                        >
                          {c.name}
                        </span>
                        <button
                          onClick={() => onToggle(i, j)}
                          style={{ ...btnStyle(c.soldOut), fontSize: 11, padding: '5px 12px' }}
                        >
                          {c.soldOut ? 'Agortuta' : 'Erabilgarri'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
