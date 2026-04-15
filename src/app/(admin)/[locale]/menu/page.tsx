'use client';
import { useState, useEffect } from 'react';
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
}

const ALLERGEN_LIST = [
  'gluten',
  'laktosa',
  'arrautzak',
  'fruitu lehorrak',
  'soja',
  'krustazeoak',
  'arrain',
  'sesamo',
];
const ALLERGEN_EMOJI: Record<string, string> = {
  gluten: '🌾',
  laktosa: '🥛',
  arrautzak: '🥚',
  'fruitu lehorrak': '🥜',
  soja: '🫘',
  krustazeoak: '🦐',
  arrain: '🐟',
  sesamo: '🫚',
};

function emptyForm(categoryId: string): ProductForm {
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
                    onChange={set('categoryId') as React.ChangeEventHandler<HTMLSelectElement>}
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
                  {ALLERGEN_LIST.map((a) => (
                    <Chip
                      key={a}
                      label={`${ALLERGEN_EMOJI[a]} ${a}`}
                      active={form.allergens.includes(a)}
                      onClick={() => toggleAllergen(a)}
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

  // Transform mock products to match API format
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
      })),
    }));
  };

  // Get base URL for API calls (works in client-side only)
  const getApiUrl = (path: string) => {
    if (typeof window === 'undefined') return path;
    return window.location.origin + path;
  };

  useEffect(() => {
    fetch(getApiUrl('/api/categories'))
      .then((r) => {
        if (!r.ok) throw new Error('API error');
        return r.json();
      })
      .then((data: Category[]) => {
        if (data.length === 0) {
          // Fall back to mock data if API returns empty
          const mockData = getMockCategories();
          setCategories(mockData);
          if (mockData.length > 0 && !activeCategory) setActiveCategory(mockData[0].id);
        } else {
          setCategories(data);
          if (data.length > 0 && !activeCategory) setActiveCategory(data[0].id);
        }
      })
      .catch(() => {
        // Fall back to mock data on API error
        const mockData = getMockCategories();
        setCategories(mockData);
        if (mockData.length > 0 && !activeCategory) setActiveCategory(mockData[0].id);
        setError('Erakusten diren datuak lokala dira (APIrik gabe)');
      })
      .finally(() => setLoading(false));
  }, []);

  const currentCategoryId = activeCategory || categories[0]?.id || '';
  const filtered = categories.find((c) => c.id === currentCategoryId)?.products ?? [];

  // ... (rest of the code remains the same)
  const openCreate = () =>
    setModal({ open: true, editId: null, form: emptyForm(currentCategoryId) });
  const openEdit = (p: Product) => setModal({ open: true, editId: p.id, form: fromProduct(p) });

  const handleSave = async (data: ProductForm) => {
    if (!modal || saving) return;
    setSaving(true);
    try {
      const payload = formToPayload(data);
      if (modal.editId) {
        const res = await fetch(getApiUrl(`/api/products/${modal.editId}`), {
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
        const res = await fetch(getApiUrl('/api/products'), {
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
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '8px 16px',
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
            {filtered.map((p) => (
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
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <button
                    onClick={() => openEdit(p)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      cursor: 'pointer',
                      border: '1px solid var(--adm-border)',
                      background: 'var(--adm-surface)',
                      color: 'var(--adm-text-sec)',
                    }}
                  >
                    ✏️
                  </button>
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
    </div>
  );
}
