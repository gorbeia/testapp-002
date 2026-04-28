import { Before } from '@cucumber/cucumber';
import { resetStore } from '@/test/store-setup';
import type { IntegrationWorld } from '../step-definitions/integration/world';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var broadcastCalls: any[];
  var __TEST_ROLE__: string;
  var __TEST_ASSOCIATION_ID__: string;
  var fakePaymentProvider: any;
}

// Reset in-memory store before each integration scenario
Before({ tags: 'not @e2e-only' }, async function (this: IntegrationWorld) {
  resetStore();
  this.lastResponse = null;
  this.lastBody = null;
  this.currentTxosna = null;
  this.currentOrder = null;
  this.currentTicket = null;
  this.savedOrders = [];
  this.namedOrders = new Map();
  this.namedTickets = new Map();
  global.broadcastCalls = [];
  global.__TEST_ROLE__ = 'ADMIN';
  global.__TEST_ASSOCIATION_ID__ = 'assoc-1';
  // Reset fake payment provider state
  if (global.fakePaymentProvider) {
    global.fakePaymentProvider.sessions = [];
    global.fakePaymentProvider.webhookEvents = [];
    global.fakePaymentProvider.nextEvent = null;
    global.fakePaymentProvider.throwMessage = null;
  }
});
