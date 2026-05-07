// In-memory storage adapter implementing the storage interface
// This adapter provides in-memory storage for development and testing

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
} from '../types';
import {
  associationRepo,
  catalogRepo,
  orderRepo,
  paymentProviderRepo,
  resetStore,
  seedDemoData,
  ticketBaiConfigRepo,
  ticketBaiInvoiceRepo,
  ticketRepo,
  txosnaRepo,
  volunteerRepo,
} from '../memory';

export class MemoryStorageAdapter implements StorageInterface {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Initialize with seed data
    seedDemoData();
    this.initialized = true;
  }

  async reset(): Promise<void> {
    resetStore();
  }

  async healthCheck(): Promise<boolean> {
    return this.initialized;
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    // In-memory storage doesn't need real transactions
    // Just execute the function
    return await fn();
  }

  // Repository getters
  get associations(): AssociationRepository {
    return associationRepo;
  }

  get txosnak(): TxosnaRepository {
    return txosnaRepo;
  }

  get catalog(): CatalogRepository {
    return catalogRepo;
  }

  get orders(): OrderRepository {
    return orderRepo;
  }

  get tickets(): TicketRepository {
    return ticketRepo;
  }

  get volunteers(): VolunteerRepository {
    return volunteerRepo;
  }

  get ticketBaiConfig(): TicketBaiConfigRepository {
    return ticketBaiConfigRepo;
  }

  get ticketBaiInvoices(): TicketBaiInvoiceRepository {
    return ticketBaiInvoiceRepo;
  }

  get paymentProviders(): PaymentProviderRepository {
    return paymentProviderRepo;
  }
}

// Factory for creating memory storage instances
export class MemoryStorageFactory {
  static async create(_config: StorageConfig): Promise<MemoryStorageAdapter> {
    const adapter = new MemoryStorageAdapter();
    await adapter.initialize();
    return adapter;
  }

  static getMode(): 'memory' {
    return 'memory';
  }
}
