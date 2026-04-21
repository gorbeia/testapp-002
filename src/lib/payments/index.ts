import type { IPaymentProvider } from './types';
import { StripePaymentProvider } from './stripe';

// Routes import this singleton. Tests mock this module via vi.mock.
export const paymentProvider: IPaymentProvider = new StripePaymentProvider();
