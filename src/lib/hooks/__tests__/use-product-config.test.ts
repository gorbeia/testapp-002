import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProductConfig, calcUnitPrice } from "@/lib/hooks/use-product-config";
import type { MockProduct } from "@/lib/mock-data";

function makeProduct(overrides?: Partial<MockProduct>): MockProduct {
  return {
    id: "prod-1",
    categoryId: "cat-1",
    name: "Burgerra",
    description: null,
    price: 8.5,
    imageUrl: null,
    allergens: [],
    dietaryFlags: [],
    ageRestricted: false,
    requiresPreparation: true,
    available: true,
    soldOut: false,
    variantGroups: [
      {
        id: "vg-1",
        name: "Tamaina",
        options: [
          { id: "o-1", name: "Txikia", priceDelta: 0 },
          { id: "o-2", name: "Handia", priceDelta: 1.5 },
        ],
      },
    ],
    modifiers: [
      { id: "m-1", name: "Gazta", price: 0.5 },
      { id: "m-2", name: "Bacon", price: 1.0 },
    ],
    removableIngredients: ["Tipula", "Letxuga"],
    splitAllowed: false,
    splitMaxWays: 1,
    preparationInstructions: null,
    ...overrides,
  };
}

describe("useProductConfig — initial state", () => {
  it("defaults: qty=1, variant=null, mods=[], removals=[]", () => {
    const { result } = renderHook(() => useProductConfig());
    expect(result.current.qty).toBe(1);
    expect(result.current.variant).toBeNull();
    expect(result.current.mods).toEqual([]);
    expect(result.current.removals).toEqual([]);
  });

  it("respects initialQty, initialVariant, initialMods, initialRemovals", () => {
    const { result } = renderHook(() =>
      useProductConfig({ initialQty: 3, initialVariant: "Handia", initialMods: ["Gazta"], initialRemovals: ["Tipula"] })
    );
    expect(result.current.qty).toBe(3);
    expect(result.current.variant).toBe("Handia");
    expect(result.current.mods).toEqual(["Gazta"]);
    expect(result.current.removals).toEqual(["Tipula"]);
  });
});

describe("useProductConfig — setQty", () => {
  it("updates qty", () => {
    const { result } = renderHook(() => useProductConfig());
    act(() => result.current.setQty(5));
    expect(result.current.qty).toBe(5);
  });

  it("clamps to minimum 1", () => {
    const { result } = renderHook(() => useProductConfig());
    act(() => result.current.setQty(0));
    expect(result.current.qty).toBe(1);
    act(() => result.current.setQty(-3));
    expect(result.current.qty).toBe(1);
  });

  it("accepts updater function", () => {
    const { result } = renderHook(() => useProductConfig({ initialQty: 2 }));
    act(() => result.current.setQty(q => q + 1));
    expect(result.current.qty).toBe(3);
  });
});

describe("useProductConfig — setVariant", () => {
  it("updates variant", () => {
    const { result } = renderHook(() => useProductConfig());
    act(() => result.current.setVariant("Handia"));
    expect(result.current.variant).toBe("Handia");
  });
});

describe("useProductConfig — toggleMod", () => {
  it("adds a modifier when not present", () => {
    const { result } = renderHook(() => useProductConfig());
    act(() => result.current.toggleMod("Gazta"));
    expect(result.current.mods).toContain("Gazta");
  });

  it("removes a modifier when already present", () => {
    const { result } = renderHook(() => useProductConfig({ initialMods: ["Gazta"] }));
    act(() => result.current.toggleMod("Gazta"));
    expect(result.current.mods).not.toContain("Gazta");
  });
});

describe("useProductConfig — toggleRemoval", () => {
  it("adds a removal when not present", () => {
    const { result } = renderHook(() => useProductConfig());
    act(() => result.current.toggleRemoval("Tipula"));
    expect(result.current.removals).toContain("Tipula");
  });

  it("removes a removal when already present", () => {
    const { result } = renderHook(() => useProductConfig({ initialRemovals: ["Tipula"] }));
    act(() => result.current.toggleRemoval("Tipula"));
    expect(result.current.removals).not.toContain("Tipula");
  });
});

describe("useProductConfig — reset", () => {
  it("returns to initial defaults", () => {
    const { result } = renderHook(() => useProductConfig());
    act(() => { result.current.setQty(5); result.current.setVariant("X"); result.current.toggleMod("Gazta"); });
    act(() => result.current.reset());
    expect(result.current.qty).toBe(1);
    expect(result.current.variant).toBeNull();
    expect(result.current.mods).toEqual([]);
  });
});

describe("calcUnitPrice", () => {
  const product = makeProduct();

  it("returns base price when no variant or modifiers", () => {
    expect(calcUnitPrice(product, null, [])).toBe(8.5);
  });

  it("adds variant surcharge", () => {
    expect(calcUnitPrice(product, "Handia", [])).toBe(10.0); // 8.5 + 1.5
  });

  it("adds modifier price", () => {
    expect(calcUnitPrice(product, null, ["Gazta"])).toBeCloseTo(9.0); // 8.5 + 0.5
  });

  it("adds both variant and modifier surcharges", () => {
    expect(calcUnitPrice(product, "Handia", ["Gazta", "Bacon"])).toBeCloseTo(11.5); // 8.5 + 1.5 + 0.5 + 1.0
  });

  it("ignores unknown modifier names", () => {
    expect(calcUnitPrice(product, null, ["Ezezaguna"])).toBe(8.5);
  });
});
