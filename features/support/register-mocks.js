// Register module mocks before any test files are loaded
// This runs in a Node.js context before ts-node transpiles TypeScript

const Module = require('module');
const originalRequire = Module.prototype.require;

// Global store for SSE broadcast calls (accessible to test steps)
global.broadcastCalls = [];

// Mock next-auth and SSE to avoid ESM/CommonJS resolution issues
Module.prototype.require = function (id) {
  if (id === '@/lib/auth') {
    return {
      auth: async () => ({ user: { id: 'test-volunteer' } }),
      signIn: async () => {},
      signOut: async () => {},
      handlers: {},
    };
  }
  if (id === '@/lib/sse') {
    return {
      broadcast: function (txosnaId, eventName, data) {
        global.broadcastCalls.push({ txosnaId, eventName, data });
      },
    };
  }
  return originalRequire.apply(this, arguments);
};
