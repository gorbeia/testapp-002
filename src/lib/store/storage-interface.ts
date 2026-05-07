// Storage interface that supports both in-memory and ORM implementations
// This provides a unified contract that can be satisfied by different storage backends

export type StorageMode = 'memory' | 'orm';

export interface StorageConfig {
  mode: StorageMode;
  // Add any configuration options specific to storage modes
  ormConfig?: {
    databaseUrl?: string;
    // Additional ORM-specific options
  };
}

/**
 * Base storage interface that all storage implementations must follow
 * This provides a contract for switching between in-memory and ORM storage
 */
export interface StorageInterface {
  // Lifecycle methods
  initialize(): Promise<void>;
  reset(): Promise<void>;
  healthCheck(): Promise<boolean>;
  
  // Transaction support (optional for in-memory)
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}

/**
 * Factory interface for creating storage instances
 */
export interface StorageFactory {
  create(config: StorageConfig): Promise<StorageInterface>;
  getMode(): StorageMode;
}

/**
 * Storage manager interface for handling configuration and switching
 */
export interface StorageManager {
  currentMode: StorageMode;
  initialize(config: StorageConfig): Promise<void>;
  switchMode(mode: StorageMode, config?: Partial<StorageConfig>): Promise<void>;
  getStorage(): StorageInterface;
  healthCheck(): Promise<boolean>;
}
