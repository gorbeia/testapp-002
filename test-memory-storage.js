// Simple test to verify memory storage adapter works directly
// This bypasses the storage manager and tests the adapter directly

const { MemoryStorageAdapter } = require('./src/lib/store/adapters/memory-adapter.ts');

async function testMemoryStorage() {
  try {
    console.log('Testing memory storage adapter...');
    
    // Create and initialize memory adapter
    const adapter = new MemoryStorageAdapter();
    await adapter.initialize();
    
    console.log('✓ Memory adapter initialized');
    
    // Test health check
    const isHealthy = await adapter.healthCheck();
    console.log('✓ Health check:', isHealthy);
    
    // Test repository access
    const associations = adapter.associations;
    const catalog = adapter.catalog;
    console.log('✓ Repositories accessible');
    
    // Test basic operation
    const allAssociations = await associations.listByAssociation('test-association');
    console.log('✓ Basic repository operation works');
    
    console.log('✅ Memory storage adapter test passed!');
    return true;
  } catch (error) {
    console.error('❌ Memory storage test failed:', error.message);
    return false;
  }
}

testMemoryStorage().then(success => {
  process.exit(success ? 0 : 1);
});
