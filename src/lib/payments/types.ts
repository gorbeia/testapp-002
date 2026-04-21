import type { StoredOrder } from '@/lib/store/types';

export interface PaymentSession {
  sessionId: string;
  redirectUrl: string;
  expiresAt: Date;
}

export interface PaymentEvent {
  sessionId: string;
  status: 'succeeded' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  method: 'CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'BIZUM';
}

export interface IPaymentProvider {
  validate(): Promise<{ ok: boolean; error?: string }>;
  createSession(order: StoredOrder, returnUrl: string): Promise<PaymentSession>;
  verifyWebhook(request: Request): Promise<PaymentEvent>;
}
