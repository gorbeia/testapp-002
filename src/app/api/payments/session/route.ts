import { getPaymentProvider } from '@/lib/payments';
import { orderRepo } from '@/lib/store';

export async function POST(request: Request) {
  let body: { orderId: string; returnUrl?: string };
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

  const session = await getPaymentProvider().createSession(order, returnUrl);

  await orderRepo.update(order.id, { paymentSessionId: session.sessionId });

  return Response.json({ url: session.redirectUrl, sessionId: session.sessionId }, { status: 200 });
}
