import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import type { StoredTxosna, StoredOrder, StoredTicket } from '@/lib/store/types';

interface BroadcastSpyCall {
  txosnaId: string;
  eventName: string;
  data: unknown;
}

export class IntegrationWorld extends World {
  lastResponse: Response | null = null;
  lastBody: unknown = null;
  currentTxosna: StoredTxosna | null = null;
  currentOrder: StoredOrder | null = null;
  currentTicket: StoredTicket | null = null;
  savedOrders: StoredOrder[] = [];
  broadcastCalls: BroadcastSpyCall[] = [];
  namedOrders: Map<string, StoredOrder> = new Map();
  namedTickets: Map<string, StoredTicket> = new Map();

  constructor(options: IWorldOptions) {
    super(options);
  }

  recordBroadcast(txosnaId: string, eventName: string, data: unknown): void {
    this.broadcastCalls.push({ txosnaId, eventName, data });
  }

  hasBroadcast(txosnaId: string, eventName: string): boolean {
    return this.broadcastCalls.some(
      (call) => call.txosnaId === txosnaId && call.eventName === eventName
    );
  }
}

setWorldConstructor(IntegrationWorld);
