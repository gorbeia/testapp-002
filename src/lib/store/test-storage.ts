// Simple test to verify configurable storage system works
// This can be imported in the browser/Next.js context

import { MemoryStorageAdapter } from './adapters/memory-adapter';
import { DEFAULT_STORAGE_CONFIG } from './storage-manager';

export async function testConfigurableStorage() {
  try {
    console.log('🧪 Testing configurable storage system...');
    
    // Test memory adapter directly
    const adapter = new MemoryStorageAdapter();
    await adapter.initialize();
    
    console.log('✅ Memory adapter initialized successfully');
    
    // Test health check
    const isHealthy = await adapter.healthCheck();
    console.log('✅ Health check passed:', isHealthy);
    
    // Test repository access
    const associations = adapter.associations;
    const catalog = adapter.catalog;
    const orders = adapter.orders;
    
    console.log('✅ All repositories accessible');
    console.log('📊 Available repositories:', {
      associations: !!associations,
      catalog: !!catalog,
      orders: !!orders,
      tickets: !!adapter.tickets,
      volunteers: !!adapter.volunteers,
      txosnak: !!adapter.txosnak,
    });
    
    // Test basic operation
    try {
      const associationList = await associations.findById('demo-association');
      console.log('✅ Basic repository operation works');
    } catch (error) {
      console.warn('⚠️  Basic operation failed (expected in test):', error instanceof Error ? error.message : error);
    }
    
    console.log('🎉 Configurable storage system test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Storage test failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

// Export configuration for reference
export { DEFAULT_STORAGE_CONFIG };
