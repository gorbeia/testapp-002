'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/lib/mock-data';

// ── Types ─────────────────────────────────────────────────────────────────────

interface VariantOption {
  id: string;
  name: string;
  priceDelta: number;
}

interface VariantGroup {
  id: string;
  name: string;
  options: VariantOption[];
}

interface Modifier {
  id: string;
  name: string;
  price: number;
}

interface TxosnaProduct {
  id: string;
  txosnaId: string;
  productId: string;
  available: boolean;
  soldOut: boolean;
  priceOverride: string | null;
  preparationInstructions: string | null;
}

interface Product {
  id: string;
  categoryId: string;
  name: string;
  defaultPrice: string;
  description: string | null;
  customerImageUrl: string | null;
  allergens: string[];
  dietaryFlags: string[];
  ageRestricted: boolean;
  splittable: boolean;
  requiresPreparation: boolean;
  displayOrder: number;
  ingredients: string | null;
  preparationInstructions: string | null;
  variantGroups: VariantGroup[];
  modifiers: Modifier[];
  txosnaProduct: TxosnaProduct | null;
}

interface Category {
  id: string;
  name: string;
  type: string;
  displayOrder: number;
  products: Product[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ALLERGEN_EMOJI: Record<string, string> = {
  gluten: '🌾',
  crustaceans: '🦐',
  eggs: '🥚',
  fish: '🐟',
  peanuts: '🥜',
  soybeans: '🫘',
  milk: '🥛',
  nuts: '🌰',
  celery: '🥬',
  mustard: '🌻',
  sesame: '🫚',
  sulphites: '🍷',
  lupin: '🌼',
  molluscs: '🦑',
};

// ── Debounce Hook ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

// ── Components ────────────────────────────────────────────────────────────────

export default function TxosnaProductsPage() {
  const params = useParams();
  const txosnaId = params.txosnaId as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, _setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [savingProducts, setSavingProducts] = useState<Set<string>>(new Set());
  const [usingMockData, setUsingMockData] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Transform mock data to match API format (products with txosnaProduct = null)
  const getMockCategories = (): Category[] => {
    return MOCK_CATEGORIES.map((cat) => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      displayOrder: cat.displayOrder,
      products: MOCK_PRODUCTS.filter((p) => p.categoryId === cat.id).map((p) => ({
        id: p.id,
        categoryId: p.categoryId,
        name: p.name,
        defaultPrice: String(p.price),
        description: p.description,
        customerImageUrl: p.imageUrl,
        allergens: p.allergens,
        dietaryFlags: p.dietaryFlags,
        ageRestricted: p.ageRestricted,
        splittable: p.splitAllowed,
        requiresPreparation: p.requiresPreparation,
        displayOrder: 0,
        ingredients: p.removableIngredients.join(', ') || null,
        preparationInstructions: p.preparationInstructions,
        variantGroups: p.variantGroups.map((vg) => ({
          id: vg.id,
          name: vg.name,
          options: vg.options.map((o) => ({
            id: o.id,
            name: o.name,
            priceDelta: o.priceDelta,
          })),
        })),
        modifiers: p.modifiers.map((m) => ({
          id: m.id,
          name: m.name,
          price: m.price,
        })),
        txosnaProduct: null, // Not enabled for any txosna by default
      })),
    }));
  };

  // Get base URL for API calls (works in client-side only)
  const getApiUrl = (path: string) => {
    if (typeof window === 'undefined') return path;
    return window.location.origin + path;
  };

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const apiUrl = getApiUrl(`/api/txosnak/${txosnaId}/products`);
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        if (data.length === 0) {
          // Fall back to mock data if API returns empty
          const mockData = getMockCategories();
          setCategories(mockData);
          setUsingMockData(true);
          if (mockData.length > 0) {
            setExpandedCategories(new Set([mockData[0].id]));
          }
        } else {
          setCategories(data);
          if (data.length > 0) {
            setExpandedCategories(new Set([data[0].id]));
          }
        }
      } catch {
        // Fall back to mock data on API error - this is expected in prototype mode
        const mockData = getMockCategories();
        setCategories(mockData);
        setUsingMockData(true);
        if (mockData.length > 0) {
          setExpandedCategories(new Set([mockData[0].id]));
        }
        // Don't set error - mock data is the intended fallback
        console.warn('Using mock data (API not available)');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [txosnaId]);

  // Toggle product enabled/disabled
  const handleToggleProduct = async (product: Product, enabled: boolean) => {
    setSavingProducts((prev) => new Set(prev).add(product.id));

    // Optimistic update
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        products: cat.products.map((p) =>
          p.id === product.id
            ? {
                ...p,
                txosnaProduct: enabled
                  ? {
                      id: '',
                      txosnaId,
                      productId: product.id,
                      available: true,
                      soldOut: false,
                      priceOverride: null,
                      preparationInstructions: null,
                    }
                  : null,
              }
            : p
        ),
      }))
    );

    try {
      const res = await fetch(getApiUrl(`/api/txosnak/${txosnaId}/products/${product.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          priceOverride: product.txosnaProduct?.priceOverride ?? null,
          preparationInstructions: product.txosnaProduct?.preparationInstructions ?? null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update product');

      // Update with actual server response if upsert created a record
      if (enabled && res.status === 200) {
        const saved = await res.json();
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            products: cat.products.map((p) =>
              p.id === product.id ? { ...p, txosnaProduct: saved } : p
            ),
          }))
        );
      }
    } catch {
      // In prototype mode, keep the optimistic update (mock data)
      console.warn('API save failed, keeping local state (prototype mode)');
      // Don't revert - the UI change stays for prototype testing
    } finally {
      setSavingProducts((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  // Helper to update product txosnaProduct in parent state
  const updateProductTxosnaProduct = (productId: string, updates: Partial<TxosnaProduct>) => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        products: cat.products.map((p) =>
          p.id === productId && p.txosnaProduct
            ? { ...p, txosnaProduct: { ...p.txosnaProduct, ...updates } }
            : p
        ),
      }))
    );
  };

  // Update price override (debounced)
  const debouncedUpdatePrice = useDebouncedCallback(
    async (product: Product, priceOverride: string | null) => {
      // Optimistic update
      updateProductTxosnaProduct(product.id, { priceOverride: priceOverride as string | null });

      try {
        const res = await fetch(getApiUrl(`/api/txosnak/${txosnaId}/products/${product.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enabled: true,
            priceOverride,
            preparationInstructions: product.txosnaProduct?.preparationInstructions ?? null,
          }),
        });

        if (!res.ok) throw new Error('Failed to update price');
      } catch {
        // Silently fail in prototype mode - local state already updated
        console.warn('Price save failed silently (prototype mode)');
      }
    },
    500
  );

  // Update preparation instructions (debounced)
  const debouncedUpdateInstructions = useDebouncedCallback(
    async (product: Product, preparationInstructions: string | null) => {
      // Optimistic update
      updateProductTxosnaProduct(product.id, { preparationInstructions });

      try {
        const res = await fetch(getApiUrl(`/api/txosnak/${txosnaId}/products/${product.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enabled: true,
            priceOverride: product.txosnaProduct?.priceOverride ?? null,
            preparationInstructions,
          }),
        });

        if (!res.ok) throw new Error('Failed to update instructions');
      } catch {
        // Silently fail in prototype mode - local state already updated
        console.warn('Instructions save failed silently (prototype mode)');
      }
    },
    500
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const totalProducts = categories.reduce((sum, cat) => sum + cat.products.length, 0);
  const enabledProducts = categories.reduce(
    (sum, cat) => sum + cat.products.filter((p) => p.txosnaProduct).length,
    0
  );

  if (loading) {
    return (
      <div
        style={{
          padding: '32px',
          background: 'var(--adm-bg)',
          minHeight: '100vh',
          color: 'var(--adm-text-sec)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Kargatzen...
      </div>
    );
  }

  if (_error) {
    return (
      <div
        style={{
          padding: '32px 32px 60px',
          background: 'var(--adm-bg)',
          minHeight: '100vh',
          color: 'var(--adm-text-pri)',
        }}
      >
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            color: '#ef4444',
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Errorea: {_error}</span>
          <button
            onClick={() => window.location.reload()}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'inherit',
              fontSize: 12,
              textDecoration: 'underline',
            }}
          >
            Berriz saiatu
          </button>
        </div>
      </div>
    );
  }

  if (totalProducts === 0) {
    return (
      <div
        style={{
          padding: '32px 32px 60px',
          background: 'var(--adm-bg)',
          minHeight: '100vh',
          color: 'var(--adm-text-pri)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-nunito, sans-serif)',
            fontSize: 24,
            fontWeight: 800,
            margin: '0 0 24px',
            color: 'var(--adm-text-pri)',
          }}
        >
          Produktuen hautaketa
        </h1>
        <div
          style={{
            textAlign: 'center',
            padding: '48px 20px',
            color: 'var(--adm-text-sec)',
            fontSize: 14,
            border: '1px dashed var(--adm-border)',
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <h2
            style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--adm-text-pri)' }}
          >
            Ez dago produkturik katalogo nagusian
          </h2>
          <p style={{ marginBottom: 24 }}>
            Gehitu produktuak menu katalogoan txosna honetan eskaintzen hasteko.
          </p>
          <Link
            href="/eu/menu"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              borderRadius: 8,
              background: '#e85d2f',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            → Joan menu katalogora
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '32px 32px 60px',
        background: 'var(--adm-bg)',
        minHeight: '100vh',
        color: 'var(--adm-text-pri)',
      }}
    >
      {/* Mock Data Banner */}
      {usingMockData && (
        <div
          style={{
            background: 'rgba(245,158,11,0.15)',
            color: '#f59e0b',
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>ℹ️ Erakusten diren datuak lokala dira (APIrik gabe)</span>
          <button
            onClick={() => window.location.reload()}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'inherit',
              fontSize: 12,
              textDecoration: 'underline',
            }}
          >
            Berriz saiatu
          </button>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-nunito, sans-serif)',
              fontSize: 24,
              fontWeight: 800,
              margin: '0 0 6px',
              color: 'var(--adm-text-pri)',
            }}
          >
            Produktuen hautaketa
          </h1>
          <p style={{ color: 'var(--adm-text-sec)', fontSize: 14, margin: 0 }}>
            Aukeratu zein produktu eskaini txosna honetan. Guztira: {enabledProducts} /{' '}
            {totalProducts}
          </p>
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const enabledCount = category.products.filter((p) => p.txosnaProduct).length;

          return (
            <div
              key={category.id}
              style={{
                border: '1px solid var(--adm-border)',
                borderRadius: 12,
                background: 'var(--adm-surface)',
                overflow: 'hidden',
              }}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: 'none',
                  background: isExpanded ? 'var(--adm-surface-hi)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderBottom: '1px solid var(--adm-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      padding: '6px 14px',
                      borderRadius: 99,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: isExpanded ? '#e85d2f' : 'var(--adm-surface-hi)',
                      color: isExpanded ? '#ffffff' : 'var(--adm-text-sec)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {category.name}
                    <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>
                      ({enabledCount}/{category.products.length})
                    </span>
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 18,
                    color: 'var(--adm-text-sec)',
                    transform: isExpanded ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}
                >
                  ▼
                </span>
              </button>

              {/* Products List */}
              {isExpanded && (
                <div
                  style={{
                    borderTop: '1px solid var(--adm-border)',
                    padding: '8px 0',
                  }}
                >
                  {category.products.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      isSaving={savingProducts.has(product.id)}
                      onToggle={handleToggleProduct}
                      onEdit={() => setEditingProduct(product)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <EditModal
        product={editingProduct}
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onSave={(productId, priceOverride, preparationInstructions) => {
          const product = categories.flatMap((c) => c.products).find((p) => p.id === productId);
          if (product) {
            updateProductTxosnaProduct(productId, { priceOverride, preparationInstructions });
            // Also trigger debounced API call
            debouncedUpdatePrice(product, priceOverride);
            debouncedUpdateInstructions(product, preparationInstructions);
          }
        }}
      />
    </div>
  );
}

// ── Product Row Component ──────────────────────────────────────────────────────

interface ProductRowProps {
  product: Product;
  isSaving: boolean;
  onToggle: (product: Product, enabled: boolean) => void;
  onEdit: (product: Product) => void;
}

function ProductRow({ product, isSaving, onToggle, onEdit }: ProductRowProps) {
  const isEnabled = !!product.txosnaProduct;
  const hasPriceOverride = !!product.txosnaProduct?.priceOverride;
  const hasInstructionsOverride = !!product.txosnaProduct?.preparationInstructions;

  return (
    <div
      style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--adm-border)',
        opacity: isSaving ? 0.7 : 1,
      }}
    >
      {/* Main Row - Styled like menu page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Product Icon */}
        <div
          style={{
            width: 44,
            height: 44,
            background: 'var(--adm-surface-hi)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {product.categoryId === 'cat-1' ? '🍔' : '🍺'}
        </div>

        {/* Product Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: isEnabled ? 'var(--adm-text-pri)' : 'var(--adm-text-sec)',
              }}
            >
              {product.name}
            </span>
            {product.ageRestricted && (
              <span
                style={{
                  fontSize: 10,
                  background: 'rgba(239,68,68,0.15)',
                  color: '#ef4444',
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontWeight: 700,
                }}
              >
                +18
              </span>
            )}
            {product.dietaryFlags.map((f) => (
              <span
                key={f}
                style={{
                  fontSize: 10,
                  background: 'rgba(34,197,94,0.15)',
                  color: '#22c55e',
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontWeight: 700,
                }}
              >
                {f}
              </span>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginTop: 4,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: '#e85d2f' }}>
              {parseFloat(product.defaultPrice).toFixed(2)} €
            </span>
            {product.allergens.length > 0 && (
              <span style={{ fontSize: 11, color: 'var(--adm-text-dim)' }}>
                {product.allergens.map((a) => ALLERGEN_EMOJI[a] ?? '⚠️').join('')}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 12,
              color: isEnabled ? '#22c55e' : 'var(--adm-text-sec)',
              marginTop: 4,
              fontWeight: isEnabled ? 500 : 400,
            }}
          >
            {isEnabled ? '✓ Eskuragarri txosna honetan' : 'Ez dago gaituta txosna honetan'}
          </div>
          {/* Override Indicators */}
          {isEnabled && (hasPriceOverride || hasInstructionsOverride) && (
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {hasPriceOverride && (
                <span
                  style={{
                    fontSize: 10,
                    background: 'rgba(232,93,47,0.15)',
                    color: '#e85d2f',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  💰 Prezioa aldatuta
                </span>
              )}
              {hasInstructionsOverride && (
                <span
                  style={{
                    fontSize: 10,
                    background: 'rgba(59,130,246,0.15)',
                    color: '#3b82f6',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  📝 Argibideak aldatuta
                </span>
              )}
            </div>
          )}
        </div>

        {/* Edit Button (when enabled) */}
        {isEnabled && (
          <button
            onClick={() => onEdit(product)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              cursor: 'pointer',
              border: '1px solid var(--adm-border)',
              background: 'var(--adm-surface)',
              color: 'var(--adm-text-sec)',
              flexShrink: 0,
            }}
          >
            ✏️ Editatu
          </button>
        )}

        {/* Toggle Switch */}
        <button
          onClick={() => onToggle(product, !isEnabled)}
          disabled={isSaving}
          style={{
            width: 48,
            height: 26,
            borderRadius: 99,
            border: 'none',
            background: isEnabled ? '#22c55e' : '#6b7280',
            cursor: isSaving ? 'wait' : 'pointer',
            position: 'relative',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: isEnabled ? 24 : 2,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'white',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </button>
      </div>
    </div>
  );
}

// ── Edit Modal Component ──────────────────────────────────────────────────────

interface EditModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    productId: string,
    priceOverride: string | null,
    preparationInstructions: string | null
  ) => void;
}

function EditModal({ product, isOpen, onClose, onSave }: EditModalProps) {
  const [price, setPrice] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (product) {
      setPrice(product.txosnaProduct?.priceOverride ?? '');
      setInstructions(product.txosnaProduct?.preparationInstructions ?? '');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSave = () => {
    const priceValue = price ? parseFloat(price) : null;
    onSave(product.id, priceValue !== null ? String(priceValue) : null, instructions || null);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '0 16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--adm-surface)',
          border: '1px solid var(--adm-border)',
          borderRadius: 16,
          padding: '24px',
          width: '100%',
          maxWidth: 480,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontFamily: 'var(--font-nunito, sans-serif)',
            fontSize: 20,
            fontWeight: 800,
            margin: '0 0 20px',
            color: 'var(--adm-text-pri)',
          }}
        >
          {product.name}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Price Override */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--adm-text-pri)',
                marginBottom: 6,
              }}
            >
              Prezioa aldatu
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={product.defaultPrice}
                style={{
                  width: 120,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--adm-border)',
                  fontSize: 14,
                  background: 'var(--adm-bg)',
                  color: 'var(--adm-text-pri)',
                }}
              />
              <span style={{ fontSize: 14, color: 'var(--adm-text-sec)' }}>€</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--adm-text-sec)', marginTop: 4 }}>
              Hutsi uzti bereziko preziotik: {parseFloat(product.defaultPrice).toFixed(2)} €
            </div>
          </div>

          {/* Instructions Override */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--adm-text-pri)',
                marginBottom: 6,
              }}
            >
              Prestaketa argibideak txosna honetarako
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={product.preparationInstructions || 'Gehitu argibide bereziak...'}
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--adm-border)',
                fontSize: 14,
                fontFamily: 'inherit',
                background: 'var(--adm-bg)',
                color: 'var(--adm-text-pri)',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            {product.preparationInstructions && (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--adm-text-sec)',
                  marginTop: 6,
                  fontStyle: 'italic',
                }}
              >
                Katalogo nagusiko argibidea: {product.preparationInstructions.substring(0, 100)}
                {product.preparationInstructions.length > 100 ? '...' : ''}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              onClick={onClose}
              style={{
                background: 'var(--adm-surface-hi)',
                border: '1px solid var(--adm-border)',
                borderRadius: 8,
                padding: '10px 18px',
                fontSize: 14,
                cursor: 'pointer',
                color: 'var(--adm-text-pri)',
              }}
            >
              Utzi
            </button>
            <button
              onClick={handleSave}
              style={{
                background: '#e85d2f',
                border: 'none',
                borderRadius: 8,
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              Gorde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
