import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import * as sse from '@/lib/sse';
import { vi } from 'vitest';
import type { StoredTxosna, StoredOrder } from '@/lib/store/types';

export class IntegrationWorld extends World {
  lastResponse: Response | null = null;
  lastBody: unknown = null;
  currentTxosna: StoredTxosna | null = null;
  currentOrder: StoredOrder | null = null;
  savedOrders: StoredOrder[] = [];
  broadcastSpy = vi.spyOn(sse, 'broadcast');

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(IntegrationWorld);
