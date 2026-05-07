// Test helper: import this file in any test that touches the store.
//
// Usage:
//   import { resetStore, txosnaRepo, orderRepo } from '@/test/store-setup'
//   beforeEach(resetStore)
//
// resetStore() clears all maps and re-seeds from mock data, so each test
// starts from a known state regardless of what previous tests did.

import { initializeStorage, DEFAULT_STORAGE_CONFIG } from '@/lib/store/storage-manager';

// Initialize storage for tests
initializeStorage(DEFAULT_STORAGE_CONFIG).catch((error) => {
  console.error('Failed to initialize storage for tests:', error);
});

export {
  catalogRepo,
  orderRepo,
  resetStore,
  ticketRepo,
  txosnaRepo,
  volunteerRepo,
} from '@/lib/store';

export { seedMockData, seedDemoData } from '@/lib/store/memory';

export {
  _test_insertOrder,
  _test_insertProduct,
  _test_insertTxosna,
  _test_setProductAvailable,
  _test_upsertTxosnaProduct,
} from '@/lib/store/memory';
