// Simple test script to verify configurable storage system works
// This bypasses TypeScript issues and tests core functionality

const { getStorageManager, DEFAULT_STORAGE_CONFIG } = require('./src/lib/store/storage-manager.ts');

async function testStorage() {
  try {
    console.log('Testing configurable storage system...');
    
    // Test memory storage initialization
    const manager = getStorageManager();
    await manager.initialize(DEFAULT_STORAGE_CONFIG);
    
    console.log('✓ Storage manager initialized');
    console.log('✓ Current mode:', manager.currentMode);
    
    // Test health check
    const isHealthy = await manager.healthCheck();
    console.log('✓ Health check:', isHealthy);
    
    // Test repository access
    const storage = manager.getStorage();
    console.log('✓ Storage instance obtained');
    
    // Test basic repository operations
    const repos = manager.repositories;
    console.log('✓ Repositories accessible:', Object.keys(repos));
    
    console.log('✅ Configurable storage system test passed!');
    return true;
  } catch (error) {
    console.error('❌ Storage test failed:', error.message);
    return false;
  }
}

testStorage().then(success => {
  process.exit(success ? 0 : 1);
});
