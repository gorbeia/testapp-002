// Test helper: import this file in any test that touches the store.
//
// Usage:
//   import { resetMockAssociation, txosnaRepo, orderRepo } from '@/test/store-setup'
//   beforeEach(resetMockAssociation)
//
// Targeted reset functions clear only the entities they own and re-seed:
//   resetMockAssociation()  — clears mock (assoc-1) data and re-seeds it
//   resetDemoAssociation()  — clears demo (demo-assoc-1) data and re-seeds it
//   resetStore()            — clears everything without re-seeding (use when
//                             tests build the entire fixture inline)

export {
  catalogRepo,
  orderRepo,
  ticketRepo,
  txosnaRepo,
  volunteerRepo,
  resetStore,
  resetMockAssociation,
  resetDemoAssociation,
} from '@/lib/store';

export {
  _test_insertOrder,
  _test_insertProduct,
  _test_insertTxosna,
  _test_setProductAvailable,
  _test_upsertTxosnaProduct,
} from '@/lib/store/memory';
