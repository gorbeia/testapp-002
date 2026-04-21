import type { IPaymentProvider, PaymentSession, PaymentEvent } from './types';
import type { StoredOrder } from '@/lib/store/types';

export class FakePaymentProvider implements IPaymentProvider {
  public sessions: Array<{ order: StoredOrder; returnUrl: string }> = [];
  public webhookEvents: PaymentEvent[] = [];
  private nextEvent: PaymentEvent | null = null;
  private throwMessage: string | null = null;

  async validate(): Promise<{ ok: boolean; error?: string }> {
    return { ok: true };
  }

  async createSession(order: StoredOrder, returnUrl: string): Promise<PaymentSession> {
    this.sessions.push({ order, returnUrl });
    return {
      sessionId: `fake-session-${order.id}`,
      redirectUrl: `https://fake-stripe.test/pay/${order.id}`,
      expiresAt: new Date(Date.now() + 15 * 60_000),
    };
  }

  setNextWebhookEvent(event: PaymentEvent): void {
    this.nextEvent = event;
  }

  setThrowOnVerify(msg: string): void {
    this.throwMessage = msg;
  }

  async verifyWebhook(_request: Request): Promise<PaymentEvent> {
    if (this.throwMessage) {
      const msg = this.throwMessage;
      this.throwMessage = null;
      throw new Error(msg);
    }
    if (!this.nextEvent) throw new Error('No event configured');
    const ev = this.nextEvent;
    this.nextEvent = null;
    this.webhookEvents.push(ev);
    return ev;
  }
}
