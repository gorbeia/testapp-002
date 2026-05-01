// In-memory store — the sole storage implementation used in dev and tests.
// The same module instance is shared across all API route handlers in a single
// Next.js server process. Tests call reset() in beforeEach to start clean.

import {
  MOCK_ASSOCIATION,
  MOCK_CATEGORIES,
  MOCK_ORDERS,
  MOCK_PRODUCTS,
  MOCK_TICKETS,
  MOCK_VOLUNTEERS,
} from '@/lib/mock-data';
import {
  DEMO_ASSOCIATION,
  DEMO_CATEGORIES,
  DEMO_ORDERS,
  DEMO_PIN,
  DEMO_PRODUCTS,
  DEMO_TICKETS,
  DEMO_TXOSNAK,
  DEMO_TXOSNA_OVERRIDES,
  DEMO_VOLUNTEERS,
} from '@/lib/fixtures/demo';
import type {
  AssociationRepository,
  CatalogRepository,
  CreateOrderInput,
  CreatePaymentProviderInput,
  CreateTxosnaInput,
  CreateVolunteerInput,
  OrderRepository,
  PaymentProviderRepository,
  StoredAssociation,
  StoredCategory,
  StoredOrder,
  StoredPaymentProvider,
  StoredProduct,
  StoredProductView,
  StoredTicket,
  StoredTicketBaiConfig,
  StoredTicketBaiInvoice,
  StoredTxosna,
  StoredTxosnaProduct,
  StoredVolunteer,
  TicketBaiConfigRepository,
  TicketBaiInvoiceRepository,
  TicketRepository,
  TxosnaRepository,
  VolunteerRepository,
} from './types';

// ── Internal maps ─────────────────────────────────────────────────────────────

const associations = new Map<string, StoredAssociation>();
const txosnak = new Map<string, StoredTxosna>();
const categories = new Map<string, StoredCategory>();
const products = new Map<string, StoredProduct>();
/** Key: `${txosnaId}:${productId}` */
const txosnaProducts = new Map<string, StoredTxosnaProduct>();
const orders = new Map<string, StoredOrder>();
const tickets = new Map<string, StoredTicket>();
const volunteers = new Map<string, StoredVolunteer>();
/** Highest order number issued per txosna. */
const orderCounters = new Map<string, number>();
const paymentProviders = new Map<string, StoredPaymentProvider>();
const ticketBaiConfigs = new Map<string, StoredTicketBaiConfig>();
const ticketBaiInvoices = new Map<string, StoredTicketBaiInvoice>();
/** Highest invoice number issued per `${associationId}:${series}`. */
const ticketBaiInvoiceCounters = new Map<string, number>();

// ── Helpers ───────────────────────────────────────────────────────────────────

function newId(): string {
  return crypto.randomUUID();
}

function now(): Date {
  return new Date();
}

function applyTxosnaOverride(product: StoredProduct, txosnaId: string): StoredProductView {
  const override = txosnaProducts.get(`${txosnaId}:${product.id}`);
  return {
    ...product,
    effectivePrice: override?.priceOverride ?? product.defaultPrice,
    available: product.available && (override?.available ?? true),
    soldOut: override?.soldOut ?? false,
    preparationInstructions: override?.preparationInstructions ?? product.preparationInstructions,
  };
}

// ── Seed ──────────────────────────────────────────────────────────────────────

function seed() {
  const t = now();

  // Association
  associations.set(MOCK_ASSOCIATION.id, {
    id: MOCK_ASSOCIATION.id,
    name: MOCK_ASSOCIATION.name,
    phone: null,
    cif: 'A12345678',
    ticketBaiEnabled: false,
    createdAt: t,
  });

  // Txosnak — all belong to the single mock association
  for (const mt of MOCK_ASSOCIATION.txosnak) {
    txosnak.set(mt.id, {
      id: mt.id,
      slug: mt.slug,
      name: mt.name,
      status: mt.status,
      counterSetup: mt.counterSetup,
      kitchenPosts: mt.kitchenPosts ?? [],
      waitMinutes: mt.waitMinutes,
      pinHash: mt.pin, // plain PIN; bcrypt added in Phase 6 / Phase 10
      enabledChannels: ['COUNTER', 'PHONE_TO_COUNTER', 'SELF_SERVICE'],
      enabledPaymentMethods: ['CASH'],
      pendingPaymentTimeout: 15,
      printingEnabled: false,
      mobileTrackingEnabled: mt.id === 'txosna-1',
      associationId: MOCK_ASSOCIATION.id,
      createdAt: t,
      updatedAt: t,
    });
  }

  // Categories
  for (const mc of MOCK_CATEGORIES) {
    categories.set(mc.id, {
      id: mc.id,
      name: mc.name,
      type: mc.type,
      displayOrder: mc.displayOrder,
      associationId: MOCK_ASSOCIATION.id,
    });
  }

  // Products
  for (const mp of MOCK_PRODUCTS) {
    products.set(mp.id, {
      id: mp.id,
      categoryId: mp.categoryId,
      name: mp.name,
      description: mp.description,
      defaultPrice: mp.price,
      imageUrl: mp.imageUrl,
      allergens: mp.allergens,
      dietaryFlags: mp.dietaryFlags,
      ageRestricted: mp.ageRestricted,
      requiresPreparation: mp.requiresPreparation,
      available: mp.available,
      splittable: mp.splitAllowed,
      splitMaxWays: mp.splitMaxWays,
      removableIngredients: mp.removableIngredients,
      preparationInstructions: mp.preparationInstructions,
      displayOrder: MOCK_PRODUCTS.indexOf(mp),
      kitchenPost: mp.kitchenPost ?? null,
      variantGroups: mp.variantGroups.map((vg, vgi) => ({
        id: vg.id,
        name: vg.name,
        displayOrder: vgi,
        options: vg.options.map((o, oi) => ({
          id: o.id,
          name: o.name,
          priceDelta: o.priceDelta,
          allergens: [],
          displayOrder: oi,
          kitchenPost: o.kitchenPost ?? null,
        })),
      })),
      modifiers: mp.modifiers.map((mod, modi) => ({
        id: mod.id,
        name: mod.name,
        price: mod.price,
        allergens: [],
        displayOrder: modi,
        kitchenPost: mod.kitchenPost ?? null,
      })),
    });
  }

  // No txosna-level product overrides in the seed — all defaults apply.

  // Orders and tickets
  let maxOrderNumber = 0;
  for (const mo of MOCK_ORDERS) {
    orders.set(mo.id, {
      id: mo.id,
      orderNumber: mo.orderNumber,
      txosnaId: 'txosna-1',
      status: mo.status,
      cancellationReason: null,
      channel: mo.channel,
      paymentMethod: 'CASH',
      customerName: mo.customerName,
      notes: mo.notes,
      total: mo.total,
      verificationCode: mo.verificationCode,
      registeredById: null,
      paymentSessionId: null,
      confirmedAt: mo.status === 'CONFIRMED' ? new Date(mo.createdAt) : null,
      expiresAt: mo.expiresAt ? new Date(mo.expiresAt) : null,
      pendingLines: null,
      fiscalReceiptRef: null,
      createdAt: new Date(mo.createdAt),
      updatedAt: new Date(mo.createdAt),
    });
    if (mo.orderNumber > maxOrderNumber) maxOrderNumber = mo.orderNumber;
  }
  orderCounters.set('txosna-1', maxOrderNumber);

  for (const mt of MOCK_TICKETS) {
    tickets.set(mt.id, {
      id: mt.id,
      orderId: mt.orderId,
      txosnaId: 'txosna-1',
      counterType: mt.counterType,
      kitchenPost: mt.kitchenPost ?? null,
      status: mt.status,
      requiresPreparation: mt.lines.some((l) => {
        const p = products.get(l.productId);
        return p?.requiresPreparation ?? false;
      }),
      flagged: mt.flagged,
      orderChangedAlert: mt.hasAlert,
      notes: mt.notes,
      lines: mt.lines.map((l) => ({
        id: l.id,
        productId: l.productId,
        productName: l.productName,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        selectedVariant: l.selectedVariant,
        selectedModifiers: l.selectedModifiers,
        splitInstructions: l.splitInstructions,
      })),
      createdAt: t,
      readyAt: mt.status === 'READY' ? t : null,
      completedAt: mt.status === 'COMPLETED' ? t : null,
      updatedAt: t,
    });
  }

  // Volunteers
  for (const mv of MOCK_VOLUNTEERS) {
    volunteers.set(mv.id, {
      id: mv.id,
      associationId: MOCK_ASSOCIATION.id,
      name: mv.name,
      email: mv.email,
      passwordHash: 'plain:test1234',
      passwordResetToken: null,
      passwordResetExpiresAt: null, // replaced with bcrypt hash in Phase 6
      role: mv.role,
      active: mv.active,
      createdAt: t,
      updatedAt: t,
    });
  }
}

// ── TxosnaRepository ──────────────────────────────────────────────────────────

export const txosnaRepo: TxosnaRepository = {
  async findBySlug(slug) {
    for (const t of txosnak.values()) {
      if (t.slug === slug) return t;
    }
    return null;
  },

  async findById(id) {
    return txosnak.get(id) ?? null;
  },

  async list(associationId) {
    return [...txosnak.values()].filter((t) => t.associationId === associationId);
  },

  async create(data: CreateTxosnaInput) {
    const t = now();
    const txosna: StoredTxosna = {
      id: newId(),
      slug: data.slug,
      name: data.name,
      status: 'OPEN',
      counterSetup: 'SINGLE',
      kitchenPosts: [],
      waitMinutes: null,
      pinHash: data.pinHash ?? '0000',
      enabledChannels: ['COUNTER', 'SELF_SERVICE'],
      enabledPaymentMethods: ['CASH'],
      pendingPaymentTimeout: 15,
      printingEnabled: false,
      mobileTrackingEnabled: false,
      associationId: data.associationId,
      createdAt: t,
      updatedAt: t,
    };
    txosnak.set(txosna.id, txosna);
    return txosna;
  },

  async update(id, patch) {
    const existing = txosnak.get(id);
    if (!existing) throw new Error(`Txosna not found: ${id}`);
    const updated = { ...existing, ...patch, id, updatedAt: now() };
    txosnak.set(id, updated);
    return updated;
  },
};

// ── OrderRepository ───────────────────────────────────────────────────────────

export const orderRepo: OrderRepository = {
  async create(data: CreateOrderInput) {
    const orderNumber = await orderRepo.nextOrderNumber(data.txosnaId);
    const verificationCode = generateVerificationCode();
    const t = now();

    const order: StoredOrder = {
      id: newId(),
      orderNumber,
      txosnaId: data.txosnaId,
      status: data.status,
      cancellationReason: null,
      channel: data.channel,
      paymentMethod: data.paymentMethod,
      customerName: data.customerName,
      notes: data.notes,
      total: data.total,
      verificationCode,
      registeredById: data.registeredById,
      paymentSessionId: null,
      confirmedAt: data.status === 'CONFIRMED' ? t : null,
      expiresAt: data.expiresAt,
      pendingLines: data.status === 'PENDING_PAYMENT' ? (data.pendingLines ?? data.tickets) : null,
      fiscalReceiptRef: null,
      createdAt: t,
      updatedAt: t,
    };
    orders.set(order.id, order);

    // Create tickets immediately unless order is PENDING_PAYMENT
    if (data.status !== 'PENDING_PAYMENT') {
      for (const ticketInput of data.tickets) {
        const ticket: StoredTicket = {
          id: newId(),
          orderId: order.id,
          txosnaId: data.txosnaId,
          counterType: ticketInput.counterType,
          kitchenPost: ticketInput.kitchenPost ?? null,
          status: 'RECEIVED',
          requiresPreparation: ticketInput.requiresPreparation,
          flagged: false,
          orderChangedAlert: false,
          notes: ticketInput.notes,
          lines: ticketInput.lines.map((l) => ({ id: newId(), ...l })),
          createdAt: t,
          readyAt: null,
          completedAt: null,
          updatedAt: t,
        };
        tickets.set(ticket.id, ticket);
      }
    }

    return order;
  },

  async findById(id) {
    return orders.get(id) ?? null;
  },

  async findByNumber(txosnaId, orderNumber) {
    for (const o of orders.values()) {
      if (o.txosnaId === txosnaId && o.orderNumber === orderNumber) return o;
    }
    return null;
  },

  async findByPaymentSessionId(sessionId) {
    for (const o of orders.values()) {
      if (o.paymentSessionId === sessionId) return o;
    }
    return null;
  },

  async findByVerificationCode(txosnaId, code) {
    for (const o of orders.values()) {
      if (o.txosnaId === txosnaId && o.verificationCode === code) return o;
    }
    return null;
  },

  async listByTxosna(txosnaId, filter) {
    let result = [...orders.values()].filter((o) => o.txosnaId === txosnaId);
    if (filter?.status) result = result.filter((o) => o.status === filter.status);
    if (filter?.channel) result = result.filter((o) => o.channel === filter.channel);
    if (filter?.since) result = result.filter((o) => o.createdAt >= filter.since!);
    return result.sort((a, b) => a.orderNumber - b.orderNumber);
  },

  async update(id, patch) {
    const existing = orders.get(id);
    if (!existing) throw new Error(`Order not found: ${id}`);
    const updated = { ...existing, ...patch, id, updatedAt: now() };
    orders.set(id, updated);
    return updated;
  },

  async nextOrderNumber(txosnaId) {
    const next = (orderCounters.get(txosnaId) ?? 0) + 1;
    orderCounters.set(txosnaId, next);
    return next;
  },
};

// ── TicketRepository ──────────────────────────────────────────────────────────

export const ticketRepo: TicketRepository = {
  async create(orderId, txosnaId, data) {
    const t = now();
    const ticket: StoredTicket = {
      id: newId(),
      orderId,
      txosnaId,
      counterType: data.counterType,
      kitchenPost: data.kitchenPost ?? null,
      status: 'RECEIVED',
      requiresPreparation: data.requiresPreparation,
      flagged: false,
      orderChangedAlert: false,
      notes: data.notes,
      lines: data.lines.map((l) => ({ id: newId(), ...l })),
      createdAt: t,
      readyAt: null,
      completedAt: null,
      updatedAt: t,
    };
    tickets.set(ticket.id, ticket);
    return ticket;
  },

  async findById(id) {
    return tickets.get(id) ?? null;
  },

  async listByTxosna(txosnaId, filter) {
    let result = [...tickets.values()].filter((t) => t.txosnaId === txosnaId);
    if (filter?.status) result = result.filter((t) => t.status === filter.status);
    if (filter?.counterType) result = result.filter((t) => t.counterType === filter.counterType);
    if (filter?.kitchenPost) result = result.filter((t) => t.kitchenPost === filter.kitchenPost);
    return result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },

  async listByOrder(orderId) {
    return [...tickets.values()].filter((t) => t.orderId === orderId);
  },

  async update(id, patch) {
    const existing = tickets.get(id);
    if (!existing) throw new Error(`Ticket not found: ${id}`);
    const updated = { ...existing, ...patch, id, updatedAt: now() };
    tickets.set(id, updated);
    return updated;
  },
};

// ── VolunteerRepository ───────────────────────────────────────────────────────

export const volunteerRepo: VolunteerRepository = {
  async findByEmail(email) {
    for (const v of volunteers.values()) {
      if (v.email === email) return v;
    }
    return null;
  },

  async findById(id) {
    return volunteers.get(id) ?? null;
  },

  async findByResetToken(token) {
    for (const v of volunteers.values()) {
      if (v.passwordResetToken === token) return v;
    }
    return null;
  },

  async listByAssociation(associationId) {
    return [...volunteers.values()].filter((v) => v.associationId === associationId);
  },

  async create(data: CreateVolunteerInput) {
    const t = now();
    const volunteer: StoredVolunteer = {
      id: newId(),
      ...data,
      active: true,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      createdAt: t,
      updatedAt: t,
    };
    volunteers.set(volunteer.id, volunteer);
    return volunteer;
  },

  async update(id, patch) {
    const existing = volunteers.get(id);
    if (!existing) throw new Error(`Volunteer not found: ${id}`);
    const updated = { ...existing, ...patch, id, updatedAt: now() };
    volunteers.set(id, updated);
    return updated;
  },
};

// ── CatalogRepository ─────────────────────────────────────────────────────────

export const catalogRepo: CatalogRepository = {
  async listCategories(associationId) {
    return [...categories.values()]
      .filter((c) => c.associationId === associationId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },

  async listProducts(categoryId) {
    return [...products.values()]
      .filter((p) => p.categoryId === categoryId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },

  async getProduct(productId) {
    return products.get(productId) ?? null;
  },

  async getProductView(productId, txosnaId) {
    const product = products.get(productId);
    if (!product) return null;
    return applyTxosnaOverride(product, txosnaId);
  },

  async listProductViews(txosnaId) {
    const txosna = txosnak.get(txosnaId);
    if (!txosna) return [];

    const assocCategories = await catalogRepo.listCategories(txosna.associationId);
    const result: { category: StoredCategory; products: StoredProductView[] }[] = [];

    for (const category of assocCategories) {
      const categoryProducts = await catalogRepo.listProducts(category.id);
      const views = categoryProducts
        .map((p) => applyTxosnaOverride(p, txosnaId))
        .filter((v) => v.available);
      result.push({ category, products: views });
    }

    return result;
  },
};

// ── AssociationRepository ─────────────────────────────────────────────────────

export const associationRepo: AssociationRepository = {
  async create(name: string) {
    const t = now();
    const assoc: StoredAssociation = {
      id: newId(),
      name,
      phone: null,
      cif: null,
      ticketBaiEnabled: false,
      createdAt: t,
    };
    associations.set(assoc.id, assoc);
    return assoc;
  },

  async findById(id: string) {
    return associations.get(id) ?? null;
  },

  async findByName(query: string) {
    const q = query.toLowerCase();
    return [...associations.values()].find((a) => a.name.toLowerCase().includes(q)) ?? null;
  },

  async update(id, patch) {
    const existing = associations.get(id);
    if (!existing) throw new Error(`Association not found: ${id}`);
    const updated = { ...existing, ...patch, id };
    associations.set(id, updated);
    return updated;
  },
};

// ── PaymentProviderRepository ─────────────────────────────────────────────────

export const paymentProviderRepo: PaymentProviderRepository = {
  async listByAssociation(associationId) {
    return [...paymentProviders.values()].filter((p) => p.associationId === associationId);
  },

  async findById(id) {
    return paymentProviders.get(id) ?? null;
  },

  async create(data: CreatePaymentProviderInput) {
    const t = now();
    const provider: StoredPaymentProvider = {
      id: newId(),
      associationId: data.associationId,
      providerType: data.providerType,
      displayName: data.displayName ?? null,
      enabled: true,
      testMode: data.testMode,
      credentials: data.credentials,
      bizumEnabled: data.bizumEnabled ?? false,
      verifiedAt: null,
      createdAt: t,
      updatedAt: t,
    };
    paymentProviders.set(provider.id, provider);
    return provider;
  },

  async update(id, patch) {
    const existing = paymentProviders.get(id);
    if (!existing) throw new Error(`PaymentProvider not found: ${id}`);
    const updated = { ...existing, ...patch, id, updatedAt: now() };
    paymentProviders.set(id, updated);
    return updated;
  },

  async delete(id) {
    paymentProviders.delete(id);
  },
};

// ── Verification code ─────────────────────────────────────────────────────────

function generateVerificationCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O to avoid confusion
  const digits = '0123456789';
  const rand = (s: string) => s[Math.floor(Math.random() * s.length)];
  return (
    rand(letters) + rand(letters) + '-' + rand(digits) + rand(digits) + rand(digits) + rand(digits)
  );
}

// ── Demo association seed / reset ─────────────────────────────────────────────

function seedDemoAssociation() {
  const t = now();

  associations.set(DEMO_ASSOCIATION.id, {
    id: DEMO_ASSOCIATION.id,
    name: DEMO_ASSOCIATION.name,
    phone: null,
    cif: null,
    ticketBaiEnabled: false,
    createdAt: t,
  });

  for (const dt of DEMO_TXOSNAK) {
    txosnak.set(dt.id, {
      id: dt.id,
      slug: dt.slug,
      name: dt.name,
      status: dt.status,
      counterSetup: dt.counterSetup,
      kitchenPosts: dt.kitchenPosts ?? [],
      waitMinutes: dt.waitMinutes,
      pinHash: DEMO_PIN,
      enabledChannels: ['COUNTER', 'PHONE_TO_COUNTER', 'SELF_SERVICE'],
      enabledPaymentMethods: ['CASH'],
      pendingPaymentTimeout: 15,
      printingEnabled: false,
      mobileTrackingEnabled: dt.id === 'demo-txosna-1',
      associationId: DEMO_ASSOCIATION.id,
      createdAt: t,
      updatedAt: t,
    });
  }

  for (const dc of DEMO_CATEGORIES) {
    categories.set(dc.id, {
      id: dc.id,
      name: dc.name,
      type: dc.type,
      displayOrder: dc.displayOrder,
      associationId: DEMO_ASSOCIATION.id,
    });
  }

  for (const [i, dp] of DEMO_PRODUCTS.entries()) {
    products.set(dp.id, {
      id: dp.id,
      categoryId: dp.categoryId,
      name: dp.name,
      description: dp.description,
      defaultPrice: dp.price,
      imageUrl: dp.imageUrl,
      allergens: dp.allergens,
      dietaryFlags: dp.dietaryFlags,
      ageRestricted: dp.ageRestricted,
      requiresPreparation: dp.requiresPreparation,
      available: dp.available,
      splittable: dp.splitAllowed,
      splitMaxWays: dp.splitMaxWays,
      removableIngredients: dp.removableIngredients,
      preparationInstructions: dp.preparationInstructions,
      displayOrder: i,
      kitchenPost: dp.kitchenPost ?? null,
      variantGroups: dp.variantGroups.map((vg, vgi) => ({
        id: vg.id,
        name: vg.name,
        displayOrder: vgi,
        options: vg.options.map((o, oi) => ({
          id: o.id,
          name: o.name,
          priceDelta: o.priceDelta,
          allergens: [],
          displayOrder: oi,
          kitchenPost: o.kitchenPost ?? null,
        })),
      })),
      modifiers: dp.modifiers.map((mod, modi) => ({
        id: mod.id,
        name: mod.name,
        price: mod.price,
        allergens: [],
        displayOrder: modi,
        kitchenPost: mod.kitchenPost ?? null,
      })),
    });
  }

  for (const override of DEMO_TXOSNA_OVERRIDES) {
    const key = `${override.txosnaId}:${override.productId}`;
    txosnaProducts.set(key, {
      txosnaId: override.txosnaId,
      productId: override.productId,
      priceOverride: override.priceOverride,
      available: override.available,
      soldOut: override.soldOut,
      preparationInstructions: override.preparationInstructions,
    });
  }

  let maxDemoOrderNumber = 0;
  for (const mo of DEMO_ORDERS) {
    orders.set(mo.id, {
      id: mo.id,
      orderNumber: mo.orderNumber,
      txosnaId: 'demo-txosna-1',
      status: mo.status,
      cancellationReason: mo.status === 'CANCELLED' ? 'SOLD_OUT' : null,
      channel: mo.channel,
      paymentMethod: 'CASH',
      customerName: mo.customerName,
      notes: mo.notes,
      total: mo.total,
      verificationCode: mo.verificationCode,
      registeredById: null,
      paymentSessionId: null,
      confirmedAt: mo.status === 'CONFIRMED' ? new Date(mo.createdAt) : null,
      expiresAt: mo.expiresAt ? new Date(mo.expiresAt) : null,
      pendingLines: null,
      fiscalReceiptRef: null,
      createdAt: new Date(mo.createdAt),
      updatedAt: new Date(mo.createdAt),
    });
    if (mo.orderNumber > maxDemoOrderNumber) maxDemoOrderNumber = mo.orderNumber;
  }
  orderCounters.set('demo-txosna-1', maxDemoOrderNumber);

  for (const mt of DEMO_TICKETS) {
    tickets.set(mt.id, {
      id: mt.id,
      orderId: mt.orderId,
      txosnaId: 'demo-txosna-1',
      counterType: mt.counterType,
      kitchenPost: null,
      status: mt.status,
      requiresPreparation: mt.lines.some((l) => {
        const p = products.get(l.productId);
        return p?.requiresPreparation ?? false;
      }),
      flagged: mt.flagged,
      orderChangedAlert: mt.hasAlert,
      notes: mt.notes,
      lines: mt.lines.map((l) => ({
        id: l.id,
        productId: l.productId,
        productName: l.productName,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        selectedVariant: l.selectedVariant,
        selectedModifiers: l.selectedModifiers,
        splitInstructions: l.splitInstructions,
      })),
      createdAt: new Date(DEMO_ORDERS.find((o) => o.id === mt.orderId)?.createdAt ?? t),
      readyAt: mt.status === 'READY' ? t : null,
      completedAt: mt.status === 'COMPLETED' ? t : null,
      updatedAt: t,
    });
  }

  for (const mv of DEMO_VOLUNTEERS) {
    volunteers.set(mv.id, {
      id: mv.id,
      associationId: DEMO_ASSOCIATION.id,
      name: mv.name,
      email: mv.email,
      passwordHash: 'plain:demo0000',
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      role: mv.role,
      active: mv.active,
      createdAt: t,
      updatedAt: t,
    });
  }
}

/**
 * Wipe all demo-prefixed entities and re-seed from the demo fixture.
 * Called by POST /api/demo/reset and by resetStore() (full test reset).
 */
export function resetDemoAssociation() {
  const isDemo = (id: string) => id.startsWith('demo-');
  const isDemoKey = (key: string) => key.startsWith('demo-');

  for (const id of [...associations.keys()].filter(isDemo)) associations.delete(id);
  for (const id of [...txosnak.keys()].filter(isDemo)) txosnak.delete(id);
  for (const id of [...categories.keys()].filter(isDemo)) categories.delete(id);
  for (const id of [...products.keys()].filter(isDemo)) products.delete(id);
  for (const key of [...txosnaProducts.keys()].filter(isDemoKey)) txosnaProducts.delete(key);
  for (const id of [...orders.keys()].filter(isDemo)) orders.delete(id);
  for (const id of [...tickets.keys()].filter(isDemo)) tickets.delete(id);
  for (const id of [...volunteers.keys()].filter(isDemo)) volunteers.delete(id);
  for (const id of [...orderCounters.keys()].filter(isDemo)) orderCounters.delete(id);

  seedDemoAssociation();
}

// ── Reset (for tests) ─────────────────────────────────────────────────────────

export function resetStore() {
  associations.clear();
  txosnak.clear();
  categories.clear();
  products.clear();
  txosnaProducts.clear();
  orders.clear();
  tickets.clear();
  volunteers.clear();
  orderCounters.clear();
  paymentProviders.clear();
  ticketBaiConfigs.clear();
  ticketBaiInvoices.clear();
  ticketBaiInvoiceCounters.clear();
  seed();
  seedDemoAssociation();
}

// ── TicketBaiConfigRepository ─────────────────────────────────────────────────

export const ticketBaiConfigRepo: TicketBaiConfigRepository = {
  async findByAssociation(associationId) {
    return [...ticketBaiConfigs.values()].find((c) => c.associationId === associationId) ?? null;
  },

  async upsert(associationId, data) {
    const t = now();
    const existing = [...ticketBaiConfigs.values()].find((c) => c.associationId === associationId);
    if (existing) {
      const updated: StoredTicketBaiConfig = { ...existing, ...data, updatedAt: t };
      ticketBaiConfigs.set(existing.id, updated);
      return updated;
    }
    const created: StoredTicketBaiConfig = {
      id: newId(),
      associationId,
      providerType: data.providerType ?? 'MOCK',
      series: data.series ?? 'TB',
      credentials: data.credentials ?? {},
      createdAt: t,
      updatedAt: t,
    };
    ticketBaiConfigs.set(created.id, created);
    return created;
  },
};

// ── TicketBaiInvoiceRepository ────────────────────────────────────────────────

export const ticketBaiInvoiceRepo: TicketBaiInvoiceRepository = {
  async create(data) {
    const t = now();
    const invoice: StoredTicketBaiInvoice = { ...data, id: newId(), createdAt: t, updatedAt: t };
    ticketBaiInvoices.set(invoice.id, invoice);
    const counterKey = `${data.associationId}:${data.series}`;
    const current = ticketBaiInvoiceCounters.get(counterKey) ?? 0;
    if (data.invoiceNumber > current) {
      ticketBaiInvoiceCounters.set(counterKey, data.invoiceNumber);
    }
    return invoice;
  },

  async findByOrder(orderId) {
    return [...ticketBaiInvoices.values()].find((i) => i.orderId === orderId) ?? null;
  },

  async findById(id) {
    return ticketBaiInvoices.get(id) ?? null;
  },

  async listByAssociation(associationId) {
    return [...ticketBaiInvoices.values()]
      .filter((i) => i.associationId === associationId)
      .sort((a, b) => b.invoiceNumber - a.invoiceNumber);
  },

  async getLastByAssociation(associationId, series) {
    const all = [...ticketBaiInvoices.values()].filter(
      (i) => i.associationId === associationId && i.series === series
    );
    if (all.length === 0) return null;
    return all.reduce((prev, curr) => (curr.invoiceNumber > prev.invoiceNumber ? curr : prev));
  },

  async nextInvoiceNumber(associationId, series) {
    const key = `${associationId}:${series}`;
    const current = ticketBaiInvoiceCounters.get(key) ?? 0;
    return current + 1;
  },
};

// ── Test helpers (not part of repository interfaces) ─────────────────────────

export function _test_insertTxosna(t: StoredTxosna): void {
  txosnak.set(t.id, t);
}

export function _test_insertProduct(p: StoredProduct): void {
  products.set(p.id, p);
}

export function _test_setProductAvailable(productId: string, available: boolean): void {
  const p = products.get(productId);
  if (p) products.set(productId, { ...p, available });
}

export function _test_upsertTxosnaProduct(tp: StoredTxosnaProduct): void {
  txosnaProducts.set(`${tp.txosnaId}:${tp.productId}`, tp);
}

export function _test_insertOrder(o: StoredOrder): void {
  orders.set(o.id, o);
}

// ── Dev-only TicketBAI demo data ──────────────────────────────────────────────
// Not included in resetStore() so tests start with a clean TicketBAI slate.

function seedTicketBaiDemo() {
  const t = now();

  associations.set('assoc-1', {
    ...associations.get('assoc-1')!,
    ticketBaiEnabled: true,
  });

  ticketBaiConfigs.set('tbai-config-1', {
    id: 'tbai-config-1',
    associationId: 'assoc-1',
    providerType: 'MOCK',
    series: 'TB',
    credentials: {},
    createdAt: t,
    updatedAt: t,
  });

  const inv1: StoredTicketBaiInvoice = {
    id: 'tbai-inv-1',
    associationId: 'assoc-1',
    orderId: 'order-1',
    orderNumber: 42,
    series: 'TB',
    invoiceNumber: 42,
    issuedAt: new Date('2026-04-13T18:40:00Z'),
    sellerName: MOCK_ASSOCIATION.name,
    sellerCif: 'A12345678',
    lines: [
      {
        description: 'Burgerra (Patata frijituak)',
        quantity: 1,
        unitPrice: 13.5,
        vatRate: 0,
        vatAmount: 0,
        total: 13.5,
      },
      {
        description: 'Tortilla',
        quantity: 1,
        unitPrice: 3.5,
        vatRate: 0,
        vatAmount: 0,
        total: 3.5,
      },
    ],
    total: 17.0,
    vatBreakdown: [{ rate: 0, base: 17.0, vatAmount: 0 }],
    chainId: 'mock-chain-42',
    providerRef: 'MOCK-TB-00000042',
    qrUrl: null,
    xmlPayload: null,
    status: 'MOCK',
    createdAt: t,
    updatedAt: t,
  };
  ticketBaiInvoices.set('tbai-inv-1', inv1);

  const inv2: StoredTicketBaiInvoice = {
    id: 'tbai-inv-2',
    associationId: 'assoc-1',
    orderId: 'order-3',
    orderNumber: 35,
    series: 'TB',
    invoiceNumber: 35,
    issuedAt: new Date('2026-04-13T18:20:00Z'),
    sellerName: MOCK_ASSOCIATION.name,
    sellerCif: 'A12345678',
    lines: [
      {
        description: 'Pintxo nahasia',
        quantity: 1,
        unitPrice: 6.0,
        vatRate: 0,
        vatAmount: 0,
        total: 6.0,
      },
    ],
    total: 6.0,
    vatBreakdown: [{ rate: 0, base: 6.0, vatAmount: 0 }],
    chainId: 'mock-chain-35',
    providerRef: 'MOCK-TB-00000035',
    qrUrl: null,
    xmlPayload: null,
    status: 'MOCK',
    createdAt: t,
    updatedAt: t,
  };
  ticketBaiInvoices.set('tbai-inv-2', inv2);
  ticketBaiInvoiceCounters.set('assoc-1:TB', 42);

  orders.set('order-1', { ...orders.get('order-1')!, fiscalReceiptRef: 'tbai-inv-1' });
  orders.set('order-3', { ...orders.get('order-3')!, fiscalReceiptRef: 'tbai-inv-2' });

  tickets.set('ticket-2b', {
    ...tickets.get('ticket-2b')!,
    status: 'READY',
    readyAt: t,
  });
}

// Seed on module load so the store is ready in dev without explicit setup.
seed();
seedDemoAssociation();
// TicketBAI demo data is dev-only; tests call resetStore() which skips this.
if (!process.env.VITEST) {
  seedTicketBaiDemo();
}
