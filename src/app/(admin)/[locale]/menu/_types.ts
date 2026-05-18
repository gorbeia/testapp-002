export interface VariantOption {
  id: string;
  name: string;
  priceDelta: number;
  kitchenPost?: string | null;
}

export interface VariantGroup {
  id: string;
  name: string;
  options: VariantOption[];
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
  kitchenPost?: string | null;
}

export interface RemovableIngredient {
  id: string;
  name: string;
}

export interface Product {
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
  splitMaxWays: number;
  requiresPreparation: boolean;
  displayOrder: number;
  ingredients: string | null;
  preparationInstructions: string | null;
  variantGroups: VariantGroup[];
  modifiers: Modifier[];
  kitchenPost?: string | null;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  displayOrder: number;
  products: Product[];
}

export interface VatType {
  id: string;
  label: string;
  percentage: string;
}

export interface ProductForm {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  ageRestricted: boolean;
  requiresPreparation: boolean;
  splittable: boolean;
  splitMaxWays: number;
  allergens: string[];
  dietaryFlags: string[];
  variantGroups: VariantGroup[];
  modifiers: Modifier[];
  removableIngredients: RemovableIngredient[];
  preparationInstructions: string;
  vatTypeId: string;
  kitchenPost: string | null;
}

export interface CategoryModalState {
  open: boolean;
  editId: string | null;
  name: string;
  type: 'FOOD' | 'DRINK';
}

/** 14 EU-regulated allergens — canonical English key, Basque label, emoji */
export const ALLERGENS: { key: string; label: string; emoji: string }[] = [
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
export const ALLERGEN_EMOJI: Record<string, string> = Object.fromEntries(
  ALLERGENS.map(({ key, emoji }) => [key, emoji])
);

export function emptyForm(categoryId: string, defaultVatTypeId?: string): ProductForm {
  return {
    name: '',
    description: '',
    price: '',
    categoryId,
    ageRestricted: false,
    requiresPreparation: false,
    splittable: false,
    splitMaxWays: 1,
    allergens: [],
    dietaryFlags: [],
    variantGroups: [],
    modifiers: [],
    removableIngredients: [],
    preparationInstructions: '',
    vatTypeId: defaultVatTypeId ?? '',
    kitchenPost: null,
  };
}

export function fromProduct(p: Product): ProductForm {
  return {
    name: p.name,
    description: p.description ?? '',
    price: String(p.defaultPrice),
    categoryId: p.categoryId,
    ageRestricted: p.ageRestricted,
    requiresPreparation: p.requiresPreparation,
    splittable: p.splittable,
    splitMaxWays: p.splitMaxWays ?? 1,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vatTypeId: (p as any).vatTypeId ?? '',
    kitchenPost: p.kitchenPost ?? null,
  };
}

export function formToPayload(data: ProductForm) {
  const removableNames = data.removableIngredients.map((r) => r.name).filter(Boolean);
  return {
    name: data.name,
    categoryId: data.categoryId,
    defaultPrice: data.price,
    description: data.description || null,
    ageRestricted: data.ageRestricted,
    requiresPreparation: data.requiresPreparation,
    splittable: data.splittable,
    splitMaxWays: data.splitMaxWays,
    allergens: data.allergens,
    dietaryFlags: data.dietaryFlags,
    ingredients: removableNames.join(', ') || null,
    preparationInstructions: data.preparationInstructions || null,
    variantGroups: data.variantGroups,
    modifiers: data.modifiers,
    vatTypeId: data.vatTypeId || null,
    kitchenPost: data.kitchenPost || null,
  };
}
