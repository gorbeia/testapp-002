// Storage backend selector.
//
// All API route handlers import repositories from here — never directly from
// memory.ts or a future prisma.ts. This keeps handlers storage-agnostic and
// lets the test suite swap backends without touching handler code.
//
// STORAGE_BACKEND=memory  (default in dev and test)
// STORAGE_BACKEND=prisma  (Phase 10 — not yet implemented)

import {
  associationRepo,
  catalogRepo,
  orderRepo,
  paymentProviderRepo,
  resetDemoAssociation,
  resetStore,
  ticketRepo,
  txosnaRepo,
  volunteerRepo,
} from './memory';

export {
  associationRepo,
  catalogRepo,
  orderRepo,
  paymentProviderRepo,
  resetDemoAssociation,
  resetStore,
  ticketRepo,
  txosnaRepo,
  volunteerRepo,
};

export type {
  AssociationRepository,
  CancellationReason,
  CatalogRepository,
  CategoryType,
  CounterSetup,
  CounterType,
  CreateOrderInput,
  CreateOrderLineInput,
  CreatePaymentProviderInput,
  CreateTicketInput,
  CreateTxosnaInput,
  CreateVolunteerInput,
  OrderFilter,
  OrderRepository,
  OrderingChannel,
  OrderStatus,
  PaymentMethod,
  PaymentProviderRepository,
  PaymentProviderType,
  StoredAssociation,
  StoredCategory,
  StoredModifier,
  StoredOrder,
  StoredOrderLine,
  StoredPaymentProvider,
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
