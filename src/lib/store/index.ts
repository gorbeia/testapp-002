// Storage backend selector.
//
// All API route handlers import repositories from here — never directly from
// memory.ts or a future prisma.ts. This keeps handlers storage-agnostic and
// lets the test suite swap backends without touching handler code.
//
// STORAGE_BACKEND=memory  (default in dev and test)
// STORAGE_BACKEND=prisma  (Phase 10 — not yet implemented)

import {
  catalogRepo,
  orderRepo,
  resetDemoAssociation,
  resetStore,
  ticketRepo,
  txosnaRepo,
  volunteerRepo,
} from './memory';

export {
  catalogRepo,
  orderRepo,
  resetDemoAssociation,
  resetStore,
  ticketRepo,
  txosnaRepo,
  volunteerRepo,
};

export type {
  CancellationReason,
  CatalogRepository,
  CategoryType,
  CounterSetup,
  CounterType,
  CreateOrderInput,
  CreateOrderLineInput,
  CreateTicketInput,
  CreateVolunteerInput,
  OrderFilter,
  OrderRepository,
  OrderingChannel,
  OrderStatus,
  PaymentMethod,
  StoredAssociation,
  StoredCategory,
  StoredModifier,
  StoredOrder,
  StoredOrderLine,
  StoredProduct,
  StoredProductView,
  StoredTicket,
  StoredTxosna,
  StoredTxosnaProduct,
  StoredVariantGroup,
  StoredVariantOption,
  StoredVolunteer,
  TicketFilter,
  TicketRepository,
  TicketStatus,
  TxosnaRepository,
  TxosnaStatus,
  VolunteerRepository,
  VolunteerRole,
} from './types';
