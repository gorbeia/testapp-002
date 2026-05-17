// Storage manager — kept for backwards compatibility.
// New code should import repositories directly from '@/lib/store'.

import {
  StorageInterface,
  StorageManager as IStorageManager,
  StorageConfig,
  StorageMode,
} from './storage-interface';
import { MemoryStorageFactory } from './adapters/memory-adapter';

export class StorageManager implements IStorageManager {
  private currentStorage: StorageInterface | null = null;
  public currentMode: StorageMode = 'memory';
  private config: StorageConfig | null = null;

  async initialize(config: StorageConfig): Promise<void> {
    this.config = config;
    await this.switchMode(config.mode, config);
  }

  async switchMode(mode: StorageMode, config?: Partial<StorageConfig>): Promise<void> {
    this.currentStorage = null;

    const newConfig: StorageConfig = {
      ...this.config,
      mode,
      ...config,
    };

    switch (mode) {
      case 'memory':
        this.currentStorage = await MemoryStorageFactory.create(newConfig);
        break;
      case 'orm': {
        const { prisma } = require('@/lib/prisma') as { prisma: unknown };
        if (!prisma) throw new Error('DATABASE_URL is required for ORM storage mode');
        const { ORMStorageAdapter } = require('./adapters/orm-adapter') as {
          ORMStorageAdapter: new (p: unknown) => StorageInterface & Record<string, unknown>;
        };
        this.currentStorage = new ORMStorageAdapter(prisma);
        break;
      }
      default:
        throw new Error(`Unsupported storage mode: ${mode}`);
    }

    this.currentMode = mode;
    this.config = newConfig;
  }

  getStorage(): StorageInterface {
    if (!this.currentStorage) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }
    return this.currentStorage;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.currentStorage) return false;
    return this.currentStorage.healthCheck();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get repositories(): Record<string, any> {
    const storage = this.getStorage() as unknown as Record<string, unknown>;
    return {
      associations: storage['associations'],
      txosnak: storage['txosnak'],
      catalog: storage['catalog'],
      orders: storage['orders'],
      tickets: storage['tickets'],
      volunteers: storage['volunteers'],
      ticketBaiConfig: storage['ticketBaiConfig'],
      ticketBaiInvoices: storage['ticketBaiInvoices'],
      paymentProviders: storage['paymentProviders'],
    };
  }
}

let globalStorageManager: StorageManager | null = null;

export function getStorageManager(): StorageManager {
  if (!globalStorageManager) {
    globalStorageManager = new StorageManager();
  }
  return globalStorageManager;
}

export async function initializeStorage(config: StorageConfig): Promise<StorageManager> {
  const manager = getStorageManager();
  await manager.initialize(config);
  return manager;
}

export function getStorage(): StorageInterface {
  return getStorageManager().getStorage();
}

export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  mode: (process.env.STORAGE_BACKEND as StorageMode) || 'memory',
  ormConfig: {
    databaseUrl: process.env.DATABASE_URL,
  },
};
