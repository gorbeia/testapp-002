// Test endpoint to verify configurable storage system works
import { NextRequest, NextResponse } from 'next/server';
import { getStorageManager, DEFAULT_STORAGE_CONFIG } from '@/lib/store/storage-manager';

export async function GET(_request: NextRequest) {
  try {
    const manager = getStorageManager();
    
    // Initialize if not already done
    if (!manager.currentMode) {
      await manager.initialize(DEFAULT_STORAGE_CONFIG);
    }
    
    manager.getStorage();
    const repos = manager.repositories;
    
    // Test basic operations
    const healthCheck = await manager.healthCheck();
    
    return NextResponse.json({
      success: true,
      storageMode: manager.currentMode,
      healthCheck,
      repositories: {
        associations: !!repos.associations,
        catalog: !!repos.catalog,
        orders: !!repos.orders,
        tickets: !!repos.tickets,
        volunteers: !!repos.volunteers,
        txosnak: !!repos.txosnak,
        paymentProviders: !!repos.paymentProviders,
        ticketBaiConfig: !!repos.ticketBaiConfig,
        ticketBaiInvoices: !!repos.ticketBaiInvoices,
      },
      message: 'Configurable storage system is working!',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
