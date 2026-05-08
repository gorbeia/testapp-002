// Storage manager that handles configuration and switching between storage modes
// This provides a unified interface for accessing storage regardless of the underlying implementation

import {
  StorageInterface,
  StorageManager as IStorageManager,
  StorageConfig,
  StorageMode,
} from './storage-interface';
import { MemoryStorageFactory } from './adapters/memory-adapter';
import { ORMStorageFactory } from './adapters/orm-adapter';

/**
 * Storage manager implementation that handles switching between memory and ORM storage
 */
export class StorageManager implements IStorageManager {
  private currentStorage: StorageInterface | null = null;
  public currentMode: StorageMode = 'memory';
  private config: StorageConfig | null = null;

  async initialize(config: StorageConfig): Promise<void> {
    this.config = config;
    await this.switchMode(config.mode, config);
  }

  async switchMode(mode: StorageMode, config?: Partial<StorageConfig>): Promise<void> {
    // Clean up current storage if it exists
    if (this.currentStorage) {
      try {
        // Note: We don't call reset() here as that would clear data
        // We just let the old storage be garbage collected
        this.currentStorage = null;
      } catch (error) {
        console.warn('Error cleaning up previous storage:', error);
      }
    }

    // Merge new config with existing config
    const newConfig: StorageConfig = {
      ...this.config,
      mode,
      ...config,
    };

    // Create new storage instance based on mode
    switch (mode) {
      case 'memory':
        this.currentStorage = await MemoryStorageFactory.create(newConfig);
        break;
      case 'orm':
        this.currentStorage = await ORMStorageFactory.create(newConfig);
        break;
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
    if (!this.currentStorage) {
      return false;
    }
    return await this.currentStorage.healthCheck();
  }

  /**
   * Get repository accessors for the current storage implementation
   */
  get repositories() {
    const storage = this.getStorage();

    // Type assertion to access repository getters
    const adapter = storage as any;

    return {
      associations: adapter.associations,
      txosnak: adapter.txosnak,
      catalog: adapter.catalog,
      orders: adapter.orders,
      tickets: adapter.tickets,
      volunteers: adapter.volunteers,
      ticketBaiConfig: adapter.ticketBaiConfig,
      ticketBaiInvoices: adapter.ticketBaiInvoices,
      paymentProviders: adapter.paymentProviders,
    };
  }
}

// Global storage manager instance
let globalStorageManager: StorageManager | null = null;

/**
 * Get the global storage manager instance
 */
export function getStorageManager(): StorageManager {
  if (!globalStorageManager) {
    globalStorageManager = new StorageManager();
  }
  return globalStorageManager;
}

/**
 * Initialize the global storage manager with configuration
 */
export async function initializeStorage(config: StorageConfig): Promise<StorageManager> {
  const manager = getStorageManager();
  await manager.initialize(config);
  return manager;
}

/**
 * Get the current storage instance (convenience function)
 */
export function getStorage(): StorageInterface {
  return getStorageManager().getStorage();
}

/**
 * Get repository accessors (convenience function)
 */
export function getRepositories() {
  return getStorageManager().repositories;
}

/**
 * Default storage configuration
 */
export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  mode: (process.env.STORAGE_MODE as StorageMode) || 'memory',
  ormConfig: {
    databaseUrl: process.env.DATABASE_URL,
  },
};
