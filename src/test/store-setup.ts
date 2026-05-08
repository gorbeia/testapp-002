// Test helper: import this file in any test that touches the store.
//
// Usage:
//   import { resetStore, txosnaRepo, orderRepo } from '@/test/store-setup'
//   beforeEach(resetStore)
//
// resetStore() clears all maps and re-seeds from mock data, so each test
// starts from a known state regardless of what previous tests did.

// Re-export from main store (which now handles lazy loading)
export {
  catalogRepo,
  orderRepo,
  ticketRepo,
  txosnaRepo,
  volunteerRepo,
  resetStore,
} from '@/lib/store';

export { seedMockData, seedDemoData } from '@/lib/store/memory';

export {
  _test_insertOrder,
  _test_insertProduct,
  _test_insertTxosna,
  _test_setProductAvailable,
  _test_upsertTxosnaProduct,
} from '@/lib/store/memory';
