// Demo association fixture — deterministic data for stakeholder demos and
// validation. All IDs are prefixed with "demo-" so they never collide with
// real or mock association data. PIN is always "0000".
//
// Covers every operational flow:
//   • Customer: menu browse, pending orders, live status
//   • Counter: PENDING_PAYMENT queue, CONFIRMED queue, new-order creation
//   • KDS: RECEIVED, IN_PREPARATION, READY, COMPLETED, CANCELLED tickets
//   • Drinks: independent drinks counter with its own queue
//   • Admin: two txosnak (OPEN + PAUSED), soldOut product, inactive volunteer

import type {
  MockAssociation,
  MockCategory,
  MockOrder,
  MockProduct,
  MockTicket,
  MockTxosna,
  MockVolunteer,
} from '@/lib/mock-data';

// ── Association ───────────────────────────────────────────────────────────────

export const DEMO_ASSOCIATION: MockAssociation = {
  id: 'demo-assoc-1',
  name: 'Demo Elkartea',
  txosnak: [],
};

// ── Txosnak ───────────────────────────────────────────────────────────────────

export const DEMO_TXOSNAK: MockTxosna[] = [
  {
    id: 'demo-txosna-1',
    slug: 'demo-janaria',
    name: 'Demo Janaria',
    status: 'OPEN',
    counterSetup: 'SEPARATE',
    waitMinutes: 12,
    pin: '0000',
    eventName: 'Demo Gertaera',
    location: '1. karpa, A blokea',
    ordersToday: 6,
    revenueToday: 63.5,
  },
  {
    id: 'demo-txosna-2',
    slug: 'demo-edariak',
    name: 'Demo Edariak',
    status: 'PAUSED',
    counterSetup: 'SINGLE',
    waitMinutes: null,
    pin: '0000',
    eventName: 'Demo Gertaera',
    location: '1. karpa, B blokea',
    ordersToday: 0,
    revenueToday: 0,
  },
];

// ── Categories ────────────────────────────────────────────────────────────────

export const DEMO_CATEGORIES: MockCategory[] = [
  { id: 'demo-cat-1', name: 'Janaria', type: 'FOOD', displayOrder: 1 },
  { id: 'demo-cat-2', name: 'Edariak', type: 'DRINKS', displayOrder: 2 },
];

// ── Products ──────────────────────────────────────────────────────────────────

export const DEMO_PRODUCTS: MockProduct[] = [
  // ── Food ──
  {
    id: 'demo-prod-1',
    categoryId: 'demo-cat-1',
    name: 'Burgerra',
    description: 'Etxeko burgerra, patata frijituak edo entsalada aukeran',
    price: 8.5,
    imageUrl: null,
    allergens: ['gluten', 'milk', 'eggs'],
    dietaryFlags: [],
    ageRestricted: false,
    requiresPreparation: true,
    available: true,
    soldOut: false,
    variantGroups: [
      {
        id: 'demo-vg-1',
        name: 'Albokoa',
        options: [
          { id: 'demo-vo-1', name: 'Patata frijituak', priceDelta: 0 },
          { id: 'demo-vo-2', name: 'Entsalada', priceDelta: 0 },
        ],
      },
    ],
    modifiers: [
      { id: 'demo-mod-1', name: 'Gazta gehigarria', price: 1.0 },
      { id: 'demo-mod-2', name: 'Bacon gehigarria', price: 1.5 },
    ],
    removableIngredients: ['Letxuga', 'Tomatea', 'Tipula', 'Saltsa'],
    splitAllowed: true,
    splitMaxWays: 4,
    preparationInstructions:
      '## Burgerra\n\n1. Hartu xerra izoztuaren bat\n2. Jarri planxan — bero ertaina-altua\n3. Egosi **3 minutu alde bakoitzeko**\n4. Muntatu: ogitartekoa → letxuga → tomatea → xerra → saltsa',
  },
  {
    id: 'demo-prod-2',
    categoryId: 'demo-cat-1',
    name: 'Txorizoa ogian',
    description: null,
    price: 4.0,
    imageUrl: null,
    allergens: ['gluten'],
    dietaryFlags: [],
    ageRestricted: false,
    requiresPreparation: true,
    available: true,
    soldOut: false,
    variantGroups: [],
    modifiers: [],
    removableIngredients: [],
    splitAllowed: false,
    splitMaxWays: 1,
    preparationInstructions: null,
  },
  {
    id: 'demo-prod-3',
    categoryId: 'demo-cat-1',
    name: 'Tortilla',
    description: null,
    price: 3.5,
    imageUrl: null,
    allergens: ['eggs'],
    dietaryFlags: ['V'],
    ageRestricted: false,
    requiresPreparation: true,
    available: true,
    soldOut: false,
    variantGroups: [],
    modifiers: [],
    removableIngredients: [],
    splitAllowed: false,
    splitMaxWays: 1,
    preparationInstructions: null,
  },
  {
    // Marked soldOut via DEMO_TXOSNA_OVERRIDES for demo-txosna-1
    id: 'demo-prod-4',
    categoryId: 'demo-cat-1',
    name: 'Pintxo nahasia',
    description: '6 pintxo aukeratutako',
    price: 6.0,
    imageUrl: null,
    allergens: ['gluten'],
    dietaryFlags: [],
    ageRestricted: false,
    requiresPreparation: true,
    available: true,
    soldOut: false,
    variantGroups: [],
    modifiers: [],
    removableIngredients: [],
    splitAllowed: false,
    splitMaxWays: 1,
    preparationInstructions: null,
  },
  // ── Drinks ──
  {
    id: 'demo-prod-5',
    categoryId: 'demo-cat-2',
    name: 'Garagardoa',
    description: 'Caña ertaina',
    price: 2.5,
    imageUrl: null,
    allergens: ['gluten'],
    dietaryFlags: [],
    ageRestricted: true,
    requiresPreparation: false,
    available: true,
    soldOut: false,
    variantGroups: [],
    modifiers: [],
    removableIngredients: [],
    splitAllowed: false,
    splitMaxWays: 1,
    preparationInstructions: null,
  },
  {
    id: 'demo-prod-6',
    categoryId: 'demo-cat-2',
    name: 'Ardoa',
    description: null,
    price: 3.0,
    imageUrl: null,
    allergens: [],
    dietaryFlags: [],
    ageRestricted: true,
    requiresPreparation: false,
    available: true,
    soldOut: false,
    variantGroups: [],
    modifiers: [],
    removableIngredients: [],
    splitAllowed: false,
    splitMaxWays: 1,
    preparationInstructions: null,
  },
  {
    id: 'demo-prod-7',
    categoryId: 'demo-cat-2',
    name: 'Ura',
    description: null,
    price: 1.0,
    imageUrl: null,
    allergens: [],
    dietaryFlags: ['VG', 'GF'],
    ageRestricted: false,
    requiresPreparation: false,
    available: true,
    soldOut: false,
    variantGroups: [],
    modifiers: [],
    removableIngredients: [],
    splitAllowed: false,
    splitMaxWays: 1,
    preparationInstructions: null,
  },
  {
    id: 'demo-prod-8',
    categoryId: 'demo-cat-2',
    name: 'Freskagarria',
    description: 'Koka-Kola, Fanta, Sprite',
    price: 1.5,
    imageUrl: null,
    allergens: [],
    dietaryFlags: [],
    ageRestricted: false,
    requiresPreparation: false,
    available: true,
    soldOut: false,
    variantGroups: [],
    modifiers: [],
    removableIngredients: [],
    splitAllowed: false,
    splitMaxWays: 1,
    preparationInstructions: null,
  },
];

// ── Txosna-level product overrides ────────────────────────────────────────────

export interface DemoTxosnaOverride {
  txosnaId: string;
  productId: string;
  priceOverride: number | null;
  available: boolean;
  soldOut: boolean;
  preparationInstructions: string | null;
}

export const DEMO_TXOSNA_OVERRIDES: DemoTxosnaOverride[] = [
  {
    txosnaId: 'demo-txosna-1',
    productId: 'demo-prod-4',
    priceOverride: null,
    available: true,
    soldOut: true, // Pintxo nahasia agortuta
    preparationInstructions: null,
  },
];

// ── Volunteers ────────────────────────────────────────────────────────────────

export const DEMO_VOLUNTEERS: MockVolunteer[] = [
  {
    id: 'demo-v1',
    name: 'Amaia Demo',
    email: 'amaia@demo.eus',
    role: 'ADMIN',
    active: true,
  },
  {
    id: 'demo-v2',
    name: 'Gorka Demo',
    email: 'gorka@demo.eus',
    role: 'VOLUNTEER',
    active: true,
  },
  {
    id: 'demo-v3',
    name: 'Itziar Demo',
    email: 'itziar@demo.eus',
    role: 'VOLUNTEER',
    active: false,
  },
];

// ── Orders ────────────────────────────────────────────────────────────────────
// All for demo-txosna-1. Tickets are defined separately below.

export const DEMO_ORDERS: MockOrder[] = [
  {
    // Counter volunteer awaiting payment from walk-in customer
    id: 'demo-order-1',
    orderNumber: 1,
    status: 'PENDING_PAYMENT',
    customerName: 'Miren',
    notes: null,
    total: 17.0,
    verificationCode: 'AB-0001',
    channel: 'PHONE_TO_COUNTER',
    createdAt: '2026-04-19T10:00:00Z',
    expiresAt: '2026-04-19T10:15:00Z',
    tickets: [],
  },
  {
    // Second phone order still unpaid, older — appears urgent in counter list
    id: 'demo-order-2',
    orderNumber: 2,
    status: 'PENDING_PAYMENT',
    customerName: 'Josu',
    notes: null,
    total: 7.5,
    verificationCode: 'CD-0002',
    channel: 'PHONE_TO_COUNTER',
    createdAt: '2026-04-19T10:05:00Z',
    expiresAt: '2026-04-19T10:20:00Z',
    tickets: [],
  },
  {
    // Counter order being prepared in kitchen
    id: 'demo-order-3',
    orderNumber: 3,
    status: 'CONFIRMED',
    customerName: 'Ander',
    notes: 'Burgerra ondo eginda mesedez',
    total: 8.5,
    verificationCode: 'EF-0003',
    channel: 'COUNTER',
    createdAt: '2026-04-19T10:10:00Z',
    expiresAt: null,
    tickets: [],
  },
  {
    // Mixed food+drinks order — two separate tickets
    id: 'demo-order-4',
    orderNumber: 4,
    status: 'CONFIRMED',
    customerName: 'Leire',
    notes: null,
    total: 13.0,
    verificationCode: 'GH-0004',
    channel: 'COUNTER',
    createdAt: '2026-04-19T10:15:00Z',
    expiresAt: null,
    tickets: [],
  },
  {
    // Self-service order, both tickets ready for pickup
    id: 'demo-order-5',
    orderNumber: 5,
    status: 'CONFIRMED',
    customerName: 'Txomin',
    notes: null,
    total: 12.5,
    verificationCode: 'JK-0005',
    channel: 'SELF_SERVICE',
    createdAt: '2026-04-19T10:20:00Z',
    expiresAt: null,
    tickets: [],
  },
  {
    // Cancelled order — shows reason flow in reports
    id: 'demo-order-6',
    orderNumber: 6,
    status: 'CANCELLED',
    customerName: 'Beñat',
    notes: null,
    total: 12.0,
    verificationCode: 'LM-0006',
    channel: 'COUNTER',
    createdAt: '2026-04-19T10:25:00Z',
    expiresAt: null,
    tickets: [],
  },
];

// ── Tickets ───────────────────────────────────────────────────────────────────

export const DEMO_TICKETS: MockTicket[] = [
  {
    // Order 1 — food ticket awaiting payment confirmation
    id: 'demo-ticket-1',
    orderId: 'demo-order-1',
    orderNumber: 1,
    customerName: 'Miren',
    counterType: 'FOOD',
    status: 'RECEIVED',
    elapsedMin: 8,
    isSlowOrder: false,
    hasAlert: false,
    flagged: false,
    notes: null,
    lines: [
      {
        id: 'demo-l1',
        productId: 'demo-prod-1',
        productName: 'Burgerra',
        quantity: 2,
        unitPrice: 8.5,
        selectedVariant: 'Patata frijituak',
        selectedModifiers: [],
        splitInstructions: null,
      },
    ],
  },
  {
    // Order 2 — food ticket, also awaiting payment
    id: 'demo-ticket-2',
    orderId: 'demo-order-2',
    orderNumber: 2,
    customerName: 'Josu',
    counterType: 'FOOD',
    status: 'RECEIVED',
    elapsedMin: 3,
    isSlowOrder: false,
    hasAlert: false,
    flagged: false,
    notes: null,
    lines: [
      {
        id: 'demo-l2',
        productId: 'demo-prod-3',
        productName: 'Tortilla',
        quantity: 1,
        unitPrice: 3.5,
        selectedVariant: null,
        selectedModifiers: [],
        splitInstructions: null,
      },
      {
        id: 'demo-l3',
        productId: 'demo-prod-2',
        productName: 'Txorizoa ogian',
        quantity: 1,
        unitPrice: 4.0,
        selectedVariant: null,
        selectedModifiers: [],
        splitInstructions: null,
      },
    ],
  },
  {
    // Order 3 — being prepared, note visible in KDS
    id: 'demo-ticket-3',
    orderId: 'demo-order-3',
    orderNumber: 3,
    customerName: 'Ander',
    counterType: 'FOOD',
    status: 'IN_PREPARATION',
    elapsedMin: 5,
    isSlowOrder: false,
    hasAlert: false,
    flagged: false,
    notes: 'Burgerra ondo eginda mesedez',
    lines: [
      {
        id: 'demo-l4',
        productId: 'demo-prod-1',
        productName: 'Burgerra',
        quantity: 1,
        unitPrice: 8.5,
        selectedVariant: 'Entsalada',
        selectedModifiers: [],
        splitInstructions: null,
      },
    ],
  },
  {
    // Order 4 — food part in preparation (slow order alert)
    id: 'demo-ticket-4',
    orderId: 'demo-order-4',
    orderNumber: 4,
    customerName: 'Leire',
    counterType: 'FOOD',
    status: 'IN_PREPARATION',
    elapsedMin: 13,
    isSlowOrder: true,
    hasAlert: false,
    flagged: false,
    notes: null,
    lines: [
      {
        id: 'demo-l5',
        productId: 'demo-prod-2',
        productName: 'Txorizoa ogian',
        quantity: 2,
        unitPrice: 4.0,
        selectedVariant: null,
        selectedModifiers: [],
        splitInstructions: null,
      },
    ],
  },
  {
    // Order 4 — drinks part still received (counter hasn't served yet)
    id: 'demo-ticket-5',
    orderId: 'demo-order-4',
    orderNumber: 4,
    customerName: 'Leire',
    counterType: 'DRINKS',
    status: 'RECEIVED',
    elapsedMin: 13,
    isSlowOrder: false,
    hasAlert: false,
    flagged: false,
    notes: null,
    lines: [
      {
        id: 'demo-l6',
        productId: 'demo-prod-5',
        productName: 'Garagardoa',
        quantity: 2,
        unitPrice: 2.5,
        selectedVariant: null,
        selectedModifiers: [],
        splitInstructions: null,
      },
    ],
  },
  {
    // Order 5 — food ticket ready for pickup
    id: 'demo-ticket-6',
    orderId: 'demo-order-5',
    orderNumber: 5,
    customerName: 'Txomin',
    counterType: 'FOOD',
    status: 'READY',
    elapsedMin: 7,
    isSlowOrder: false,
    hasAlert: false,
    flagged: false,
    notes: null,
    lines: [
      {
        id: 'demo-l7',
        productId: 'demo-prod-1',
        productName: 'Burgerra',
        quantity: 1,
        unitPrice: 9.5, // base 8.5 + Gazta gehigarria 1.0
        selectedVariant: 'Patata frijituak',
        selectedModifiers: ['Gazta gehigarria'],
        splitInstructions: null,
      },
    ],
  },
  {
    // Order 5 — drinks ticket also ready
    id: 'demo-ticket-7',
    orderId: 'demo-order-5',
    orderNumber: 5,
    customerName: 'Txomin',
    counterType: 'DRINKS',
    status: 'READY',
    elapsedMin: 7,
    isSlowOrder: false,
    hasAlert: false,
    flagged: false,
    notes: null,
    lines: [
      {
        id: 'demo-l8',
        productId: 'demo-prod-7',
        productName: 'Ura',
        quantity: 3,
        unitPrice: 1.0,
        selectedVariant: null,
        selectedModifiers: [],
        splitInstructions: null,
      },
    ],
  },
  {
    // Order 6 — cancelled (soldOut reason)
    id: 'demo-ticket-8',
    orderId: 'demo-order-6',
    orderNumber: 6,
    customerName: 'Beñat',
    counterType: 'FOOD',
    status: 'CANCELLED',
    elapsedMin: 0,
    isSlowOrder: false,
    hasAlert: false,
    flagged: false,
    notes: null,
    lines: [
      {
        id: 'demo-l9',
        productId: 'demo-prod-4',
        productName: 'Pintxo nahasia',
        quantity: 2,
        unitPrice: 6.0,
        selectedVariant: null,
        selectedModifiers: [],
        splitInstructions: null,
      },
    ],
  },
];

// ── Convenience constants exposed to routes ───────────────────────────────────

export const DEMO_PIN = '0000';
export const DEMO_PRIMARY_SLUG = 'demo-janaria';
export const DEMO_SECONDARY_SLUG = 'demo-edariak';
