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

  // Stub implementations for other repositories
  // These would be fully implemented in a real scenario
  get catalog(): CatalogRepository {
    throw new Error('Catalog repository not yet implemented in ORM adapter');
  }

  get orders(): OrderRepository {
    throw new Error('Order repository not yet implemented in ORM adapter');
  }

  get tickets(): TicketRepository {
    throw new Error('Ticket repository not yet implemented in ORM adapter');
  }

  get volunteers(): VolunteerRepository {
    throw new Error('Volunteer repository not yet implemented in ORM adapter');
  }

  get ticketBaiConfig(): TicketBaiConfigRepository {
    throw new Error('TicketBai config repository not yet implemented in ORM adapter');
  }

  get ticketBaiInvoices(): TicketBaiInvoiceRepository {
    throw new Error('TicketBai invoices repository not yet implemented in ORM adapter');
  }

  get paymentProviders(): PaymentProviderRepository {
    throw new Error('Payment providers repository not yet implemented in ORM adapter');
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
