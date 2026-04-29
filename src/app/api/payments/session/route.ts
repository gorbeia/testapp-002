import { getPaymentProvider, createPaymentProvider } from '@/lib/payments';
import { orderRepo, txosnaRepo, paymentProviderRepo } from '@/lib/store';

export async function POST(request: Request) {
  let body: { orderId: string; returnUrl?: string; providerType?: 'STRIPE' | 'REDSYS' };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.orderId) {
    return Response.json({ error: 'orderId required' }, { status: 400 });
  }

  const order = await orderRepo.findById(body.orderId);
  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status !== 'PENDING_PAYMENT') {
    return Response.json({ error: 'Order is not in PENDING_PAYMENT state' }, { status: 409 });
  }

  if (order.paymentMethod !== 'ONLINE') {
    return Response.json({ error: 'Order does not use online payment' }, { status: 409 });
  }

  const returnUrl = body.returnUrl ?? `${process.env.NEXT_PUBLIC_BASE_URL}/orders/${order.id}`;

  let session;

  if (body.providerType === 'REDSYS') {
    const txosna = await txosnaRepo.findById(order.txosnaId);
    if (!txosna) {
      return Response.json({ error: 'Txosna not found' }, { status: 500 });
    }
    const providers = await paymentProviderRepo.listByAssociation(txosna.associationId);
    const stored = providers.find((p) => p.providerType === 'REDSYS' && p.enabled);
    if (!stored) {
      return Response.json({ error: 'No active Redsys provider configured' }, { status: 409 });
    }
    session = await createPaymentProvider(stored).createSession(order, returnUrl);
  } else {
    session = await getPaymentProvider().createSession(order, returnUrl);
  }

  await orderRepo.update(order.id, { paymentSessionId: session.sessionId });

  return Response.json({ url: session.redirectUrl, sessionId: session.sessionId }, { status: 200 });
}
