'use client';
import { useState } from 'react';
import { inputStyle, sectionLabel, Chip } from './_form-helpers';
import { VatTypeSelect } from './_vat-type-select';
import { ALLERGENS } from './_types';
import type { ProductForm, Category } from './_types';

export function ProductModal({
  initial,
  isEdit,
  categories,
  kitchenPosts,
  onSave,
  onClose,
}: {
  initial: ProductForm;
  isEdit: boolean;
  categories: Category[];
  kitchenPosts: string[];
  onSave: (f: ProductForm) => void;
  onClose: () => void;
}) {
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

  const updateOption = (
    vgIdx: number,
    oIdx: number,
    key: 'name' | 'priceDelta' | 'kitchenPost',
    val: string
  ) =>
    setForm((f) => ({
      ...f,
      variantGroups: f.variantGroups.map((vg, i) =>
        i === vgIdx
          ? {
              ...vg,
              options: vg.options.map((o, j) =>
                j === oIdx
                  ? {
                      ...o,
                      [key]:
                        key === 'priceDelta'
                          ? parseFloat(val) || 0
                          : key === 'kitchenPost'
                            ? val || null
                            : val,
                    }
                  : o
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

  const updateModifier = (idx: number, key: 'name' | 'price' | 'kitchenPost', val: string) =>
    setForm((f) => ({
      ...f,
      modifiers: f.modifiers.map((m, i) =>
        i === idx
          ? {
              ...m,
              [key]:
                key === 'price' ? parseFloat(val) || 0 : key === 'kitchenPost' ? val || null : val,
            }
          : m
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
                <div style={sectionLabel}>BEZ Mota</div>
                <VatTypeSelect
                  value={form.vatTypeId}
                  onChange={(id) => setForm((f) => ({ ...f, vatTypeId: id }))}
                />
              </div>

              {kitchenPosts.length > 0 && (
                <div>
                  <div style={sectionLabel}>Sukaldeko postua</div>
                  <select
                    value={form.kitchenPost ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, kitchenPost: e.target.value || null }))
                    }
                    style={{ ...inputStyle, background: 'var(--adm-surface)' }}
                  >
                    <option value="">— Orokorra (postu guztiak) —</option>
                    {kitchenPosts.map((p) => (
                      <option key={p} value={p}>
                        👨‍🍳 {p}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: 11, color: 'var(--adm-text-sec)', marginTop: 4 }}>
                    Produktu honen lerroa zein postutara bidaltzen den. Aldaerek edo gehigarriek
                    postu ezberdinera bideratu dezakete.
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  {
                    key: 'requiresPreparation' as const,
                    label: 'Sukaldea behar du',
                    hint: 'KDS-era bidaltzen da',
                  },
                  { key: 'ageRestricted' as const, label: 'Adin muga', hint: '+18 produktua' },
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

                {/* Split options segmented control */}
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--adm-surface-hi)',
                    border: '1px solid var(--adm-border)',
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--adm-text-pri)',
                      marginBottom: 4,
                    }}
                  >
                    Zatiketa
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--adm-text-sec)', marginBottom: 8 }}>
                    Bezeroek zenbat zatitan banatu dezaketen
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      borderRadius: 6,
                      overflow: 'hidden',
                      border: '1px solid var(--adm-border)',
                    }}
                  >
                    {([1, 2, 3, 4] as const).map((n, i) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            splittable: n > 1,
                            splitMaxWays: n,
                          }))
                        }
                        style={{
                          flex: 1,
                          padding: '6px 0',
                          fontSize: 13,
                          fontWeight: form.splitMaxWays === n ? 600 : 400,
                          background: form.splitMaxWays === n ? '#e85d2f' : 'transparent',
                          color: form.splitMaxWays === n ? '#fff' : 'var(--adm-text-sec)',
                          border: 'none',
                          borderLeft: i > 0 ? '1px solid var(--adm-border)' : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {n === 1 ? 'Ez' : `${n} zati`}
                      </button>
                    ))}
                  </div>
                </div>
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
                      <div
                        key={opt.id}
                        style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                      >
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            value={opt.name}
                            onChange={(e) => updateOption(vgIdx, oIdx, 'name', e.target.value)}
                            placeholder="Aukeraren izena"
                            style={{ ...inputStyle, flex: 2 }}
                          />
                          <input
                            type="number"
                            value={opt.priceDelta || ''}
                            onChange={(e) =>
                              updateOption(vgIdx, oIdx, 'priceDelta', e.target.value)
                            }
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
                        {kitchenPosts.length > 0 && (
                          <select
                            value={opt.kitchenPost ?? ''}
                            onChange={(e) =>
                              updateOption(vgIdx, oIdx, 'kitchenPost', e.target.value)
                            }
                            style={{
                              ...inputStyle,
                              fontSize: 12,
                              background: 'var(--adm-surface)',
                              color: opt.kitchenPost
                                ? 'var(--adm-text-pri)'
                                : 'var(--adm-text-sec)',
                            }}
                          >
                            <option value="">— Produktuaren postua heredatu —</option>
                            {kitchenPosts.map((p) => (
                              <option key={p} value={p}>
                                👨‍🍳 {p}
                              </option>
                            ))}
                          </select>
                        )}
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
                    <div key={mod.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
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
                      {kitchenPosts.length > 0 && (
                        <select
                          value={mod.kitchenPost ?? ''}
                          onChange={(e) => updateModifier(idx, 'kitchenPost', e.target.value)}
                          style={{
                            ...inputStyle,
                            fontSize: 12,
                            background: 'var(--adm-surface)',
                            color: mod.kitchenPost ? 'var(--adm-text-pri)' : 'var(--adm-text-sec)',
                          }}
                        >
                          <option value="">— Produktuaren postua heredatu —</option>
                          {kitchenPosts.map((p) => (
                            <option key={p} value={p}>
                              👨‍🍳 {p}
                            </option>
                          ))}
                        </select>
                      )}
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
