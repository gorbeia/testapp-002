// Test helper: import this file in any test that touches the store.
//
// Usage:
//   import { resetStore, txosnaRepo, orderRepo } from '@/test/store-setup'
//   beforeEach(resetStore)
//
// resetStore() clears all maps and re-seeds from mock data, so each test
// starts from a known state regardless of what previous tests did.

import { initializeStorage, DEFAULT_STORAGE_CONFIG, getStorageManager } from '@/lib/store/storage-manager';

// Initialize storage for tests
let storageInitialized = false;
const initPromise = initializeStorage(DEFAULT_STORAGE_CONFIG).then(() => {
  storageInitialized = true;
}).catch((error) => {
  console.error('Failed to initialize storage for tests:', error);
});

// Function to get repositories with initialization check
function getRepository(prop: string) {
  if (!storageInitialized) {
    throw new Error('Storage not initialized. Call initialize() first.');
  }
  const repos = getStorageManager().repositories;
  return repos[prop as keyof typeof repos];
}

// Export repositories with initialization check
export const catalogRepo = {
  get: (prop: string) => getRepository(prop)
};

export const orderRepo = {
  get: (prop: string) => getRepository(prop)
};

export const ticketRepo = {
  get: (prop: string) => getRepository(prop)
};

export const txosnaRepo = {
  get: (prop: string) => getRepository(prop)
};

export const volunteerRepo = {
  get: (prop: string) => getRepository(prop)
};

export { resetStore } from '@/lib/store';
export { seedMockData, seedDemoData } from '@/lib/store/memory';

export {
  _test_insertOrder,
  _test_insertProduct,
  _test_insertTxosna,
  _test_setProductAvailable,
  _test_upsertTxosnaProduct,
} from '@/lib/store/memory';

// Export initialization promise for tests that need to wait
export { initPromise };
