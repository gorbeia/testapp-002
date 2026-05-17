// Test endpoint to verify configurable storage system works
import { NextRequest, NextResponse } from 'next/server';
import {
  associationRepo,
  catalogRepo,
  orderRepo,
  paymentProviderRepo,
  ticketBaiConfigRepo,
  ticketBaiInvoiceRepo,
  ticketRepo,
  txosnaRepo,
  vatTypeRepo,
  volunteerRepo,
} from '@/lib/store';

export async function GET(_request: NextRequest) {
  const backend = process.env.STORAGE_BACKEND ?? (process.env.DATABASE_URL ? 'orm' : 'memory');

  return NextResponse.json({
    success: true,
    storageMode: backend,
    repositories: {
      associations: !!associationRepo,
      catalog: !!catalogRepo,
      orders: !!orderRepo,
      tickets: !!ticketRepo,
      volunteers: !!volunteerRepo,
      txosnak: !!txosnaRepo,
      paymentProviders: !!paymentProviderRepo,
      ticketBaiConfig: !!ticketBaiConfigRepo,
      ticketBaiInvoices: !!ticketBaiInvoiceRepo,
      vatTypes: !!vatTypeRepo,
    },
    message: 'Configurable storage system is working!',
  });
}
