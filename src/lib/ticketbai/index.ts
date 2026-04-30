import type { StoredTicketBaiConfig } from '@/lib/store/types';
import { MockTicketBaiProvider } from './mock';
import type { ITicketBaiProvider } from './types';

export { MockTicketBaiProvider };
export type { ITicketBaiProvider, IssueInvoiceInput, IssueInvoiceResult } from './types';

/**
 * Create a TicketBAI provider instance for the given association config.
 * Add new cases here when integrating additional providers (BATUZ, etc.).
 */
export function createTicketBaiProvider(config: StoredTicketBaiConfig): ITicketBaiProvider {
  if (config.providerType === 'MOCK') {
    return new MockTicketBaiProvider();
  }
  throw new Error(`TicketBAI provider type ${config.providerType} is not implemented`);
}
