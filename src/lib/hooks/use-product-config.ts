'use client';
import { useState } from 'react';
import type { MockProduct } from '@/lib/mock-data';

interface UseProductConfigOptions {
  initialQty?: number;
  initialVariant?: string | null;
  initialMods?: string[];
  initialRemovals?: string[];
}

export function calcUnitPrice(
  product: MockProduct,
  variantName: string | null,
  modifierNames: string[]
): number {
  const variantDelta =
    product.variantGroups.flatMap((vg) => vg.options).find((o) => o.name === variantName)
      ?.priceDelta ?? 0;
  const modifiersTotal = modifierNames.reduce(
    (sum, name) => sum + (product.modifiers.find((m) => m.name === name)?.price ?? 0),
    0
  );
  return product.price + variantDelta + modifiersTotal;
}

export function useProductConfig(options: UseProductConfigOptions = {}) {
  const [qty, setQtyState] = useState(options.initialQty ?? 1);
  const [variant, setVariant] = useState<string | null>(options.initialVariant ?? null);
  const [mods, setMods] = useState<string[]>(options.initialMods ?? []);
  const [removals, setRemovals] = useState<string[]>(options.initialRemovals ?? []);

  const setQty = (q: number | ((prev: number) => number)) =>
    setQtyState((prev) => Math.max(1, typeof q === 'function' ? q(prev) : q));

  const toggleMod = (name: string) =>
    setMods((prev) => (prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]));

  const toggleRemoval = (name: string) =>
    setRemovals((prev) => (prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name]));

  const reset = () => {
    setQtyState(1);
    setVariant(null);
    setMods([]);
    setRemovals([]);
  };

  return { qty, setQty, variant, setVariant, mods, toggleMod, removals, toggleRemoval, reset };
}
