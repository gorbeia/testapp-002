// Configurable storage system.
//
// All API route handlers import repositories from here — never directly from
// memory.ts or adapters. This keeps handlers storage-agnostic and
// lets test suite swap backends without touching handler code.
//
// STORAGE_MODE=memory  (default in dev and test)
// STORAGE_MODE=orm     (production with database)

import { getRepositories, initializeStorage, DEFAULT_STORAGE_CONFIG } from './storage-manager';
import { resetStore as resetMemoryStore } from './memory';

// Initialize storage with default configuration
const repositories = getRepositories();

// Initialize storage asynchronously
initializeStorage(DEFAULT_STORAGE_CONFIG).catch((error) => {
  console.error('Failed to initialize storage:', error);
});

// Export repositories from the current storage backend
export const associationRepo = repositories.associations;
export const catalogRepo = repositories.catalog;
export const orderRepo = repositories.orders;
export const paymentProviderRepo = repositories.paymentProviders;
export const ticketBaiConfigRepo = repositories.ticketBaiConfig;
export const ticketBaiInvoiceRepo = repositories.ticketBaiInvoices;
export const ticketRepo = repositories.tickets;
export const txosnaRepo = repositories.txosnak;
export const volunteerRepo = repositories.volunteers;

// For backward compatibility, export reset functions
export const resetStore = () => {
  // Only reset memory store for now
  // ORM storage reset would need different implementation
  resetMemoryStore();
};

export const resetDemoAssociation = () => {
  // This would need to be implemented for both storage types
  console.warn('resetDemoAssociation not yet implemented for configurable storage');
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
