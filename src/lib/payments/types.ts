import type { Order } from '@prisma/client';

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
  createSession(order: Order, returnUrl: string): Promise<PaymentSession>;
  verifyWebhook(request: Request): Promise<PaymentEvent>;
}
