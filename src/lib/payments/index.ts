import type { IPaymentProvider } from './types';
import { StripePaymentProvider } from './stripe';

let _provider: IPaymentProvider | undefined;

// Deferred singleton — constructed on first call, not at import time,
// so the build succeeds even when STRIPE_SECRET_KEY is not set.
export function getPaymentProvider(): IPaymentProvider {
  if (!_provider) _provider = new StripePaymentProvider();
  return _provider;
}
