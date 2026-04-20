// ── Domain enums ─────────────────────────────────────────────────────────────

export type TxosnaStatus = 'OPEN' | 'PAUSED' | 'CLOSED';
export type OrderStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';
export type CancellationReason =
  | 'CUSTOMER'
  | 'SOLD_OUT'
  | 'TIMEOUT'
  | 'END_OF_SERVICE'
  | 'VOLUNTEER';
export type TicketStatus = 'RECEIVED' | 'IN_PREPARATION' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type CategoryType = 'FOOD' | 'DRINKS';
export type CounterType = 'FOOD' | 'DRINKS';
export type CounterSetup = 'SINGLE' | 'SEPARATE';
export type OrderingChannel = 'COUNTER' | 'PHONE_TO_COUNTER' | 'SELF_SERVICE';
export type PaymentMethod = 'CASH' | 'ONLINE';
export type VolunteerRole = 'ADMIN' | 'VOLUNTEER';

// ── Stored entity types ───────────────────────────────────────────────────────
// These mirror the Prisma schema but use plain JS types (number for Decimal,
// Date for DateTime). The in-memory and Prisma repository implementations both
// produce these shapes, so handlers never need to know which backend is active.

export interface StoredAssociation {
  id: string;
  name: string;
  createdAt: Date;
}

export interface StoredTxosna {
  id: string;
  slug: string;
  name: string;
  status: TxosnaStatus;
  counterSetup: CounterSetup;
  waitMinutes: number | null;
  /** Plain PIN in dev/test seed; bcrypt hash in production. */
  pinHash: string;
  enabledChannels: OrderingChannel[];
  enabledPaymentMethods: PaymentMethod[];
  pendingPaymentTimeout: number; // minutes until PENDING_PAYMENT expires
  printingEnabled: boolean;
  associationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredCategory {
  id: string;
  name: string;
  type: CategoryType;
  displayOrder: number;
  associationId: string;
}

export interface StoredVariantOption {
  id: string;
  name: string;
  priceDelta: number;
  allergens: string[];
  displayOrder: number;
}

export interface StoredVariantGroup {
  id: string;
  name: string;
  displayOrder: number;
  options: StoredVariantOption[];
}

export interface StoredModifier {
  id: string;
  name: string;
  price: number;
  allergens: string[];
  displayOrder: number;
}

export interface StoredProduct {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  defaultPrice: number;
  imageUrl: string | null;
  allergens: string[];
  dietaryFlags: string[];
  ageRestricted: boolean;
  requiresPreparation: boolean;
  /** Whether this product appears in the catalog at all (global flag). */
  available: boolean;
  splittable: boolean;
  splitMaxWays: number;
  removableIngredients: string[];
  preparationInstructions: string | null;
  displayOrder: number;
  variantGroups: StoredVariantGroup[];
  modifiers: StoredModifier[];
}

/** Per-txosna product configuration. Absent = use product defaults. */
export interface StoredTxosnaProduct {
  txosnaId: string;
  productId: string;
  priceOverride: number | null;
  available: boolean;
  soldOut: boolean;
  preparationInstructions: string | null;
}

/**
 * Product as seen from a specific txosna — product defaults merged with any
 * txosna-level overrides. This is what catalog API routes return.
 */
export interface StoredProductView extends StoredProduct {
  /** Base price or txosna price override. */
  effectivePrice: number;
  /** Product-level available AND txosna-level available. */
  available: boolean;
  soldOut: boolean;
}

export interface StoredOrderLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  selectedVariant: string | null; // variant option name (denormalised)
  selectedModifiers: string[]; // modifier names (denormalised)
  splitInstructions: string | null;
}

export interface StoredTicket {
  id: string;
  orderId: string;
  txosnaId: string;
  counterType: CounterType;
  status: TicketStatus;
  requiresPreparation: boolean;
  flagged: boolean;
  orderChangedAlert: boolean;
  notes: string | null;
  lines: StoredOrderLine[];
  createdAt: Date;
  readyAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
}

export interface StoredOrder {
  id: string;
  orderNumber: number;
  txosnaId: string;
  status: OrderStatus;
  cancellationReason: CancellationReason | null;
  channel: OrderingChannel;
  paymentMethod: PaymentMethod | null;
  customerName: string | null;
  notes: string | null;
  total: number;
  verificationCode: string;
  registeredById: string | null;
  paymentSessionId: string | null;
  confirmedAt: Date | null;
  expiresAt: Date | null;
  /** Ticket structure for PENDING_PAYMENT orders; cleared on confirm. */
  pendingLines: CreateTicketInput[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredVolunteer {
  id: string;
  associationId: string;
  name: string;
  email: string;
  /** bcrypt hash in production; plain text sentinel in dev/test seed. */
  passwordHash: string;
  role: VolunteerRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Repository input types ────────────────────────────────────────────────────

export interface CreateOrderLineInput {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  selectedVariant: string | null;
  selectedModifiers: string[];
  splitInstructions: string | null;
}

export interface CreateTicketInput {
  counterType: CounterType;
  requiresPreparation: boolean;
  notes: string | null;
  lines: CreateOrderLineInput[];
}

export interface CreateOrderInput {
  txosnaId: string;
  channel: OrderingChannel;
  customerName: string | null;
  notes: string | null;
  paymentMethod: PaymentMethod;
  registeredById: string | null;
  status: OrderStatus;
  total: number;
  expiresAt: Date | null;
  tickets: CreateTicketInput[];
  /** For PENDING_PAYMENT orders: store pending ticket structure for later confirmation. */
  pendingLines?: CreateTicketInput[] | null;
}

export interface CreateVolunteerInput {
  associationId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: VolunteerRole;
}

export interface OrderFilter {
  status?: OrderStatus;
  channel?: OrderingChannel;
  since?: Date;
}

export interface TicketFilter {
  status?: TicketStatus;
  counterType?: CounterType;
}

// ── Repository interfaces ─────────────────────────────────────────────────────

export interface TxosnaRepository {
  findBySlug(slug: string): Promise<StoredTxosna | null>;
  findById(id: string): Promise<StoredTxosna | null>;
  list(associationId: string): Promise<StoredTxosna[]>;
  update(id: string, patch: Partial<Omit<StoredTxosna, 'id' | 'createdAt'>>): Promise<StoredTxosna>;
}

export interface OrderRepository {
  create(data: CreateOrderInput): Promise<StoredOrder>;
  findById(id: string): Promise<StoredOrder | null>;
  findByNumber(txosnaId: string, orderNumber: number): Promise<StoredOrder | null>;
  listByTxosna(txosnaId: string, filter?: OrderFilter): Promise<StoredOrder[]>;
  update(id: string, patch: Partial<Omit<StoredOrder, 'id' | 'createdAt'>>): Promise<StoredOrder>;
  nextOrderNumber(txosnaId: string): Promise<number>;
}

export interface TicketRepository {
  create(orderId: string, txosnaId: string, data: CreateTicketInput): Promise<StoredTicket>;
  findById(id: string): Promise<StoredTicket | null>;
  listByTxosna(txosnaId: string, filter?: TicketFilter): Promise<StoredTicket[]>;
  listByOrder(orderId: string): Promise<StoredTicket[]>;
  update(
    id: string,
    patch: Partial<Omit<StoredTicket, 'id' | 'orderId' | 'txosnaId' | 'createdAt' | 'lines'>>
  ): Promise<StoredTicket>;
}

export interface VolunteerRepository {
  findByEmail(email: string): Promise<StoredVolunteer | null>;
  findById(id: string): Promise<StoredVolunteer | null>;
  listByAssociation(associationId: string): Promise<StoredVolunteer[]>;
  create(data: CreateVolunteerInput): Promise<StoredVolunteer>;
  update(
    id: string,
    patch: Partial<Omit<StoredVolunteer, 'id' | 'associationId' | 'createdAt'>>
  ): Promise<StoredVolunteer>;
}

export interface CatalogRepository {
  listCategories(associationId: string): Promise<StoredCategory[]>;
  listProducts(categoryId: string): Promise<StoredProduct[]>;
  getProduct(productId: string): Promise<StoredProduct | null>;
  /** Product merged with txosna-level overrides. */
  getProductView(productId: string, txosnaId: string): Promise<StoredProductView | null>;
  /** Full catalog grouped by category, with txosna overrides applied. */
  listProductViews(
    txosnaId: string
  ): Promise<{ category: StoredCategory; products: StoredProductView[] }[]>;
}
