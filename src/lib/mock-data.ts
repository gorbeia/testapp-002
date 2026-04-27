// ── Types ──────────────────────────────────────────────────────────────────

export type TxosnaStatus = 'OPEN' | 'PAUSED' | 'CLOSED';
export type OrderStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type TicketStatus = 'RECEIVED' | 'IN_PREPARATION' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type CategoryType = 'FOOD' | 'DRINKS';
export type CounterType = 'FOOD' | 'DRINKS';
export type VolunteerRole = 'ADMIN' | 'VOLUNTEER';
export type OrderingChannel = 'COUNTER' | 'PHONE_TO_COUNTER' | 'SELF_SERVICE';

export interface MockCategory {
  id: string;
  name: string;
  type: CategoryType;
  displayOrder: number;
}

export interface MockVariantOption {
  id: string;
  name: string;
  priceDelta: number;
  kitchenPost?: string | null;
}

export interface MockVariantGroup {
  id: string;
  name: string;
  options: MockVariantOption[];
}

export interface MockModifier {
  id: string;
  name: string;
  price: number;
  kitchenPost?: string | null;
}

export interface MockProduct {
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
  variantGroups: MockVariantGroup[];
  modifiers: MockModifier[];
  removableIngredients: string[];
  splitAllowed: boolean;
  splitMaxWays: number; // 1 = splitting not allowed
  preparationInstructions: string | null;
  kitchenPost?: string | null;
}

export interface MockOrderLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  selectedVariant: string | null;
  selectedModifiers: string[];
  splitInstructions: string | null;
}

export interface MockTicket {
  id: string;
  orderId: string;
  orderNumber: number;
  customerName: string | null;
  counterType: CounterType;
  status: TicketStatus;
  kitchenPost?: string | null;
  lines: MockOrderLine[];
  notes: string | null;
  elapsedMin: number;
  isSlowOrder: boolean;
  hasAlert: boolean;
  flagged: boolean;
}

export interface MockOrder {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  customerName: string;
  notes: string | null;
  tickets: MockTicket[];
  total: number;
  verificationCode: string;
  channel: OrderingChannel;
  createdAt: string;
  expiresAt: string | null;
}

export interface MockTxosna {
  id: string;
  slug: string;
  name: string;
  status: TxosnaStatus;
  counterSetup: 'SINGLE' | 'SEPARATE';
  kitchenPosts?: string[];
  waitMinutes: number | null;
  pin: string;
  eventName: string;
  location?: string;
  ordersToday?: number;
  revenueToday?: number;
}

export interface MockAssociation {
  id: string;
  name: string;
  txosnak: MockTxosna[];
}

export interface MockVolunteer {
  id: string;
  name: string;
  email: string;
  role: VolunteerRole;
  active: boolean;
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  selectedVariant: string | null;
  selectedVariantOptionId: string | null;
  selectedModifiers: string[];
  selectedModifierIds: string[];
}

// ── Data ───────────────────────────────────────────────────────────────────

export const MOCK_TXOSNA: MockTxosna = {
  id: 'txosna-1',
  slug: 'aste-nagusia-2026',
  name: 'Aste Nagusia 2026',
  status: 'OPEN',
  counterSetup: 'SEPARATE',
  waitMinutes: 8,
  pin: '1234',
  eventName: 'Aste Nagusia 2026',
  location: '3. karpa, G blokea',
  ordersToday: 47,
  revenueToday: 382,
};

export const MOCK_ASSOCIATION: MockAssociation = {
  id: 'assoc-1',
  name: 'Erreka Gaztedi',
  txosnak: [
    {
      id: 'txosna-1',
      slug: 'aste-nagusia-2026',
      name: 'Aste Nagusia 2026',
      status: 'OPEN',
      counterSetup: 'SEPARATE',
      kitchenPosts: ['plantxa', 'muntaia'],
      waitMinutes: 8,
      pin: '1234',
      eventName: 'Aste Nagusia 2026',
      location: '3. karpa, G blokea',
      ordersToday: 47,
      revenueToday: 382,
    },
    {
      id: 'txosna-2',
      slug: 'pintxo-txokoa',
      name: 'Pintxo Txokoa',
      status: 'OPEN',
      counterSetup: 'SINGLE',
      waitMinutes: 5,
      pin: '5678',
      eventName: 'Aste Nagusia 2026',
      location: '5. karpa, H blokea',
      ordersToday: 31,
      revenueToday: 195,
    },
    {
      id: 'txosna-3',
      slug: 'garagardo-barra',
      name: 'Garagardo Barra',
      status: 'PAUSED',
      counterSetup: 'SINGLE',
      waitMinutes: null,
      pin: '9012',
      eventName: 'Aste Nagusia 2026',
      location: '2. karpa, F blokea',
      ordersToday: 12,
      revenueToday: 60,
    },
  ],
};

export const MOCK_CATEGORIES: MockCategory[] = [
  { id: 'cat-1', name: 'Janaria', type: 'FOOD', displayOrder: 1 },
  { id: 'cat-2', name: 'Edariak', type: 'DRINKS', displayOrder: 2 },
];

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 'prod-1',
    categoryId: 'cat-1',
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
    kitchenPost: 'plantxa',
    variantGroups: [
      {
        id: 'vg-1',
        name: 'Albokoa',
        options: [
          { id: 'vo-1', name: 'Patata frijituak', priceDelta: 0, kitchenPost: 'muntaia' },
          { id: 'vo-2', name: 'Entsalada', priceDelta: 0 },
        ],
      },
    ],
    modifiers: [
      { id: 'mod-1', name: 'Gazta gehigarria', price: 1.0 },
      { id: 'mod-2', name: 'Saltsa gehigarria', price: 0.5 },
      { id: 'mod-3', name: 'Bacon gehigarria', price: 1.5 },
    ],
    removableIngredients: ['Letxuga', 'Tomatea', 'Tipula', 'Saltsa'],
    splitAllowed: true,
    splitMaxWays: 4,
    preparationInstructions:
      '## Burgerra\n\n**Prestaketa denbora:** ~6 min\n\n### Urratsak\n\n1. Hartu xerra izoztuaren bat **ezkerreko hozkailuko beheko apalategitik**\n2. Jarri planxan — bero ertaina-altua\n3. Gehitu gatza eta piperra\n4. Egosi **3 minutu alde bakoitzeko**\n5. Erre ogi-tapa planxaren alboan\n6. Muntatu: beheko ogi-tapa → letxuga → tomatea → xerra → saltsa → goiko ogi-tapa',
  },
  {
    id: 'prod-1b',
    categoryId: 'cat-1',
    name: 'Gazta Burgerra',
    description: 'Etxeko burgerra gaztarekin, patata frijituak edo entsalada aukeran',
    price: 9.5,
    imageUrl: null,
    allergens: ['gluten', 'milk', 'eggs'],
    dietaryFlags: [],
    ageRestricted: false,
    requiresPreparation: true,
    available: true,
    soldOut: false,
    variantGroups: [
      {
        id: 'vg-1b',
        name: 'Albokoa',
        options: [
          { id: 'vo-1b', name: 'Patata frijituak', priceDelta: 0, kitchenPost: 'muntaia' },
          { id: 'vo-2b', name: 'Entsalada', priceDelta: 0 },
        ],
      },
    ],
    modifiers: [{ id: 'mod-1b-1', name: 'Bacon gehigarria', price: 1.5 }],
    removableIngredients: ['Letxuga', 'Tomatea', 'Tipula', 'Saltsa'],
    splitAllowed: true,
    splitMaxWays: 4,
    preparationInstructions: null,
  },
  {
    id: 'prod-1c',
    categoryId: 'cat-1',
    name: 'Burgerra barazkiak',
    description: 'Barazki burgerra, patata frijituak edo entsalada aukeran',
    price: 9.0,
    imageUrl: null,
    allergens: ['gluten', 'soybeans'],
    dietaryFlags: ['VG'],
    ageRestricted: false,
    requiresPreparation: true,
    available: true,
    soldOut: false,
    kitchenPost: 'plantxa',
    variantGroups: [
      {
        id: 'vg-1c',
        name: 'Albokoa',
        options: [
          { id: 'vo-1c', name: 'Patata frijituak', priceDelta: 0, kitchenPost: 'muntaia' },
          { id: 'vo-2c', name: 'Entsalada', priceDelta: 0 },
        ],
      },
    ],
    modifiers: [
      { id: 'mod-1c-1', name: 'Gazta birjanoa', price: 1.0 },
      { id: 'mod-1c-2', name: 'Aguakatea', price: 1.0 },
    ],
    removableIngredients: ['Letxuga', 'Tomatea', 'Tipula'],
    splitAllowed: true,
    splitMaxWays: 4,
    preparationInstructions: null,
  },
  {
    id: 'prod-2',
    categoryId: 'cat-1',
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
    kitchenPost: 'plantxa',
    variantGroups: [],
    modifiers: [],
    removableIngredients: [],
    splitAllowed: false,
    splitMaxWays: 1,
    preparationInstructions: null,
  },
  {
    id: 'prod-3',
    categoryId: 'cat-1',
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
    kitchenPost: 'muntaia',
    variantGroups: [],
    modifiers: [],
    removableIngredients: [],
    splitAllowed: false,
    splitMaxWays: 1,
    preparationInstructions: null,
  },
  {
    id: 'prod-4',
    categoryId: 'cat-1',
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
    kitchenPost: 'muntaia',
    variantGroups: [],
    modifiers: [],
    removableIngredients: [],
    splitAllowed: false,
    splitMaxWays: 1,
    preparationInstructions: null,
  },
  {
    id: 'prod-5',
    categoryId: 'cat-2',
    name: 'Zurito',
    description: 'Garagardo txikia',
    price: 1.5,
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
    id: 'prod-6',
    categoryId: 'cat-2',
    name: 'Caña',
    description: 'Garagardo ertaina',
    price: 2.0,
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
    id: 'prod-7',
    categoryId: 'cat-2',
    name: 'Txakoli',
    description: null,
    price: 2.5,
    imageUrl: null,
    allergens: [],
    dietaryFlags: ['VG'],
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
    id: 'prod-8',
    categoryId: 'cat-2',
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
    id: 'prod-9',
    categoryId: 'cat-2',
    name: 'Kalimotxo',
    description: null,
    price: 2.0,
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
    id: 'prod-10',
    categoryId: 'cat-2',
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

export const MOCK_TICKETS: MockTicket[] = [
  // Order #38 Miren — both posts READY → green card at top of manager
  {
    id: 'ticket-1',
    orderId: 'order-2',
    orderNumber: 38,
    customerName: 'Miren',
    counterType: 'FOOD',
    kitchenPost: 'plantxa',
    status: 'READY',
    elapsedMin: 8,
    isSlowOrder: false,
    hasAlert: false,
    flagged: false,
    notes: null,
    lines: [
      {
        id: 'l1',
        productId: 'prod-1',
        productName: 'Burgerra',
        quantity: 2,
        unitPrice: 8.5,
        selectedVariant: 'Entsalada',
        selectedModifiers: [],
        splitInstructions: null,
      },
    ],
  },
  {
    id: 'ticket-1b',
    orderId: 'order-2',
    orderNumber: 38,
    customerName: 'Miren',
    counterType: 'FOOD',
    kitchenPost: 'muntaia',
    status: 'READY',
    elapsedMin: 8,
    isSlowOrder: false,
    hasAlert: false,
    flagged: false,
    notes: null,
    lines: [
      {
        id: 'l1b',
        productId: 'prod-3',
        productName: 'Pintxo nahasia',
        quantity: 1,
        unitPrice: 6.0,
        selectedVariant: null,
        selectedModifiers: [],
        splitInstructions: null,
      },
    ],
  },
  // Order #42 Josu — griddle done, assembly still cooking → partial progress bar
  {
    id: 'ticket-2',
    orderId: 'order-1',
    orderNumber: 42,
    customerName: 'Josu',
    counterType: 'FOOD',
    kitchenPost: 'plantxa',
    status: 'READY',
    elapsedMin: 6,
    isSlowOrder: false,
    hasAlert: false,
    flagged: false,
    notes: 'Burgerra ondo eginda',
    lines: [
      {
        id: 'l2',
        productId: 'prod-1',
        productName: 'Burgerra',
        quantity: 2,
        unitPrice: 8.5,
        selectedVariant: 'Patata frijituak',
        selectedModifiers: ['Tipulaik gabe'],
        splitInstructions: null,
      },
    ],
  },
  {
    id: 'ticket-2b',
    orderId: 'order-1',
    orderNumber: 42,
    customerName: 'Josu',
    counterType: 'FOOD',
    kitchenPost: 'muntaia',
    status: 'IN_PREPARATION',
    elapsedMin: 6,
    isSlowOrder: false,
    hasAlert: false,
    flagged: false,
    notes: null,
    lines: [
      {
        id: 'l2b',
        productId: 'prod-4',
        productName: 'Tortilla',
        quantity: 1,
        unitPrice: 3.5,
        selectedVariant: null,
        selectedModifiers: [],
        splitInstructions: null,
      },
    ],
  },
  // Order #29 — slow order, both posts still in preparation
  {
    id: 'ticket-3',
    orderId: 'order-4',
    orderNumber: 29,
    customerName: 'Gorka',
    counterType: 'FOOD',
    kitchenPost: 'plantxa',
    status: 'IN_PREPARATION',
    elapsedMin: 14,
    isSlowOrder: true,
    hasAlert: false,
    flagged: false,
    notes: 'Burgerra glutenik gabeko ogian',
    lines: [
      {
        id: 'l3',
        productId: 'prod-1',
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
    id: 'ticket-3b',
    orderId: 'order-4',
    orderNumber: 29,
    customerName: 'Gorka',
    counterType: 'FOOD',
    kitchenPost: 'muntaia',
    status: 'RECEIVED',
    elapsedMin: 14,
    isSlowOrder: true,
    hasAlert: false,
    flagged: false,
    notes: null,
    lines: [
      {
        id: 'l3b',
        productId: 'prod-4',
        productName: 'Tortilla',
        quantity: 2,
        unitPrice: 3.5,
        selectedVariant: null,
        selectedModifiers: [],
        splitInstructions: '2tan banatu',
      },
    ],
  },
  // Order #35 Ander — just arrived, griddle only
  {
    id: 'ticket-4',
    orderId: 'order-3',
    orderNumber: 35,
    customerName: 'Ander',
    counterType: 'FOOD',
    kitchenPost: 'plantxa',
    status: 'RECEIVED',
    elapsedMin: 1,
    isSlowOrder: false,
    hasAlert: false,
    flagged: false,
    notes: null,
    lines: [
      {
        id: 'l4',
        productId: 'prod-2',
        productName: 'Txorizoa ogian',
        quantity: 3,
        unitPrice: 4.0,
        selectedVariant: null,
        selectedModifiers: [],
        splitInstructions: null,
      },
    ],
  },
];

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: 'order-1',
    orderNumber: 42,
    status: 'CONFIRMED',
    customerName: 'Josu',
    notes: 'Burgerra ondo eginda',
    total: 17.0,
    verificationCode: 'JO42',
    channel: 'PHONE_TO_COUNTER',
    createdAt: '2026-04-13T18:34:00Z',
    expiresAt: null,
    tickets: [MOCK_TICKETS[0]],
  },
  {
    id: 'order-2',
    orderNumber: 38,
    status: 'PENDING_PAYMENT',
    customerName: 'Miren',
    notes: null,
    total: 8.0,
    verificationCode: 'MI38',
    channel: 'PHONE_TO_COUNTER',
    createdAt: '2026-04-13T18:40:00Z',
    expiresAt: '2026-04-13T19:00:00Z',
    tickets: [MOCK_TICKETS[1]],
  },
  {
    id: 'order-3',
    orderNumber: 35,
    status: 'CONFIRMED',
    customerName: 'Ander',
    notes: null,
    total: 6.0,
    verificationCode: 'AN35',
    channel: 'PHONE_TO_COUNTER',
    createdAt: '2026-04-13T18:20:00Z',
    expiresAt: null,
    tickets: [MOCK_TICKETS[2]],
  },
  {
    id: 'order-4',
    orderNumber: 29,
    status: 'CONFIRMED',
    customerName: 'Gorka',
    notes: 'Burgerra glutenik gabeko ogian',
    total: 20.5,
    verificationCode: 'XX29',
    channel: 'COUNTER',
    createdAt: '2026-04-13T18:10:00Z',
    expiresAt: null,
    tickets: [MOCK_TICKETS[3]],
  },
];

export const MOCK_VOLUNTEERS: MockVolunteer[] = [
  {
    id: 'v1',
    name: 'Amaia Etxeberria',
    email: 'amaia@elkartea.eus',
    role: 'ADMIN',
    active: true,
  },
  {
    id: 'v2',
    name: 'Gorka Zubia',
    email: 'gorka@elkartea.eus',
    role: 'VOLUNTEER',
    active: true,
  },
  {
    id: 'v3',
    name: 'Itziar Larrea',
    email: 'itziar@elkartea.eus',
    role: 'VOLUNTEER',
    active: true,
  },
  {
    id: 'v4',
    name: 'Beñat Aranburu',
    email: 'benat@elkartea.eus',
    role: 'VOLUNTEER',
    active: false,
  },
];
