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
let PrismaClient: any;
try {
  PrismaClient = require('@prisma/client').PrismaClient;
} catch (error) {
  console.warn('Prisma client not available, ORM adapter will not work');
}

export class ORMStorageAdapter implements StorageInterface {
  private prisma: any;
  private initialized = false;

  constructor(config: StorageConfig) {
    if (!PrismaClient) {
      throw new Error('Prisma client not available. Cannot initialize ORM storage adapter.');
    }
    
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.ormConfig?.databaseUrl || (typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined),
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

  // Repository getters would be implemented here
  // For now, I'll create stub implementations
  
  get associations(): AssociationRepository {
    const self = this;
    return {
      async create(name: string): Promise<StoredAssociation> {
        const association = await self.prisma.association.create({
          data: { name },
        });
        return self.mapAssociationToStored(association);
      },
      
      async findById(id: string): Promise<StoredAssociation | null> {
        const association = await self.prisma.association.findUnique({
          where: { id },
        });
        return association ? self.mapAssociationToStored(association) : null;
      },
      
      async findByName(query: string): Promise<StoredAssociation | null> {
        const association = await self.prisma.association.findFirst({
          where: { name: { contains: query, mode: 'insensitive' } },
        });
        return association ? self.mapAssociationToStored(association) : null;
      },
      
      async update(id: string, patch: Partial<Omit<StoredAssociation, 'id' | 'createdAt'>>): Promise<StoredAssociation> {
        const association = await self.prisma.association.update({
          where: { id },
          data: patch,
        });
        return self.mapAssociationToStored(association);
      },
    };
  }

  get txosnak(): TxosnaRepository {
    const self = this;
    return {
      async findBySlug(slug: string): Promise<StoredTxosna | null> {
        const txosna = await self.prisma.txosna.findUnique({
          where: { slug },
        });
        return txosna ? self.mapTxosnaToStored(txosna) : null;
      },
      
      async findById(id: string): Promise<StoredTxosna | null> {
        const txosna = await self.prisma.txosna.findUnique({
          where: { id },
        });
        return txosna ? self.mapTxosnaToStored(txosna) : null;
      },
      
      async list(associationId: string): Promise<StoredTxosna[]> {
        const txosnak = await self.prisma.txosna.findMany({
          where: { associationId },
        });
        return txosnak.map((t) => self.mapTxosnaToStored(t));
      },
      
      async create(data: CreateTxosnaInput): Promise<StoredTxosna> {
        const txosna = await self.prisma.txosna.create({
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
        return self.mapTxosnaToStored(txosna);
      },
      
      async update(id: string, patch: Partial<Omit<StoredTxosna, 'id' | 'createdAt'>>): Promise<StoredTxosna> {
        const txosna = await self.prisma.txosna.update({
          where: { id },
          data: patch,
        });
        return self.mapTxosnaToStored(txosna);
      },
    };
  }

  get catalog(): CatalogRepository {
    const self = this;
    return {
      async listCategories(associationId: string) {
        const categories = await self.prisma.category.findMany({
          where: { associationId },
          orderBy: { name: 'asc' },
        });
        return categories.map(self.mapCategoryToStored.bind(self));
      },

      async listProducts(categoryId: string) {
        const products = await self.prisma.product.findMany({
          where: { categoryId },
          include: {
            variants: {
              include: { options: true },
            },
          },
          orderBy: { name: 'asc' },
        });
        return products.map(self.mapProductToStored.bind(self));
      },

      async getProduct(productId: string) {
        const product = await self.prisma.product.findUnique({
          where: { id: productId },
          include: {
            variants: {
              include: { options: true },
            },
          },
        });
        return product ? self.mapProductToStored(product) : null;
      },

      async getProductView(productId: string, _txosnaId: string) {
        const product = await self.prisma.product.findUnique({
          where: { id: productId },
          include: {
            variants: {
              include: { options: true },
            },
          },
        });
        return product ? self.mapProductToStored(product) : null;
      },

      async listProductViews(txosnaId: string) {
        const categories = await self.prisma.category.findMany({
          where: { 
            txosna: { some: { id: txosnaId } }
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
        return categories.map((cat: any) => ({
          category: self.mapCategoryToStored(cat),
          products: cat.products.map(self.mapProductToStored.bind(self)),
        }));
      },
    };
  }

  get orders(): OrderRepository {
    const self = this;
    return {
      async create(data: any) {
        const order = await self.prisma.order.create({
          data: {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        return self.mapOrderToStored(order);
      },

      async findById(id: string) {
        const order = await self.prisma.order.findUnique({
          where: { id },
        });
        return order ? self.mapOrderToStored(order) : null;
      },

      async findByNumber(txosnaId: string, orderNumber: number) {
        const order = await self.prisma.order.findFirst({
          where: { txosnaId, orderNumber },
        });
        return order ? self.mapOrderToStored(order) : null;
      },

      async update(id: string, patch: any) {
        const order = await self.prisma.order.update({
          where: { id },
          data: { ...patch, updatedAt: new Date() },
        });
        return self.mapOrderToStored(order);
      },

      async nextOrderNumber(txosnaId: string) {
        const lastOrder = await self.prisma.order.findFirst({
          where: { txosnaId },
          orderBy: { orderNumber: 'desc' },
        });
        return (lastOrder?.orderNumber || 0) + 1;
      },

      async findByPaymentSessionId(paymentSessionId: string) {
        const order = await self.prisma.order.findFirst({
          where: { paymentSessionId },
        });
        return order ? self.mapOrderToStored(order) : null;
      },

      async findByVerificationCode(verificationCode: string) {
        const order = await self.prisma.order.findFirst({
          where: { verificationCode },
        });
        return order ? self.mapOrderToStored(order) : null;
      },

      async listByTxosna(txosnaId: string, _filter?: any) {
        const orders = await self.prisma.order.findMany({
          where: { txosnaId },
          orderBy: { createdAt: 'desc' },
        });
        return orders.map(self.mapOrderToStored.bind(self));
      },
    };
  }

  get tickets(): TicketRepository {
    const self = this;
    return {
      async create(orderId: string, txosnaId: string, data: any) {
        const ticket = await self.prisma.ticket.create({
          data: {
            ...data,
            orderId,
            txosnaId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        return self.mapTicketToStored(ticket);
      },

      async findById(id: string) {
        const ticket = await self.prisma.ticket.findUnique({
          where: { id },
        });
        return ticket ? self.mapTicketToStored(ticket) : null;
      },

      async listByTxosna(txosnaId: string, _filter?: any) {
        const tickets = await self.prisma.ticket.findMany({
          where: { txosnaId },
          orderBy: { createdAt: 'desc' },
        });
        return tickets.map(self.mapTicketToStored.bind(self));
      },

      async listByOrder(orderId: string) {
        const tickets = await self.prisma.ticket.findMany({
          where: { orderId },
          orderBy: { createdAt: 'asc' },
        });
        return tickets.map(self.mapTicketToStored.bind(self));
      },

      async update(id: string, patch: any) {
        const ticket = await self.prisma.ticket.update({
          where: { id },
          data: { ...patch, updatedAt: new Date() },
        });
        return self.mapTicketToStored(ticket);
      },
    };
  }

  get volunteers(): VolunteerRepository {
    const self = this;
    return {
      async findByEmail(email: string) {
        const volunteer = await self.prisma.volunteer.findUnique({
          where: { email },
        });
        return volunteer ? self.mapVolunteerToStored(volunteer) : null;
      },

      async findById(id: string) {
        const volunteer = await self.prisma.volunteer.findUnique({
          where: { id },
        });
        return volunteer ? self.mapVolunteerToStored(volunteer) : null;
      },

      async findByResetToken(token: string) {
        const volunteer = await self.prisma.volunteer.findFirst({
          where: { resetToken: token },
        });
        return volunteer ? self.mapVolunteerToStored(volunteer) : null;
      },

      async create(data: any) {
        const volunteer = await self.prisma.volunteer.create({
          data: {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        return self.mapVolunteerToStored(volunteer);
      },

      async update(id: string, patch: any) {
        const volunteer = await self.prisma.volunteer.update({
          where: { id },
          data: { ...patch, updatedAt: new Date() },
        });
        return self.mapVolunteerToStored(volunteer);
      },

      async listByAssociation(associationId: string) {
        const volunteers = await self.prisma.volunteer.findMany({
          where: { associationId },
          orderBy: { name: 'asc' },
        });
        return volunteers.map(self.mapVolunteerToStored.bind(self));
      },
    };
  }

  get ticketBaiConfig(): TicketBaiConfigRepository {
    const self = this;
    return {
      async findByAssociation(associationId: string) {
        const config = await self.prisma.ticketBaiConfig.findUnique({
          where: { associationId },
        });
        return config ? self.mapTicketBaiConfigToStored(config) : null;
      },

      async upsert(associationId: string, data: any) {
        const config = await self.prisma.ticketBaiConfig.upsert({
          where: { associationId },
          update: { ...data, updatedAt: new Date() },
          create: { ...data, associationId, createdAt: new Date(), updatedAt: new Date() },
        });
        return self.mapTicketBaiConfigToStored(config);
      },
    };
  }

  get ticketBaiInvoices(): TicketBaiInvoiceRepository {
    const self = this;
    return {
      async create(data: any) {
        const invoice = await self.prisma.ticketBaiInvoice.create({
          data: {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        return self.mapTicketBaiInvoiceToStored(invoice);
      },

      async findById(id: string) {
        const invoice = await self.prisma.ticketBaiInvoice.findUnique({
          where: { id },
        });
        return invoice ? self.mapTicketBaiInvoiceToStored(invoice) : null;
      },

      async listByAssociation(associationId: string) {
        const invoices = await self.prisma.ticketBaiInvoice.findMany({
          where: { 
            order: {
              txosna: { associationId }
            }
          },
          orderBy: { createdAt: 'desc' },
        });
        return invoices.map(self.mapTicketBaiInvoiceToStored.bind(self));
      },

      async nextInvoiceNumber(associationId: string, series: string) {
        const lastInvoice = await self.prisma.ticketBaiInvoice.findFirst({
          where: { 
            order: {
              txosna: { associationId }
            },
            series,
          },
          orderBy: { invoiceNumber: 'desc' },
        });
        return (lastInvoice?.invoiceNumber || 0) + 1;
      },

      async findByOrder(orderId: string) {
        const invoice = await self.prisma.ticketBaiInvoice.findFirst({
          where: { orderId },
        });
        return invoice ? self.mapTicketBaiInvoiceToStored(invoice) : null;
      },

      async getLastByAssociation(associationId: string) {
        const invoice = await self.prisma.ticketBaiInvoice.findFirst({
          where: { 
            order: {
              txosna: { associationId }
            }
          },
          orderBy: { createdAt: 'desc' },
        });
        return invoice ? self.mapTicketBaiInvoiceToStored(invoice) : null;
      },
    };
  }

  get paymentProviders(): PaymentProviderRepository {
    const self = this;
    return {
      async listByAssociation(associationId: string) {
        const providers = await self.prisma.paymentProvider.findMany({
          where: { associationId },
          orderBy: { name: 'asc' },
        });
        return providers.map(self.mapPaymentProviderToStored.bind(self));
      },

      async findById(id: string) {
        const provider = await self.prisma.paymentProvider.findUnique({
          where: { id },
        });
        return provider ? self.mapPaymentProviderToStored(provider) : null;
      },

      async create(data: any) {
        const provider = await self.prisma.paymentProvider.create({
          data: {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        return self.mapPaymentProviderToStored(provider);
      },

      async update(id: string, patch: any) {
        const provider = await self.prisma.paymentProvider.update({
          where: { id },
          data: { ...patch, updatedAt: new Date() },
        });
        return self.mapPaymentProviderToStored(provider);
      },

      async delete(id: string) {
        await self.prisma.paymentProvider.delete({
          where: { id },
        });
      },
    };
  }

  // Helper methods to map Prisma entities to stored types
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

  private mapTxosnaToStored(txosna: any): StoredTxosna {
    return {
      id: txosna.id,
      slug: txosna.slug,
      name: txosna.name,
      status: txosna.status as any,
      counterSetup: txosna.counterSetup as any,
      kitchenPosts: txosna.kitchenPosts,
      waitMinutes: txosna.waitMinutes,
      pinHash: txosna.pinHash,
      enabledChannels: txosna.enabledChannels as any[],
      enabledPaymentMethods: txosna.enabledPaymentMethods as any[],
      pendingPaymentTimeout: txosna.pendingPaymentTimeout,
      printingEnabled: txosna.printingEnabled,
      mobileTrackingEnabled: txosna.mobileTrackingEnabled,
      associationId: txosna.associationId,
      createdAt: txosna.createdAt,
      updatedAt: txosna.updatedAt,
    };
  }

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
