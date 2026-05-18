'use client';
import { useState, useEffect } from 'react';
import { CategoryModal } from './_category-modal';
import { ProductModal } from './_product-modal';
import { IconBtn } from './_icon-btn';
import {
  type Category,
  type Product,
  type ProductForm,
  type CategoryModalState,
  ALLERGEN_EMOJI,
  emptyForm,
  fromProduct,
  formToPayload,
} from './_types';

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    open: boolean;
    editId: string | null;
    form: ProductForm;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [categoryModal, setCategoryModal] = useState<CategoryModalState | null>(null);
  const [availableKitchenPosts, setAvailableKitchenPosts] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/admin/txosnak')
      .then((r) => r.json())
      .then((d: { txosnak?: { slug: string }[] }) => {
        const slug = d.txosnak?.[0]?.slug;
        if (!slug) return;
        return fetch(`/api/txosnak/${slug}/settings`)
          .then((r) => r.json())
          .then((s: { kitchenPosts?: string[] }) => {
            if (s.kitchenPosts?.length) setAvailableKitchenPosts(s.kitchenPosts);
          });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => {
        if (!r.ok) throw new Error('API error');
        return r.json();
      })
      .then((data: Category[]) => {
        setCategories(data);
        if (data.length > 0) setActiveCategory(data[0].id);
      })
      .catch(() => {
        setError('Ezin dira kategoriak kargatu');
      })
      .finally(() => setLoading(false));
  }, []);

  const currentCategoryId = activeCategory || categories[0]?.id || '';
  const filtered = categories.find((c) => c.id === currentCategoryId)?.products ?? [];

  const openCreate = () =>
    setModal({ open: true, editId: null, form: emptyForm(currentCategoryId) });
  const openEdit = (p: Product) => setModal({ open: true, editId: p.id, form: fromProduct(p) });

  const handleSave = async (data: ProductForm) => {
    if (!modal || saving) return;
    setSaving(true);
    try {
      const payload = formToPayload(data);
      if (modal.editId) {
        const res = await fetch(`/api/products/${modal.editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Save failed');
        const updated: Product = await res.json();
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            products: cat.products.map((p) => (p.id === modal.editId ? updated : p)),
          }))
        );
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Save failed');
        const created: Product = await res.json();
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === created.categoryId ? { ...cat, products: [...cat.products, created] } : cat
          )
        );
        setActiveCategory(created.categoryId);
      }
      setModal(null);
    } catch {
      setError('Ezin izan da produktua gorde');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Produktua ezabatu nahi duzu?')) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.status === 409) {
        setError('Produktua ezabatu ezin da: eskaeretan dago');
        return;
      }
      if (!res.ok) throw new Error('Delete failed');
      setCategories((prev) =>
        prev.map((cat) => ({ ...cat, products: cat.products.filter((p) => p.id !== productId) }))
      );
    } catch {
      setError('Ezin izan da produktua ezabatu');
    }
  };

  const openCategoryCreate = () =>
    setCategoryModal({ open: true, editId: null, name: '', type: 'FOOD' });
  const openCategoryEdit = (cat: Category) =>
    setCategoryModal({
      open: true,
      editId: cat.id,
      name: cat.name,
      type: cat.type as 'FOOD' | 'DRINK',
    });

  const handleCategorySave = async (name: string, type: 'FOOD' | 'DRINK') => {
    if (!categoryModal) return;
    try {
      if (categoryModal.editId) {
        const res = await fetch(`/api/categories/${categoryModal.editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type }),
        });
        if (!res.ok) throw new Error('Save failed');
        const updated: Category = await res.json();
        setCategories((prev) =>
          prev.map((c) =>
            c.id === categoryModal.editId ? { ...c, name: updated.name, type: updated.type } : c
          )
        );
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type }),
        });
        if (!res.ok) throw new Error('Save failed');
        const created: Category = await res.json();
        setCategories((prev) => [...prev, { ...created, products: [] }]);
        setActiveCategory(created.id);
      }
      setCategoryModal(null);
    } catch {
      setError('Ezin izan da kategoria gorde');
    }
  };

  const handleCategoryDelete = async (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    if (!confirm(`"${cat.name}" kategoria ezabatu nahi duzu?`)) return;
    try {
      const res = await fetch(`/api/categories/${catId}`, { method: 'DELETE' });
      if (res.status === 409) {
        setError('Kategoriak produktuak ditu — ezabatu lehenik produktuak');
        return;
      }
      if (!res.ok) throw new Error('Delete failed');
      const remaining = categories.filter((c) => c.id !== catId);
      setCategories(remaining);
      if (activeCategory === catId) setActiveCategory(remaining[0]?.id ?? '');
    } catch {
      setError('Ezin izan da kategoria ezabatu');
    }
  };

  const reorderCategories = async (newOrder: Category[]) => {
    setCategories(newOrder);
    try {
      await fetch('/api/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: newOrder.map((c) => c.id) }),
      });
    } catch {
      setError('Ezin izan da ordena gorde');
    }
  };

  const moveCategoryLeft = (idx: number) => {
    if (idx === 0) return;
    const next = [...categories];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    reorderCategories(next);
  };

  const moveCategoryRight = (idx: number) => {
    if (idx === categories.length - 1) return;
    const next = [...categories];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    reorderCategories(next);
  };

  const reorderProducts = async (catId: string, newProducts: Product[]) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, products: newProducts } : c))
    );
    try {
      await fetch('/api/products/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: newProducts.map((p) => p.id) }),
      });
    } catch {
      setError('Ezin izan da ordena gorde');
    }
  };

  const moveProductUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...filtered];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    reorderProducts(currentCategoryId, next);
  };

  const moveProductDown = (idx: number) => {
    if (idx === filtered.length - 1) return;
    const next = [...filtered];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    reorderProducts(currentCategoryId, next);
  };

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

  return (
    <div
      style={{
        padding: '32px 32px 60px',
        background: 'var(--adm-bg)',
        minHeight: '100vh',
        color: 'var(--adm-text-pri)',
      }}
    >
      {error && (
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
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'inherit',
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-nunito, sans-serif)',
            fontSize: 24,
            fontWeight: 800,
            margin: 0,
            color: 'var(--adm-text-pri)',
          }}
        >
          Menu kudeaketa
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={openCategoryCreate}
            style={{
              background: 'var(--adm-surface-hi)',
              border: '1px solid var(--adm-border)',
              borderRadius: 8,
              padding: '8px 14px',
              color: 'var(--adm-text-pri)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Kategoria berria
          </button>
          <button
            onClick={openCreate}
            disabled={categories.length === 0}
            style={{
              background: '#e85d2f',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: categories.length === 0 ? 'not-allowed' : 'pointer',
              opacity: categories.length === 0 ? 0.5 : 1,
            }}
          >
            + Produktu berria
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
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
          Kategoriarik ez — sortu bat lehenengo
        </div>
      ) : (
        <>
          {/* Category tabs */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginBottom: 20,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {categories.map((cat, idx) => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <button
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 99,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    background: currentCategoryId === cat.id ? '#e85d2f' : 'var(--adm-surface-hi)',
                    color: currentCategoryId === cat.id ? '#ffffff' : 'var(--adm-text-sec)',
                    transition: 'all 0.15s',
                  }}
                >
                  {cat.name}
                  <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.8 }}>
                    ({cat.products.length})
                  </span>
                </button>
                <div style={{ display: 'flex', gap: 2 }}>
                  <IconBtn
                    onClick={() => moveCategoryLeft(idx)}
                    title="Ezkerrera mugitu"
                    disabled={idx === 0}
                  >
                    ←
                  </IconBtn>
                  <IconBtn
                    onClick={() => moveCategoryRight(idx)}
                    title="Eskuinera mugitu"
                    disabled={idx === categories.length - 1}
                  >
                    →
                  </IconBtn>
                  <IconBtn onClick={() => openCategoryEdit(cat)} title="Editatu">
                    ✏️
                  </IconBtn>
                  <IconBtn onClick={() => handleCategoryDelete(cat.id)} title="Ezabatu" danger>
                    🗑️
                  </IconBtn>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0 && (
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
                Produkturik ez kategoria honetan — gehitu bat
              </div>
            )}
            {filtered.map((p, idx) => (
              <div
                key={p.id}
                style={{
                  background: 'var(--adm-surface)',
                  border: '1px solid var(--adm-border)',
                  borderRadius: 12,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: 'var(--adm-surface-hi)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    flexShrink: 0,
                  }}
                >
                  {categories.find((c) => c.id === p.categoryId)?.type === 'FOOD' ? '🍔' : '🍺'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--adm-text-pri)' }}>
                      {p.name}
                    </span>
                    {p.ageRestricted && (
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
                    {p.dietaryFlags.map((f) => (
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
                  {p.description && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--adm-text-sec)',
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.description}
                    </div>
                  )}
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
                      {parseFloat(p.defaultPrice).toFixed(2)} €
                    </span>
                    {p.variantGroups.length > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--adm-text-dim)' }}>
                        · {p.variantGroups.length} aldaera talde
                      </span>
                    )}
                    {p.modifiers.length > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--adm-text-dim)' }}>
                        · {p.modifiers.length} gehigarri
                      </span>
                    )}
                    {p.allergens.length > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--adm-text-dim)' }}>
                        {p.allergens.map((a) => ALLERGEN_EMOJI[a] ?? '⚠️').join('')}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                  <IconBtn
                    onClick={() => moveProductUp(idx)}
                    title="Gora mugitu"
                    disabled={idx === 0}
                  >
                    ↑
                  </IconBtn>
                  <IconBtn
                    onClick={() => moveProductDown(idx)}
                    title="Behera mugitu"
                    disabled={idx === filtered.length - 1}
                  >
                    ↓
                  </IconBtn>
                  <IconBtn onClick={() => openEdit(p)} title="Editatu">
                    ✏️
                  </IconBtn>
                  <IconBtn onClick={() => handleDeleteProduct(p.id)} title="Ezabatu" danger>
                    🗑️
                  </IconBtn>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modal?.open && (
        <ProductModal
          initial={modal.form}
          isEdit={!!modal.editId}
          categories={categories}
          kitchenPosts={availableKitchenPosts}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {categoryModal?.open && (
        <CategoryModal
          state={categoryModal}
          onSave={handleCategorySave}
          onClose={() => setCategoryModal(null)}
        />
      )}
    </div>
  );
}
