// ORM storage adapter implementing the storage interface using Prisma
// This adapter provides database storage for production environments

import { StorageInterface, StorageConfig } from '../storage-interface';
import type {
  AssociationRepository,
  CatalogRepository,
  OrderRepository,
  PaymentProviderRepository,
  TicketBaiConfigRepository,
  TicketBaiInvoiceRepository,
  TicketRepository,
  TxosnaRepository,
  VolunteerRepository,
  CreateTxosnaInput,
  StoredAssociation,
  StoredTxosna,
} from '../types';

// Dynamic import to handle missing Prisma client gracefully
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PrismaClient: any;
try {
  PrismaClient = require('@prisma/client').PrismaClient;
} catch {
  console.warn('Prisma client not available, ORM adapter will not work');
}

export class ORMStorageAdapter implements StorageInterface {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private prisma: any;
  private initialized = false;

  constructor(config: StorageConfig) {
    if (!PrismaClient) {
      throw new Error('Prisma client not available. Cannot initialize ORM storage adapter.');
    }

    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url:
            config.ormConfig?.databaseUrl ||
            (typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined),
        },
      },
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Test database connection
    await this.prisma.$connect();
    this.initialized = true;
  }

  async reset(): Promise<void> {
    // In production, we wouldn't typically reset the database
    // This is mainly for testing purposes
    await this.prisma.order.deleteMany();
    await this.prisma.ticket.deleteMany();
    await this.prisma.txosnaProduct.deleteMany();
    await this.prisma.product.deleteMany();
    await this.prisma.category.deleteMany();
    await this.prisma.txosna.deleteMany();
    await this.prisma.volunteer.deleteMany();
    await this.prisma.association.deleteMany();
    await this.prisma.paymentProvider.deleteMany();
    await this.prisma.ticketBaiConfig.deleteMany();
    await this.prisma.ticketBaiInvoice.deleteMany();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(fn);
  }

  get associations(): AssociationRepository {
    return {
      create: async (name: string): Promise<StoredAssociation> => {
        const association = await this.prisma.association.create({
          data: { name },
        });
        return this.mapAssociationToStored(association);
      },

      findById: async (id: string): Promise<StoredAssociation | null> => {
        const association = await this.prisma.association.findUnique({
          where: { id },
        });
        return association ? this.mapAssociationToStored(association) : null;
      },

      findByName: async (query: string): Promise<StoredAssociation | null> => {
        const association = await this.prisma.association.findFirst({
          where: { name: { contains: query, mode: 'insensitive' } },
        });
        return association ? this.mapAssociationToStored(association) : null;
      },

      update: async (
        id: string,
        patch: Partial<Omit<StoredAssociation, 'id' | 'createdAt'>>
      ): Promise<StoredAssociation> => {
        const association = await this.prisma.association.update({
          where: { id },
          data: patch,
        });
        return this.mapAssociationToStored(association);
      },
    };
  }

  get txosnak(): TxosnaRepository {
    return {
      findBySlug: async (slug: string): Promise<StoredTxosna | null> => {
        const txosna = await this.prisma.txosna.findUnique({
          where: { slug },
        });
        return txosna ? this.mapTxosnaToStored(txosna) : null;
      },

      findById: async (id: string): Promise<StoredTxosna | null> => {
        const txosna = await this.prisma.txosna.findUnique({
          where: { id },
        });
        return txosna ? this.mapTxosnaToStored(txosna) : null;
      },

      list: async (associationId: string): Promise<StoredTxosna[]> => {
        const txosnak = await this.prisma.txosna.findMany({
          where: { associationId },
        });
        return txosnak.map(this.mapTxosnaToStored.bind(this));
      },

      create: async (data: CreateTxosnaInput): Promise<StoredTxosna> => {
        const txosna = await this.prisma.txosna.create({
          data: {
            ...data,
            status: 'OPEN',
            counterSetup: 'SINGLE',
            kitchenPosts: [],
            waitMinutes: null,
            pinHash: data.pinHash || '',
            enabledChannels: ['COUNTER'],
            enabledPaymentMethods: ['CASH'],
            pendingPaymentTimeout: 15,
            printingEnabled: false,
            mobileTrackingEnabled: false,
          },
        });
        return this.mapTxosnaToStored(txosna);
      },

      update: async (
        id: string,
        patch: Partial<Omit<StoredTxosna, 'id' | 'createdAt'>>
      ): Promise<StoredTxosna> => {
        const txosna = await this.prisma.txosna.update({
          where: { id },
          data: patch,
        });
        return this.mapTxosnaToStored(txosna);
      },
    };
  }

  get catalog(): CatalogRepository {
    return {
      listCategories: async (associationId: string) => {
        const categories = await this.prisma.category.findMany({
          where: { associationId },
          orderBy: { name: 'asc' },
        });
        return categories.map(this.mapCategoryToStored.bind(this));
      },

      listProducts: async (categoryId: string) => {
        const products = await this.prisma.product.findMany({
          where: { categoryId },
          include: {
            variants: {
              include: { options: true },
            },
          },
          orderBy: { name: 'asc' },
        });
        return products.map(this.mapProductToStored.bind(this));
      },

      getProduct: async (productId: string) => {
        const product = await this.prisma.product.findUnique({
          where: { id: productId },
          include: {
            variants: {
              include: { options: true },
            },
          },
        });
        return product ? this.mapProductToStored(product) : null;
      },

      getProductView: async (productId: string, _txosnaId: string) => {
        const product = await this.prisma.product.findUnique({
          where: { id: productId },
          include: {
            variants: {
              include: { options: true },
            },
          },
        });
        return product ? this.mapProductToStored(product) : null;
      },

      listProductViews: async (txosnaId: string) => {
        const categories = await this.prisma.category.findMany({
          where: {
            txosna: { some: { id: txosnaId } },
          },
          include: {
            products: {
              include: {
                variants: {
                  include: { options: true },
                },
              },
            },
          },
          orderBy: { name: 'asc' },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return categories.map((cat: any) => ({
          category: this.mapCategoryToStored(cat),
          products: cat.products.map(this.mapProductToStored.bind(this)),
        }));
      },

      findCategory: async (id: string) => {
        const cat = await this.prisma.category.findUnique({ where: { id } });
        return cat ? this.mapCategoryToStored(cat) : null;
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createCategory: async (data: any) => {
        const cat = await this.prisma.category.create({ data });
        return this.mapCategoryToStored(cat);
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateCategory: async (id: string, patch: any) => {
        const cat = await this.prisma.category.update({ where: { id }, data: patch });
        return this.mapCategoryToStored(cat);
      },

      deleteCategory: async (id: string) => {
        await this.prisma.category.delete({ where: { id } });
      },

      reorderCategories: async (_associationId: string, ids: string[]) => {
        await this.prisma.$transaction(
          ids.map((id: string, index: number) =>
            this.prisma.category.update({ where: { id }, data: { displayOrder: index } })
          )
        );
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createProduct: async (data: any) => {
        const product = await this.prisma.product.create({ data });
        return this.mapProductToStored(product);
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateProduct: async (id: string, patch: any) => {
        const product = await this.prisma.product.update({ where: { id }, data: patch });
        return this.mapProductToStored(product);
      },

      deleteProduct: async (id: string) => {
        await this.prisma.product.delete({ where: { id } });
      },

      reorderProducts: async (_categoryId: string, ids: string[]) => {
        await this.prisma.$transaction(
          ids.map((id: string, index: number) =>
            this.prisma.product.update({ where: { id }, data: { displayOrder: index } })
          )
        );
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      upsertTxosnaProduct: async (txosnaId: string, productId: string, data: any) => {
        const tp = await this.prisma.txosnaProduct.upsert({
          where: { txosnaId_productId: { txosnaId, productId } },
          create: { txosnaId, productId, available: true, soldOut: false, ...data },
          update: data,
        });
        return {
          txosnaId: tp.txosnaId,
          productId: tp.productId,
          available: tp.available,
          soldOut: tp.soldOut,
          priceOverride: tp.priceOverride ? Number(tp.priceOverride) : null,
          preparationInstructions: tp.preparationInstructions,
        };
      },

      deleteTxosnaProduct: async (txosnaId: string, productId: string) => {
        await this.prisma.txosnaProduct.deleteMany({ where: { txosnaId, productId } });
      },
    };
  }

  get orders(): OrderRepository {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: async (data: any) => {
        const order = await this.prisma.order.create({
          data: {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        return this.mapOrderToStored(order);
      },

      findById: async (id: string) => {
        const order = await this.prisma.order.findUnique({
          where: { id },
        });
        return order ? this.mapOrderToStored(order) : null;
      },

      findByNumber: async (txosnaId: string, orderNumber: number) => {
        const order = await this.prisma.order.findFirst({
          where: { txosnaId, orderNumber },
        });
        return order ? this.mapOrderToStored(order) : null;
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: async (id: string, patch: any) => {
        const order = await this.prisma.order.update({
          where: { id },
          data: { ...patch, updatedAt: new Date() },
        });
        return this.mapOrderToStored(order);
      },

      nextOrderNumber: async (txosnaId: string) => {
        const lastOrder = await this.prisma.order.findFirst({
          where: { txosnaId },
          orderBy: { orderNumber: 'desc' },
        });
        return (lastOrder?.orderNumber || 0) + 1;
      },

      findByPaymentSessionId: async (paymentSessionId: string) => {
        const order = await this.prisma.order.findFirst({
          where: { paymentSessionId },
        });
        return order ? this.mapOrderToStored(order) : null;
      },

      findByVerificationCode: async (verificationCode: string) => {
        const order = await this.prisma.order.findFirst({
          where: { verificationCode },
        });
        return order ? this.mapOrderToStored(order) : null;
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      listByTxosna: async (txosnaId: string, _filter?: any) => {
        const orders = await this.prisma.order.findMany({
          where: { txosnaId },
          orderBy: { createdAt: 'desc' },
        });
        return orders.map(this.mapOrderToStored.bind(this));
      },
    };
  }

  get tickets(): TicketRepository {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: async (orderId: string, txosnaId: string, data: any) => {
        const ticket = await this.prisma.ticket.create({
          data: {
            ...data,
            orderId,
            txosnaId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        return this.mapTicketToStored(ticket);
      },

      findById: async (id: string) => {
        const ticket = await this.prisma.ticket.findUnique({
          where: { id },
        });
        return ticket ? this.mapTicketToStored(ticket) : null;
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      listByTxosna: async (txosnaId: string, _filter?: any) => {
        const tickets = await this.prisma.ticket.findMany({
          where: { txosnaId },
          orderBy: { createdAt: 'desc' },
        });
        return tickets.map(this.mapTicketToStored.bind(this));
      },

      listByOrder: async (orderId: string) => {
        const tickets = await this.prisma.ticket.findMany({
          where: { orderId },
          orderBy: { createdAt: 'asc' },
        });
        return tickets.map(this.mapTicketToStored.bind(this));
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: async (id: string, patch: any) => {
        const ticket = await this.prisma.ticket.update({
          where: { id },
          data: { ...patch, updatedAt: new Date() },
        });
        return this.mapTicketToStored(ticket);
      },
    };
  }

  get volunteers(): VolunteerRepository {
    return {
      findByEmail: async (email: string) => {
        const volunteer = await this.prisma.volunteer.findUnique({
          where: { email },
        });
        return volunteer ? this.mapVolunteerToStored(volunteer) : null;
      },

      findById: async (id: string) => {
        const volunteer = await this.prisma.volunteer.findUnique({
          where: { id },
        });
        return volunteer ? this.mapVolunteerToStored(volunteer) : null;
      },

      findByResetToken: async (token: string) => {
        const volunteer = await this.prisma.volunteer.findFirst({
          where: { resetToken: token },
        });
        return volunteer ? this.mapVolunteerToStored(volunteer) : null;
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: async (data: any) => {
        const volunteer = await this.prisma.volunteer.create({
          data: {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        return this.mapVolunteerToStored(volunteer);
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: async (id: string, patch: any) => {
        const volunteer = await this.prisma.volunteer.update({
          where: { id },
          data: { ...patch, updatedAt: new Date() },
        });
        return this.mapVolunteerToStored(volunteer);
      },

      listByAssociation: async (associationId: string) => {
        const volunteers = await this.prisma.volunteer.findMany({
          where: { associationId },
          orderBy: { name: 'asc' },
        });
        return volunteers.map(this.mapVolunteerToStored.bind(this));
      },
    };
  }

  get ticketBaiConfig(): TicketBaiConfigRepository {
    return {
      findByAssociation: async (associationId: string) => {
        const config = await this.prisma.ticketBaiConfig.findUnique({
          where: { associationId },
        });
        return config ? this.mapTicketBaiConfigToStored(config) : null;
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      upsert: async (associationId: string, data: any) => {
        const config = await this.prisma.ticketBaiConfig.upsert({
          where: { associationId },
          update: { ...data, updatedAt: new Date() },
          create: { ...data, associationId, createdAt: new Date(), updatedAt: new Date() },
        });
        return this.mapTicketBaiConfigToStored(config);
      },
    };
  }

  get ticketBaiInvoices(): TicketBaiInvoiceRepository {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: async (data: any) => {
        const invoice = await this.prisma.ticketBaiInvoice.create({
          data: {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        return this.mapTicketBaiInvoiceToStored(invoice);
      },

      findById: async (id: string) => {
        const invoice = await this.prisma.ticketBaiInvoice.findUnique({
          where: { id },
        });
        return invoice ? this.mapTicketBaiInvoiceToStored(invoice) : null;
      },

      listByAssociation: async (associationId: string) => {
        const invoices = await this.prisma.ticketBaiInvoice.findMany({
          where: {
            order: {
              txosna: { associationId },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return invoices.map(this.mapTicketBaiInvoiceToStored.bind(this));
      },

      nextInvoiceNumber: async (associationId: string, series: string) => {
        const lastInvoice = await this.prisma.ticketBaiInvoice.findFirst({
          where: {
            order: {
              txosna: { associationId },
            },
            series,
          },
          orderBy: { invoiceNumber: 'desc' },
        });
        return (lastInvoice?.invoiceNumber || 0) + 1;
      },

      findByOrder: async (orderId: string) => {
        const invoice = await this.prisma.ticketBaiInvoice.findFirst({
          where: { orderId },
        });
        return invoice ? this.mapTicketBaiInvoiceToStored(invoice) : null;
      },

      getLastByAssociation: async (associationId: string) => {
        const invoice = await this.prisma.ticketBaiInvoice.findFirst({
          where: {
            order: {
              txosna: { associationId },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return invoice ? this.mapTicketBaiInvoiceToStored(invoice) : null;
      },
    };
  }

  get paymentProviders(): PaymentProviderRepository {
    return {
      listByAssociation: async (associationId: string) => {
        const providers = await this.prisma.paymentProvider.findMany({
          where: { associationId },
          orderBy: { name: 'asc' },
        });
        return providers.map(this.mapPaymentProviderToStored.bind(this));
      },

      findById: async (id: string) => {
        const provider = await this.prisma.paymentProvider.findUnique({
          where: { id },
        });
        return provider ? this.mapPaymentProviderToStored(provider) : null;
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: async (data: any) => {
        const provider = await this.prisma.paymentProvider.create({
          data: {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        return this.mapPaymentProviderToStored(provider);
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: async (id: string, patch: any) => {
        const provider = await this.prisma.paymentProvider.update({
          where: { id },
          data: { ...patch, updatedAt: new Date() },
        });
        return this.mapPaymentProviderToStored(provider);
      },

      delete: async (id: string) => {
        await this.prisma.paymentProvider.delete({
          where: { id },
        });
      },
    };
  }

  // Helper methods to map Prisma entities to stored types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapAssociationToStored(association: any): StoredAssociation {
    return {
      id: association.id,
      name: association.name,
      phone: association.phone,
      cif: association.cif,
      ticketBaiEnabled: association.ticketBaiEnabled,
      createdAt: association.createdAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapTxosnaToStored(txosna: any): StoredTxosna {
    return {
      id: txosna.id,
      slug: txosna.slug,
      name: txosna.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: txosna.status as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      counterSetup: txosna.counterSetup as any,
      kitchenPosts: txosna.kitchenPosts,
      waitMinutes: txosna.waitMinutes,
      pinHash: txosna.pinHash,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enabledChannels: txosna.enabledChannels as any[],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enabledPaymentMethods: txosna.enabledPaymentMethods as any[],
      pendingPaymentTimeout: txosna.pendingPaymentTimeout,
      printingEnabled: txosna.printingEnabled,
      mobileTrackingEnabled: txosna.mobileTrackingEnabled,
      associationId: txosna.associationId,
      createdAt: txosna.createdAt,
      updatedAt: txosna.updatedAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapCategoryToStored(category: any): any {
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      associationId: category.associationId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapProductToStored(product: any): any {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      defaultPrice: product.defaultPrice,
      categoryId: product.categoryId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      variants: product.variants || [],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapOrderToStored(order: any): any {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      verificationCode: order.verificationCode,
      cancellationReason: order.cancellationReason,
      txosnaId: order.txosnaId,
      paymentSessionId: order.paymentSessionId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapTicketToStored(ticket: any): any {
    return {
      id: ticket.id,
      status: ticket.status,
      counterType: ticket.counterType,
      orderId: ticket.orderId,
      txosnaId: ticket.txosnaId,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapVolunteerToStored(volunteer: any): any {
    return {
      id: volunteer.id,
      email: volunteer.email,
      name: volunteer.name,
      role: volunteer.role,
      associationId: volunteer.associationId,
      resetToken: volunteer.resetToken,
      resetTokenExpiresAt: volunteer.resetTokenExpiresAt,
      createdAt: volunteer.createdAt,
      updatedAt: volunteer.updatedAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapTicketBaiConfigToStored(config: any): any {
    return {
      id: config.id,
      associationId: config.associationId,
      enabled: config.enabled,
      nif: config.nif,
      iban: config.iban,
      licenseKey: config.licenseKey,
      developmentMode: config.developmentMode,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapTicketBaiInvoiceToStored(invoice: any): any {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      series: invoice.series,
      amount: invoice.amount,
      vatBreakdown: invoice.vatBreakdown || [],
      status: invoice.status,
      orderId: invoice.orderId,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapPaymentProviderToStored(provider: any): any {
    return {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      associationId: provider.associationId,
      credentials: provider.credentials,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }
}

// Factory for creating ORM storage instances
export class ORMStorageFactory {
  static async create(config: StorageConfig): Promise<ORMStorageAdapter> {
    const adapter = new ORMStorageAdapter(config);
    await adapter.initialize();
    return adapter;
  }

  static getMode(): 'orm' {
    return 'orm';
  }
}
