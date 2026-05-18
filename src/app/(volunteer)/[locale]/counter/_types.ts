export interface CompletedOrderEntry {
  orderNumber: number;
  verificationCode: string;
  customerName: string | null;
  confirmedAt: number;
}

export interface LocalProduct {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  allergens: string[];
  dietaryFlags: ('V' | 'VG' | 'GF' | 'HL')[];
  ageRestricted: boolean;
  requiresPreparation: boolean;
  available: boolean;
  soldOut: boolean;
  variantGroups: unknown[];
  modifiers: unknown[];
  removableIngredients: string[];
  splitAllowed: boolean;
  splitMaxWays: number;
  preparationInstructions: string | null;
}

export interface LocalOrderLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  selectedVariant: string | null;
  selectedModifiers: string[];
  splitInstructions: string | null;
}

export interface LocalTicket {
  id: string;
  orderId: string;
  orderNumber: number;
  customerName: string | null;
  counterType: string;
  status: string;
  lines: LocalOrderLine[];
  notes: string | null;
  elapsedMin: number;
  isSlowOrder: boolean;
  hasAlert: boolean;
  flagged: boolean;
}

export interface PendingOrder {
  id: string;
  orderNumber: number;
  customerName: string | null;
  lines: LocalOrderLine[];
  total: number;
  placedAt: number;
}
