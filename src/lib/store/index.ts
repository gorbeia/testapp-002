// Configurable storage system.
//
// All API route handlers import repositories from here — never directly from
// memory.ts or adapters. This keeps handlers storage-agnostic and
// lets test suite swap backends without touching handler code.
//
// STORAGE_MODE=memory  (default in dev and test)
// STORAGE_MODE=orm     (production with database)

import {
  associationRepo,
  catalogRepo,
  orderRepo,
  paymentProviderRepo,
  resetStore as resetMemoryStore,
  resetMockAssociation as resetMockAssociationMemory,
  resetDemoAssociation as resetDemoAssociationMemory,
  ticketBaiConfigRepo,
  ticketBaiInvoiceRepo,
  ticketRepo,
  txosnaRepo,
  volunteerRepo,
} from './memory';

// Export memory repositories directly for immediate use
// This ensures tests work without waiting for async initialization
export {
  associationRepo,
  catalogRepo,
  orderRepo,
  paymentProviderRepo,
  ticketBaiConfigRepo,
  ticketBaiInvoiceRepo,
  ticketRepo,
  txosnaRepo,
  volunteerRepo,
};

export const resetStore = () => {
  resetMemoryStore();
};

export const resetMockAssociation = () => {
  resetMockAssociationMemory();
};

export const resetDemoAssociation = () => {
  resetDemoAssociationMemory();
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
  StoredTicketBaiConfig,
  StoredTicketBaiInvoice,
  StoredTxosna,
  StoredTxosnaProduct,
  StoredVariantGroup,
  StoredVariantOption,
  StoredVolunteer,
  TicketBaiConfigRepository,
  TicketBaiInvoiceLine,
  TicketBaiInvoiceRepository,
  TicketBaiInvoiceStatus,
  TicketBaiProviderType,
  TicketBaiVatBreakdown,
  TicketFilter,
  TicketRepository,
  TicketStatus,
  TxosnaRepository,
  TxosnaStatus,
  VolunteerRepository,
  VolunteerRole,
} from './types';
