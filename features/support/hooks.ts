import { Before } from '@cucumber/cucumber';
import { resetStore } from '@/test/store-setup';
import type { IntegrationWorld } from '../step-definitions/integration/world';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var broadcastCalls: any[];
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
  global.broadcastCalls = [];
});
