import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import type { StoredTxosna } from '@/lib/store/types';

export class IntegrationWorld extends World {
  lastResponse: Response | null = null;
  lastBody: unknown = null;
  currentTxosna: StoredTxosna | null = null;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(IntegrationWorld);
