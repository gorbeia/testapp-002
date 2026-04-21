import Stripe from 'stripe';
import type { IPaymentProvider, PaymentSession, PaymentEvent } from './types';
import type { StoredOrder } from '@/lib/store/types';

export class StripePaymentProvider implements IPaymentProvider {
  private stripe: Stripe;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async validate(): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.stripe.paymentMethods.list({ limit: 1 });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Stripe validation failed' };
    }
  }

  async createSession(order: StoredOrder, returnUrl: string): Promise<PaymentSession> {
    const now = new Date();
    let expiresAt = order.expiresAt;

    if (!expiresAt || expiresAt.getTime() - now.getTime() < 30 * 60_000) {
      expiresAt = new Date(now.getTime() + 30 * 60_000);
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(order.total * 100),
            product_data: {
              name: `Pedido #${order.orderNumber}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${returnUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}/cancelled`,
      metadata: {
        orderId: order.id,
      },
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    });

    return {
      sessionId: session.id,
      redirectUrl: session.url!,
      expiresAt,
    };
  }

  async verifyWebhook(request: Request): Promise<PaymentEvent> {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Missing webhook signature or secret');
    }

    const event = this.stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        sessionId: session.id,
        status: 'succeeded',
        amount: (session.amount_total ?? 0) / 100,
        currency: (session.currency ?? 'eur').toUpperCase(),
        method: 'CARD',
      };
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        sessionId: session.id,
        status: 'cancelled',
        amount: 0,
        currency: 'EUR',
        method: 'CARD',
      };
    }

    throw new Error(`Unhandled event type: ${event.type}`);
  }
}
