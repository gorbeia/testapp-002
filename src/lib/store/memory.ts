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
import type {
  CatalogRepository,
  CreateOrderInput,
  CreateVolunteerInput,
  OrderRepository,
  StoredAssociation,
  StoredCategory,
  StoredOrder,
  StoredProduct,
  StoredProductView,
  StoredTicket,
  StoredTxosna,
  StoredTxosnaProduct,
  StoredVolunteer,
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
      waitMinutes: mt.waitMinutes,
      pinHash: mt.pin, // plain PIN; bcrypt added in Phase 6 / Phase 10
      enabledChannels: ['COUNTER', 'PHONE_TO_COUNTER', 'SELF_SERVICE'],
      enabledPaymentMethods: ['CASH'],
      pendingPaymentTimeout: 15,
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
        })),
      })),
      modifiers: mp.modifiers.map((mod, modi) => ({
        id: mod.id,
        name: mod.name,
        price: mod.price,
        allergens: [],
        displayOrder: modi,
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
      passwordHash: 'plain:test1234', // replaced with bcrypt hash in Phase 6
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
      createdAt: t,
      updatedAt: t,
    };
    orders.set(order.id, order);

    for (const ticketInput of data.tickets) {
      const ticket: StoredTicket = {
        id: newId(),
        orderId: order.id,
        txosnaId: data.txosnaId,
        counterType: ticketInput.counterType,
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
  async findById(id) {
    return tickets.get(id) ?? null;
  },

  async listByTxosna(txosnaId, filter) {
    let result = [...tickets.values()].filter((t) => t.txosnaId === txosnaId);
    if (filter?.status) result = result.filter((t) => t.status === filter.status);
    if (filter?.counterType) result = result.filter((t) => t.counterType === filter.counterType);
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

  async listByAssociation(associationId) {
    return [...volunteers.values()].filter((v) => v.associationId === associationId);
  },

  async create(data: CreateVolunteerInput) {
    const t = now();
    const volunteer: StoredVolunteer = {
      id: newId(),
      ...data,
      active: true,
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

// ── Verification code ─────────────────────────────────────────────────────────

function generateVerificationCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O to avoid confusion
  const digits = '0123456789';
  const rand = (s: string) => s[Math.floor(Math.random() * s.length)];
  return (
    rand(letters) + rand(letters) + '-' + rand(digits) + rand(digits) + rand(digits) + rand(digits)
  );
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
  seed();
}

// Seed on module load so the store is ready in dev without explicit setup.
seed();
