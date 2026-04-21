'use client';
import { useState, useEffect } from 'react';

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
interface RemovableIngredient {
  id: string;
  name: string;
}

interface Product {
  id: string;
  categoryId: string;
  name: string;
  defaultPrice: string; // Decimal comes as string from JSON
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
}

interface Category {
  id: string;
  name: string;
  type: string;
  displayOrder: number;
  products: Product[];
}

interface VatType {
  id: string;
  label: string;
  percentage: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  ageRestricted: boolean;
  requiresPreparation: boolean;
  splittable: boolean;
  allergens: string[];
  dietaryFlags: string[];
  variantGroups: VariantGroup[];
  modifiers: Modifier[];
  removableIngredients: RemovableIngredient[];
  preparationInstructions: string;
  vatTypeId: string;
}

interface CategoryModalState {
  open: boolean;
  editId: string | null;
  name: string;
  type: 'FOOD' | 'DRINK';
}

/** 14 EU-regulated allergens — canonical English key, Basque label, emoji */
const ALLERGENS: { key: string; label: string; emoji: string }[] = [
  { key: 'gluten', label: 'Glutena (garia, sekelea...)', emoji: '🌾' },
  { key: 'crustaceans', label: 'Krustazeoak', emoji: '🦐' },
  { key: 'eggs', label: 'Arrautzak', emoji: '🥚' },
  { key: 'fish', label: 'Arraina', emoji: '🐟' },
  { key: 'peanuts', label: 'Kakahueteak', emoji: '🥜' },
  { key: 'soybeans', label: 'Soja', emoji: '🫘' },
  { key: 'milk', label: 'Esnea (laktosa barne)', emoji: '🥛' },
  { key: 'nuts', label: 'Fruitu oskoldunak', emoji: '🌰' },
  { key: 'celery', label: 'Apioa', emoji: '🥬' },
  { key: 'mustard', label: 'Mostaza', emoji: '🌻' },
  { key: 'sesame', label: 'Sesamo haziak', emoji: '🫚' },
  { key: 'sulphites', label: 'Sulfito dioxidoa eta sulfitoak', emoji: '🍷' },
  { key: 'lupin', label: 'Altramuze', emoji: '🌼' },
  { key: 'molluscs', label: 'Moluskuak', emoji: '🦑' },
];

/** Quick emoji lookup for display-only contexts */
const ALLERGEN_EMOJI: Record<string, string> = Object.fromEntries(
  ALLERGENS.map(({ key, emoji }) => [key, emoji])
);

function emptyForm(categoryId: string, defaultVatTypeId?: string): ProductForm {
  return {
    name: '',
    description: '',
    price: '',
    categoryId,
    ageRestricted: false,
    requiresPreparation: false,
    splittable: false,
    allergens: [],
    dietaryFlags: [],
    variantGroups: [],
    modifiers: [],
    removableIngredients: [],
    preparationInstructions: '',
    vatTypeId: defaultVatTypeId ?? '',
  };
}

function fromProduct(p: Product): ProductForm {
  return {
    name: p.name,
    description: p.description ?? '',
    price: String(p.defaultPrice),
    categoryId: p.categoryId,
    ageRestricted: p.ageRestricted,
    requiresPreparation: p.requiresPreparation,
    splittable: p.splittable,
    allergens: p.allergens,
    dietaryFlags: p.dietaryFlags,
    variantGroups: p.variantGroups.map((vg) => ({
      ...vg,
      options: vg.options.map((o) => ({ ...o })),
    })),
    modifiers: p.modifiers.map((m) => ({ ...m })),
    removableIngredients: (p.ingredients ?? '')
      .split(',')
      .filter(Boolean)
      .map((name, i) => ({ id: 'ri-' + i, name: name.trim() })),
    preparationInstructions: p.preparationInstructions ?? '',
    vatTypeId: (p as any).vatTypeId ?? '',
  };
}

function formToPayload(data: ProductForm) {
  const removableNames = data.removableIngredients.map((r) => r.name).filter(Boolean);
  return {
    name: data.name,
    categoryId: data.categoryId,
    defaultPrice: data.price,
    description: data.description || null,
    ageRestricted: data.ageRestricted,
    requiresPreparation: data.requiresPreparation,
    splittable: data.splittable,
    allergens: data.allergens,
    dietaryFlags: data.dietaryFlags,
    ingredients: removableNames.join(', ') || null,
    preparationInstructions: data.preparationInstructions || null,
    variantGroups: data.variantGroups,
    modifiers: data.modifiers,
    vatTypeId: data.vatTypeId || null,
  };
}

// ── Shared style helpers ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--adm-border)',
  fontSize: 14,
  outline: 'none',
  background: 'var(--adm-surface)',
  color: 'var(--adm-text-pri)',
  boxSizing: 'border-box',
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: 'var(--adm-text-sec)',
  marginBottom: 8,
};

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 99,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        border: `2px solid ${active ? '#e85d2f' : 'var(--adm-border)'}`,
        background: active ? 'var(--adm-surface)' : 'var(--adm-surface-hi)',
        color: active ? '#e85d2f' : 'var(--adm-text-sec)',
        transition: 'all 0.12s',
      }}
    >
      {label}
    </button>
  );
}

// ── Category Modal ─────────────────────────────────────────────────────────────

function CategoryModal({
  state,
  onSave,
  onClose,
}: {
  state: CategoryModalState;
  onSave: (name: string, type: 'FOOD' | 'DRINK') => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(state.name);
  const [type, setType] = useState<'FOOD' | 'DRINK'>(state.type);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--adm-surface)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px 16px' }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--adm-text-pri)',
              margin: '0 0 20px',
            }}
          >
            {state.editId ? 'Kategoria editatu' : 'Kategoria berria'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={sectionLabel}>Izena *</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adib.: Janaria"
                style={inputStyle}
                autoFocus
              />
            </div>
            <div>
              <div style={sectionLabel}>Mota</div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'FOOD' | 'DRINK')}
                style={{ ...inputStyle, background: 'var(--adm-surface)' }}
              >
                <option value="FOOD">🍔 Janaria</option>
                <option value="DRINK">🍺 Edaria</option>
              </select>
            </div>
          </div>
        </div>
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--adm-border)',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--adm-surface-hi)',
              border: 'none',
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
            type="button"
            onClick={() => name.trim() && onSave(name.trim(), type)}
            disabled={!name.trim()}
            style={{
              background: name.trim() ? '#e85d2f' : 'var(--adm-surface-hi)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: name.trim() ? '#fff' : 'var(--adm-text-sec)',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {state.editId ? 'Gorde' : 'Sortu'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── VAT Type Select ───────────────────────────────────────────────────────────

function VatTypeSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [vatTypes, setVatTypes] = useState<VatType[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/vat-types')
      .then((r) => r.json())
      .then((data) => {
        setVatTypes(data);
        // Auto-select IVA Reducido (10%) on first load if no selection
        if (!value && data.length > 0) {
          const reduced = data.find((v: VatType) => parseFloat(v.percentage) === 10);
          if (reduced) onChange(reduced.id);
        }
      })
      .catch((err) => console.error('Failed to load VAT types:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, background: 'var(--adm-surface)' }}
      disabled={loading}
    >
      <option value="">Aukeratu IVA</option>
      {vatTypes.map((vat) => (
        <option key={vat.id} value={vat.id}>
          {vat.label} ({vat.percentage}%)
        </option>
      ))}
    </select>
  );
}

// ── Product Modal ─────────────────────────────────────────────────────────────

function ProductModal({
  initial,
  isEdit,
  categories,
  onSave,
  onClose,
}: {
  initial: ProductForm;
  isEdit: boolean;
  categories: Category[];
  onSave: (f: ProductForm) => void;
  onClose: () => void;
}) {
  // Handle category change to update VAT type default
  const handleCategoryChange = (newCategoryId: string) => {
    setForm((f) => ({ ...f, categoryId: newCategoryId }));
  };
  const [form, setForm] = useState<ProductForm>(initial);
  const [tab, setTab] = useState<'basic' | 'variants' | 'modifiers' | 'prep'>('basic');

  const set =
    (k: keyof ProductForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleAllergen = (a: string) =>
    setForm((f) => ({
      ...f,
      allergens: f.allergens.includes(a) ? f.allergens.filter((x) => x !== a) : [...f.allergens, a],
    }));

  const toggleFlag = (flag: string) =>
    setForm((f) => ({
      ...f,
      dietaryFlags: f.dietaryFlags.includes(flag)
        ? f.dietaryFlags.filter((x) => x !== flag)
        : [...f.dietaryFlags, flag],
    }));

  const addVariantGroup = () =>
    setForm((f) => ({
      ...f,
      variantGroups: [...f.variantGroups, { id: 'vg-' + Date.now(), name: '', options: [] }],
    }));

  const updateVGName = (idx: number, name: string) =>
    setForm((f) => ({
      ...f,
      variantGroups: f.variantGroups.map((vg, i) => (i === idx ? { ...vg, name } : vg)),
    }));

  const removeVG = (idx: number) =>
    setForm((f) => ({ ...f, variantGroups: f.variantGroups.filter((_, i) => i !== idx) }));

  const addOption = (vgIdx: number) =>
    setForm((f) => ({
      ...f,
      variantGroups: f.variantGroups.map((vg, i) =>
        i === vgIdx
          ? { ...vg, options: [...vg.options, { id: 'vo-' + Date.now(), name: '', priceDelta: 0 }] }
          : vg
      ),
    }));

  const updateOption = (vgIdx: number, oIdx: number, key: 'name' | 'priceDelta', val: string) =>
    setForm((f) => ({
      ...f,
      variantGroups: f.variantGroups.map((vg, i) =>
        i === vgIdx
          ? {
              ...vg,
              options: vg.options.map((o, j) =>
                j === oIdx ? { ...o, [key]: key === 'priceDelta' ? parseFloat(val) || 0 : val } : o
              ),
            }
          : vg
      ),
    }));

  const removeOption = (vgIdx: number, oIdx: number) =>
    setForm((f) => ({
      ...f,
      variantGroups: f.variantGroups.map((vg, i) =>
        i === vgIdx ? { ...vg, options: vg.options.filter((_, j) => j !== oIdx) } : vg
      ),
    }));

  const addModifier = () =>
    setForm((f) => ({
      ...f,
      modifiers: [...f.modifiers, { id: 'mod-' + Date.now(), name: '', price: 0 }],
    }));

  const updateModifier = (idx: number, key: 'name' | 'price', val: string) =>
    setForm((f) => ({
      ...f,
      modifiers: f.modifiers.map((m, i) =>
        i === idx ? { ...m, [key]: key === 'price' ? parseFloat(val) || 0 : val } : m
      ),
    }));

  const removeModifier = (idx: number) =>
    setForm((f) => ({ ...f, modifiers: f.modifiers.filter((_, i) => i !== idx) }));

  const addRemovable = () =>
    setForm((f) => ({
      ...f,
      removableIngredients: [...f.removableIngredients, { id: 'ri-' + Date.now(), name: '' }],
    }));

  const updateRemovable = (idx: number, name: string) =>
    setForm((f) => ({
      ...f,
      removableIngredients: f.removableIngredients.map((r, i) => (i === idx ? { ...r, name } : r)),
    }));

  const removeRemovable = (idx: number) =>
    setForm((f) => ({
      ...f,
      removableIngredients: f.removableIngredients.filter((_, i) => i !== idx),
    }));

  const canSave = form.name.trim() && form.price;

  const modCount = form.modifiers.length + form.removableIngredients.length;
  const TABS = [
    { id: 'basic', label: 'Oinarrizkoa' },
    {
      id: 'variants',
      label: `Aldaerak${form.variantGroups.length ? ` (${form.variantGroups.length})` : ''}`,
    },
    { id: 'modifiers', label: `Gehigarriak${modCount ? ` (${modCount})` : ''}` },
    { id: 'prep', label: 'Prestaketa' },
  ] as const;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--adm-surface)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--adm-border)' }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--adm-text-pri)',
              margin: '0 0 16px',
            }}
          >
            {isEdit ? 'Produktua editatu' : 'Produktu berria'}
          </h2>
          <div style={{ display: 'flex', gap: 0 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  borderBottom: `2px solid ${tab === t.id ? '#e85d2f' : 'transparent'}`,
                  background: 'transparent',
                  color: tab === t.id ? '#e85d2f' : 'var(--adm-text-sec)',
                  transition: 'all 0.12s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {tab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={sectionLabel}>Izena *</div>
                <input
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Adib.: Burgerra"
                  style={inputStyle}
                />
              </div>

              <div>
                <div style={sectionLabel}>Deskribapena</div>
                <textarea
                  value={form.description}
                  onChange={set('description') as React.ChangeEventHandler<HTMLTextAreaElement>}
                  placeholder="Produktuaren deskribapena..."
                  rows={2}
                  style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={sectionLabel}>Prezioa (€) *</div>
                  <input
                    type="number"
                    value={form.price}
                    onChange={set('price')}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <div style={sectionLabel}>Kategoria</div>
                  <select
                    value={form.categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    style={{ ...inputStyle, background: 'var(--adm-surface)' }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div style={sectionLabel}>IVA Mota</div>
                <VatTypeSelect
                  value={form.vatTypeId}
                  onChange={(id) => setForm((f) => ({ ...f, vatTypeId: id }))}
                />
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  {
                    key: 'requiresPreparation' as const,
                    label: 'Sukaldea behar du',
                    hint: 'KDS-era bidaltzen da',
                  },
                  { key: 'ageRestricted' as const, label: 'Adin muga', hint: '+18 produktua' },
                  {
                    key: 'splittable' as const,
                    label: 'Zatiketa onartu',
                    hint: 'Hainbat pertsonaren artean zatitu daiteke',
                  },
                ].map(({ key, label, hint }) => (
                  <label
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--adm-surface-hi)',
                      border: '1px solid var(--adm-border)',
                      borderRadius: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--adm-text-pri)' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--adm-text-sec)' }}>{hint}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form[key] as boolean}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: '#e85d2f' }}
                    />
                  </label>
                ))}
              </div>

              {/* Allergens */}
              <div>
                <div style={sectionLabel}>Alergenoak</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ALLERGENS.map(({ key, label, emoji }) => (
                    <Chip
                      key={key}
                      label={`${emoji} ${label}`}
                      active={form.allergens.includes(key)}
                      onClick={() => toggleAllergen(key)}
                    />
                  ))}
                </div>
              </div>

              {/* Dietary flags */}
              <div>
                <div style={sectionLabel}>Dieta</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    { flag: 'V', label: '🌿 Begetariano' },
                    { flag: 'VG', label: '🌱 Begano' },
                    { flag: 'GF', label: '🚫🌾 Gluten gabe' },
                    { flag: 'HL', label: '☪️ Halal' },
                  ].map(({ flag, label }) => (
                    <Chip
                      key={flag}
                      label={label}
                      active={form.dietaryFlags.includes(flag)}
                      onClick={() => toggleFlag(flag)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'variants' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--adm-text-sec)', lineHeight: 1.5 }}>
                Aldaerek bezeroari aukerak ematen dizkiote (adib.: &ldquo;Albokoa: Patata /
                Entsalada&rdquo;). Talde bakoitzak aukera bat hautatu behar du.
              </div>

              {form.variantGroups.map((vg, vgIdx) => (
                <div
                  key={vg.id}
                  style={{
                    background: 'var(--adm-surface-hi)',
                    border: '1px solid var(--adm-border)',
                    borderRadius: 10,
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input
                      value={vg.name}
                      onChange={(e) => updateVGName(vgIdx, e.target.value)}
                      placeholder="Taldearen izena (adib.: Albokoa)"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => removeVG(vgIdx)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid var(--adm-border)',
                        borderRadius: 8,
                        background: 'var(--adm-surface-hi)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      Ezabatu
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {vg.options.map((opt, oIdx) => (
                      <div key={opt.id} style={{ display: 'flex', gap: 6 }}>
                        <input
                          value={opt.name}
                          onChange={(e) => updateOption(vgIdx, oIdx, 'name', e.target.value)}
                          placeholder="Aukeraren izena"
                          style={{ ...inputStyle, flex: 2 }}
                        />
                        <input
                          type="number"
                          value={opt.priceDelta || ''}
                          onChange={(e) => updateOption(vgIdx, oIdx, 'priceDelta', e.target.value)}
                          placeholder="+0.00"
                          step="0.01"
                          style={{ ...inputStyle, width: 90, flex: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(vgIdx, oIdx)}
                          style={{
                            padding: '8px 10px',
                            border: '1px solid var(--adm-border)',
                            borderRadius: 8,
                            background: 'transparent',
                            color: 'var(--adm-text-sec)',
                            cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(vgIdx)}
                      style={{
                        padding: '8px',
                        border: '1px dashed var(--adm-border)',
                        borderRadius: 8,
                        background: 'transparent',
                        color: 'var(--adm-text-sec)',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      + Aukera gehitu
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addVariantGroup}
                style={{
                  padding: '12px',
                  border: '1px dashed var(--adm-border)',
                  borderRadius: 10,
                  background: 'transparent',
                  color: '#e85d2f',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Aldaera taldea gehitu
              </button>
            </div>
          )}

          {tab === 'modifiers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Extras */}
              <div>
                <div style={sectionLabel}>Gehigarriak (prezio gehigarriekin)</div>
                <div style={{ fontSize: 12, color: 'var(--adm-text-sec)', marginBottom: 10 }}>
                  Produktuari gehitu daitezkeen aukerak, prezioa alda dezaketenak.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {form.modifiers.map((mod, idx) => (
                    <div key={mod.id} style={{ display: 'flex', gap: 6 }}>
                      <input
                        value={mod.name}
                        onChange={(e) => updateModifier(idx, 'name', e.target.value)}
                        placeholder="Adib.: Saltsa gehigarria"
                        style={{ ...inputStyle, flex: 2 }}
                      />
                      <input
                        type="number"
                        value={mod.price || ''}
                        onChange={(e) => updateModifier(idx, 'price', e.target.value)}
                        placeholder="+0.00"
                        step="0.01"
                        style={{ ...inputStyle, width: 90, flex: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeModifier(idx)}
                        style={{
                          padding: '8px 10px',
                          border: '1px solid var(--adm-border)',
                          borderRadius: 8,
                          background: 'transparent',
                          color: 'var(--adm-text-sec)',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addModifier}
                    style={{
                      padding: '10px',
                      border: '1px dashed var(--adm-border)',
                      borderRadius: 8,
                      background: 'transparent',
                      color: '#e85d2f',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    + Gehigarria gehitu
                  </button>
                </div>
              </div>

              {/* Removable ingredients */}
              <div>
                <div style={sectionLabel}>Kengarriak</div>
                <div style={{ fontSize: 12, color: 'var(--adm-text-sec)', marginBottom: 10 }}>
                  Bezeroak eskaeraren unean ken ditzakeen osagaiak (adib.: letxuga, tipula). Ez dute
                  preziorik aldatzen.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {form.removableIngredients.map((ri, idx) => (
                    <div key={ri.id} style={{ display: 'flex', gap: 6 }}>
                      <input
                        value={ri.name}
                        onChange={(e) => updateRemovable(idx, e.target.value)}
                        placeholder="Adib.: Letxuga"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => removeRemovable(idx)}
                        style={{
                          padding: '8px 10px',
                          border: '1px solid var(--adm-border)',
                          borderRadius: 8,
                          background: 'transparent',
                          color: 'var(--adm-text-sec)',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addRemovable}
                    style={{
                      padding: '10px',
                      border: '1px dashed var(--adm-border)',
                      borderRadius: 8,
                      background: 'transparent',
                      color: '#e85d2f',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    + Osagaia gehitu
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'prep' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--adm-text-sec)', lineHeight: 1.5 }}>
                Prestaketa argibideak sukaldean agertzen dira KDS pantailan. Markdown erabili
                daiteke.
              </div>
              <textarea
                value={form.preparationInstructions}
                onChange={
                  set('preparationInstructions') as React.ChangeEventHandler<HTMLTextAreaElement>
                }
                placeholder={'## Burgerra\n\n1. Hartu xerra...\n2. Jarri planxan...'}
                rows={12}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--adm-border)',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--adm-surface-hi)',
              border: 'none',
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
            type="button"
            onClick={() => canSave && onSave(form)}
            disabled={!canSave}
            style={{
              background: canSave ? '#e85d2f' : 'var(--adm-surface-hi)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: canSave ? '#fff' : 'var(--adm-text-sec)',
              cursor: canSave ? 'pointer' : 'not-allowed',
            }}
          >
            {isEdit ? 'Gorde aldaketak' : 'Sortu produktua'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Small icon button ─────────────────────────────────────────────────────────

function IconBtn({
  onClick,
  title,
  children,
  danger,
  disabled,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 7px',
        border: '1px solid var(--adm-border)',
        borderRadius: 6,
        background: 'transparent',
        color: danger ? '#ef4444' : 'var(--adm-text-sec)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12,
        lineHeight: 1,
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {children}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
                {/* Category controls */}
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
