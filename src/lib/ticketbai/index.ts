import type {
  StoredTicketBaiConfig,
  TicketBaiProviderType,
  TicketBaiTerritory,
} from '@/lib/store/types';
import { MockTicketBaiProvider } from './mock';
import type { ITicketBaiProvider } from './types';

export { MockTicketBaiProvider };
export type { ITicketBaiProvider, IssueInvoiceInput, IssueInvoiceResult } from './types';

export const TICKETBAI_TERRITORY_LABELS: Record<TicketBaiTerritory, string> = {
  ARABA: 'TicketBAI Araba',
  BIZKAIA: 'TicketBAI Bizkaia',
  GIPUZKOA: 'TicketBAI Gipuzkoa',
  VERIFACTU: 'Verifactu',
};

export const TICKETBAI_TERRITORIES: TicketBaiTerritory[] = [
  'ARABA',
  'BIZKAIA',
  'GIPUZKOA',
  'VERIFACTU',
];

interface ProviderEntry {
  type: TicketBaiProviderType;
  displayName: string;
  supportedTerritories: TicketBaiTerritory[];
}

export const TICKETBAI_PROVIDER_REGISTRY: ProviderEntry[] = [
  {
    type: 'MOCK',
    displayName: 'Mock (Proba modua)',
    supportedTerritories: ['ARABA', 'BIZKAIA', 'GIPUZKOA', 'VERIFACTU'],
  },
];

export function getProvidersForTerritory(territory: TicketBaiTerritory): ProviderEntry[] {
  return TICKETBAI_PROVIDER_REGISTRY.filter((p) => p.supportedTerritories.includes(territory));
}

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
