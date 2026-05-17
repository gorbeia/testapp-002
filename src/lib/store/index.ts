// Configurable storage system.
//
// All API route handlers import repositories from here — never directly from
// memory.ts or adapters. This keeps handlers storage-agnostic and
// lets the test suite swap backends without touching handler code.
//
// STORAGE_BACKEND=memory  (default in dev and test)
// STORAGE_BACKEND=orm     (production with database)
//
// When STORAGE_BACKEND is unset, the backend is inferred:
//   - DATABASE_URL set  → orm
//   - DATABASE_URL unset → memory

import {
  associationRepo as memAssociationRepo,
  catalogRepo as memCatalogRepo,
  orderRepo as memOrderRepo,
  paymentProviderRepo as memPaymentProviderRepo,
  ticketBaiConfigRepo as memTicketBaiConfigRepo,
  ticketBaiInvoiceRepo as memTicketBaiInvoiceRepo,
  ticketRepo as memTicketRepo,
  txosnaRepo as memTxosnaRepo,
  vatTypeRepo as memVatTypeRepo,
  volunteerRepo as memVolunteerRepo,
  resetStore as resetMemoryStore,
  resetMockAssociation as resetMockAssociationMemory,
  resetDemoAssociation as resetDemoAssociationMemory,
} from './memory';

import type {
  AssociationRepository,
  CatalogRepository,
  OrderRepository,
  PaymentProviderRepository,
  TicketBaiConfigRepository,
  TicketBaiInvoiceRepository,
  TicketRepository,
  TxosnaRepository,
  VatTypeRepository,
  VolunteerRepository,
} from './types';

function resolveBackend(): 'orm' | 'memory' {
  const explicit = process.env.STORAGE_BACKEND;
  if (explicit === 'orm') return 'orm';
  if (explicit === 'memory') return 'memory';
  return process.env.DATABASE_URL ? 'orm' : 'memory';
}

function buildRepos(): {
  associationRepo: AssociationRepository;
  catalogRepo: CatalogRepository;
  orderRepo: OrderRepository;
  paymentProviderRepo: PaymentProviderRepository;
  ticketBaiConfigRepo: TicketBaiConfigRepository;
  ticketBaiInvoiceRepo: TicketBaiInvoiceRepository;
  ticketRepo: TicketRepository;
  txosnaRepo: TxosnaRepository;
  vatTypeRepo: VatTypeRepository;
  volunteerRepo: VolunteerRepository;
} {
  if (resolveBackend() === 'orm') {
    const { prisma } = require('@/lib/prisma') as { prisma: unknown };
    if (prisma) {
      const { ORMStorageAdapter } = require('./adapters/orm-adapter') as {
        ORMStorageAdapter: new (prisma: unknown) => {
          associations: AssociationRepository;
          catalog: CatalogRepository;
          orders: OrderRepository;
          paymentProviders: PaymentProviderRepository;
          ticketBaiConfig: TicketBaiConfigRepository;
          ticketBaiInvoices: TicketBaiInvoiceRepository;
          tickets: TicketRepository;
          txosnak: TxosnaRepository;
          vatTypes: VatTypeRepository;
          volunteers: VolunteerRepository;
        };
      };
      const adapter = new ORMStorageAdapter(prisma);
      return {
        associationRepo: adapter.associations,
        catalogRepo: adapter.catalog,
        orderRepo: adapter.orders,
        paymentProviderRepo: adapter.paymentProviders,
        ticketBaiConfigRepo: adapter.ticketBaiConfig,
        ticketBaiInvoiceRepo: adapter.ticketBaiInvoices,
        ticketRepo: adapter.tickets,
        txosnaRepo: adapter.txosnak,
        vatTypeRepo: adapter.vatTypes,
        volunteerRepo: adapter.volunteers,
      };
    }
  }

  return {
    associationRepo: memAssociationRepo,
    catalogRepo: memCatalogRepo,
    orderRepo: memOrderRepo,
    paymentProviderRepo: memPaymentProviderRepo,
    ticketBaiConfigRepo: memTicketBaiConfigRepo,
    ticketBaiInvoiceRepo: memTicketBaiInvoiceRepo,
    ticketRepo: memTicketRepo,
    txosnaRepo: memTxosnaRepo,
    vatTypeRepo: memVatTypeRepo,
    volunteerRepo: memVolunteerRepo,
  };
}

const _repos = buildRepos();

export const associationRepo = _repos.associationRepo;
export const catalogRepo = _repos.catalogRepo;
export const orderRepo = _repos.orderRepo;
export const paymentProviderRepo = _repos.paymentProviderRepo;
export const ticketBaiConfigRepo = _repos.ticketBaiConfigRepo;
export const ticketBaiInvoiceRepo = _repos.ticketBaiInvoiceRepo;
export const ticketRepo = _repos.ticketRepo;
export const txosnaRepo = _repos.txosnaRepo;
export const vatTypeRepo = _repos.vatTypeRepo;
export const volunteerRepo = _repos.volunteerRepo;

// Reset helpers — always operate on the memory store (used in tests/demos)
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
  CreateCategoryInput,
  CreateModifierInput,
  CreateOrderInput,
  CreateOrderLineInput,
  CreatePaymentProviderInput,
  CreateProductInput,
  CreateTicketInput,
  CreateTxosnaInput,
  CreateVariantGroupInput,
  CreateVariantOptionInput,
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
  StoredVatType,
  StoredVolunteer,
  TicketBaiConfigRepository,
  TicketBaiInvoiceLine,
  TicketBaiInvoiceRepository,
  TicketBaiInvoiceStatus,
  TicketBaiProviderType,
  TicketFilter,
  TicketRepository,
  TicketStatus,
  TxosnaRepository,
  TxosnaStatus,
  VatTypeRepository,
  VolunteerRepository,
  VolunteerRole,
} from './types';
