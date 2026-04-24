// Register module mocks before any test files are loaded
// This runs in a Node.js context before ts-node transpiles TypeScript

const Module = require('module');
const originalRequire = Module.prototype.require;

// Global store for SSE broadcast calls (accessible to test steps)
global.broadcastCalls = [];

// Create a fake payment provider class
class FakePaymentProvider {
  constructor() {
    this.sessions = [];
    this.webhookEvents = [];
    this.nextEvent = null;
    this.throwMessage = null;
  }

  async validate() {
    return { ok: true };
  }

  async createSession(order, returnUrl) {
    this.sessions.push({ order, returnUrl });
    return {
      sessionId: `fake-session-${order.id}`,
      redirectUrl: `https://fake-stripe.test/pay/${order.id}`,
      expiresAt: new Date(Date.now() + 15 * 60_000),
    };
  }

  setNextWebhookEvent(event) {
    this.nextEvent = event;
  }

  setThrowOnVerify(msg) {
    this.throwMessage = msg;
  }

  async verifyWebhook(_request) {
    if (this.throwMessage) {
      const msg = this.throwMessage;
      this.throwMessage = null;
      throw new Error(msg);
    }
    if (!this.nextEvent) throw new Error('No event configured');
    const ev = this.nextEvent;
    this.nextEvent = null;
    this.webhookEvents.push(ev);
    return ev;
  }
}

// Global fake payment provider instance (accessible to test steps)
global.fakePaymentProvider = new FakePaymentProvider();

// Mock next-auth, SSE, and payment provider to avoid ESM/CommonJS resolution issues
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
  if (id === '@/lib/payments') {
    return {
      paymentProvider: global.fakePaymentProvider,
      getPaymentProvider: () => global.fakePaymentProvider,
    };
  }
  return originalRequire.apply(this, arguments);
};
