import type { IPaymentProvider } from './types';
import type { StoredPaymentProvider } from '@/lib/store/types';
import { StripePaymentProvider } from './stripe';

let _provider: IPaymentProvider | undefined;

// Deferred singleton — constructed on first call, not at import time,
// so the build succeeds even when STRIPE_SECRET_KEY is not set.
export function getPaymentProvider(): IPaymentProvider {
  if (!_provider) _provider = new StripePaymentProvider();
  return _provider;
}

export function createPaymentProvider(provider: StoredPaymentProvider): IPaymentProvider {
  if (provider.providerType === 'STRIPE') {
    return new StripePaymentProvider(provider.credentials.secretKey);
  }
  throw new Error(`Provider type ${provider.providerType} is not implemented`);
}
