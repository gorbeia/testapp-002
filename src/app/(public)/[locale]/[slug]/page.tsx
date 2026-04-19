'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { MOCK_TXOSNA, MOCK_CATEGORIES, MOCK_PRODUCTS, MockProduct } from '@/lib/mock-data';
import { CustomerHeader } from '@/components/layout/customer-header';
import { ProductSheet } from '@/components/ordering/product-sheet';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function MenuPage() {
  const params = useParams();
  const { count, total } = useCart();
  const [selected, setSelected] = useState<MockProduct | null>(null);
  const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0].id);

  const txosna = MOCK_TXOSNA;
  const filteredProducts = MOCK_PRODUCTS.filter((p) => p.categoryId === activeCategory);

  return (
    <>
      <CustomerHeader
        txosnaName={txosna.name}
        status={txosna.status}
        waitMinutes={txosna.waitMinutes ?? undefined}
        right={<ThemeToggle variant="cust" />}
      />

      {/* Category tabs */}
      <div
        style={{
          background: 'var(--cust-surface, #fff)',
          borderBottom: '1px solid var(--cust-border, #e5e7eb)',
          display: 'flex',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {MOCK_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              borderBottom: `3px solid ${activeCategory === cat.id ? 'var(--cust-primary, #e85d2f)' : 'transparent'}`,
              background: 'transparent',
              color:
                activeCategory === cat.id
                  ? 'var(--cust-primary, #e85d2f)'
                  : 'var(--cust-text-sec, #6b7280)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div style={{ padding: '16px 16px 120px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
          }}
        >
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => !p.soldOut && setSelected(p)}
              disabled={p.soldOut}
              style={{
                background: 'var(--cust-surface, #fff)',
                border: '1px solid var(--cust-border, #e5e7eb)',
                borderRadius: 14,
                padding: 0,
                cursor: p.soldOut ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                overflow: 'hidden',
                opacity: p.soldOut ? 0.55 : 1,
                transition: 'border-color 0.15s',
              }}
            >
              <div
                style={{
                  background: 'var(--cust-bg, #faf8f5)',
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                }}
              >
                {p.categoryId === 'cat-1' ? '🍔' : '🍺'}
              </div>
              <div style={{ padding: '10px 12px 12px' }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--cust-text-pri, #111)',
                    marginBottom: 2,
                  }}
                >
                  {p.name}
                </div>
                {p.description && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--cust-text-sec, #6b7280)',
                      marginBottom: 6,
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {p.description}
                  </div>
                )}
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span
                    style={{ fontSize: 15, fontWeight: 800, color: 'var(--cust-primary, #e85d2f)' }}
                  >
                    {p.price.toFixed(2)} €
                  </span>
                  {p.soldOut && (
                    <span
                      style={{
                        fontSize: 11,
                        background: 'rgba(239,68,68,0.15)',
                        color: '#ef4444',
                        padding: '2px 8px',
                        borderRadius: 99,
                        fontWeight: 600,
                      }}
                    >
                      Agortuta
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Floating cart bar */}
      {count > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 16px 28px',
            background: 'var(--cust-surface, #fff)',
            borderTop: '1px solid var(--cust-border, #e5e7eb)',
          }}
        >
          <Link
            href={`/eu/${params.slug}/checkout`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--cust-primary, #e85d2f)',
              borderRadius: 14,
              padding: '14px 18px',
              textDecoration: 'none',
              color: '#fff',
            }}
          >
            <span
              style={{
                background: 'rgba(255,255,255,0.25)',
                borderRadius: 99,
                padding: '2px 10px',
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              {count}
            </span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Saskia ikusi</span>
            <span style={{ fontSize: 16, fontWeight: 800 }}>{total.toFixed(2)} €</span>
          </Link>
        </div>
      )}

      {selected && <ProductSheet product={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
