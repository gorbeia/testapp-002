// Test helper: import this file in any test that touches the store.
//
// Usage:
//   import { resetStore, txosnaRepo, orderRepo } from '@/test/store-setup'
//   beforeEach(resetStore)
//
// resetStore() clears all maps and re-seeds from mock data, so each test
// starts from a known state regardless of what previous tests did.

export {
  catalogRepo,
  orderRepo,
  resetStore,
  ticketRepo,
  txosnaRepo,
  volunteerRepo,
} from '@/lib/store';
