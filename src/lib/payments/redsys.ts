import { createRedsysAPI, SANDBOX_URLS, PRODUCTION_URLS } from 'redsys-easy';
import type { IPaymentProvider, PaymentSession, PaymentEvent } from './types';
import type { StoredOrder } from '@/lib/store/types';

export class RedsysPaymentProvider implements IPaymentProvider {
  private merchantCode: string;
  private terminal: string;
  private secretKey: string;
  private bizumEnabled: boolean;
  private testMode: boolean;

  constructor(credentials: Record<string, string>, bizumEnabled: boolean, testMode: boolean) {
    const { merchantCode, terminal, secretKey } = credentials;
    if (!merchantCode || !terminal || !secretKey) {
      throw new Error('Redsys credentials must include merchantCode, terminal, and secretKey');
    }
    this.merchantCode = merchantCode;
    this.terminal = terminal;
    this.secretKey = secretKey;
    this.bizumEnabled = bizumEnabled;
    this.testMode = testMode;
  }

  async validate(): Promise<{ ok: boolean; error?: string }> {
    try {
      const { createRedirectForm } = createRedsysAPI({
        secretKey: this.secretKey,
        urls: this.testMode ? SANDBOX_URLS : PRODUCTION_URLS,
      });
      createRedirectForm({
        DS_MERCHANT_MERCHANTCODE: this.merchantCode,
        DS_MERCHANT_TERMINAL: this.terminal,
        DS_MERCHANT_ORDER: '9999TEST',
        DS_MERCHANT_AMOUNT: '1',
        DS_MERCHANT_CURRENCY: '978',
        DS_MERCHANT_TRANSACTIONTYPE: '0',
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Redsys validation failed' };
    }
  }

  async createSession(order: StoredOrder, returnUrl: string): Promise<PaymentSession> {
    const orderNum = String(order.orderNumber).padStart(4, '0');
    const suffix = crypto.randomUUID().replace(/-/g, '').substring(0, 4).toUpperCase();
    const dsOrder = `${orderNum}${suffix}`;

    const notificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/webhook/redsys`;

    const { createRedirectForm } = createRedsysAPI({
      secretKey: this.secretKey,
      urls: this.testMode ? SANDBOX_URLS : PRODUCTION_URLS,
    });

    const form = createRedirectForm({
      DS_MERCHANT_MERCHANTCODE: this.merchantCode,
      DS_MERCHANT_TERMINAL: this.terminal,
      DS_MERCHANT_ORDER: dsOrder,
      DS_MERCHANT_AMOUNT: String(Math.round(order.total * 100)),
      DS_MERCHANT_CURRENCY: '978',
      DS_MERCHANT_TRANSACTIONTYPE: '0',
      DS_MERCHANT_URLOK: `${returnUrl}/success`,
      DS_MERCHANT_URLKO: `${returnUrl}/cancelled`,
      DS_MERCHANT_MERCHANTURL: notificationUrl,
    });

    const redsysUrl = form.url;
    const { Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature } = form.body;

    const redirectUrl =
      `/api/payments/redsys/redirect?` +
      new URLSearchParams({ redsysUrl, Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature });

    // Suppress unused variable warning — bizumEnabled is a TPV property, no param needed
    void this.bizumEnabled;

    return {
      sessionId: dsOrder,
      redirectUrl,
      expiresAt: new Date(Date.now() + 30 * 60_000),
    };
  }

  async verifyWebhook(request: Request): Promise<PaymentEvent> {
    const body = await request.text();
    const form = new URLSearchParams(body);

    const Ds_SignatureVersion = form.get('Ds_SignatureVersion') ?? '';
    const Ds_MerchantParameters = form.get('Ds_MerchantParameters') ?? '';
    const Ds_Signature = form.get('Ds_Signature') ?? '';

    const { processRedirectNotification } = createRedsysAPI({
      secretKey: this.secretKey,
      urls: this.testMode ? SANDBOX_URLS : PRODUCTION_URLS,
    });

    const notification = processRedirectNotification({
      Ds_SignatureVersion,
      Ds_MerchantParameters,
      Ds_Signature,
    });

    const { Ds_Order, Ds_Response, Ds_Amount, Ds_ProcessedPayMethod } = notification;

    const responseCode = parseInt(Ds_Response ?? '9999', 10);
    const status: PaymentEvent['status'] = responseCode <= 99 ? 'succeeded' : 'cancelled';

    return {
      sessionId: Ds_Order,
      status,
      amount: parseInt(Ds_Amount, 10) / 100,
      currency: 'EUR',
      method: Ds_ProcessedPayMethod === 'z' ? 'BIZUM' : 'CARD',
    };
  }
}
