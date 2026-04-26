import { getPaymentProvider } from '@/lib/payments';
import { orderRepo } from '@/lib/store';
import { confirmOrder } from '@/lib/confirm-order';
import { broadcast } from '@/lib/sse';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (provider !== 'stripe') {
    return Response.json({ error: 'Unknown provider' }, { status: 404 });
  }

  let event;
  try {
    event = await getPaymentProvider().verifyWebhook(request);
  } catch {
    return Response.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const order = await orderRepo.findByPaymentSessionId(event.sessionId);
  if (!order) {
    return Response.json({ error: 'Order not found for session' }, { status: 404 });
  }

  if (event.status === 'succeeded') {
    const result = await confirmOrder(order.id, null, null);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
  } else if (event.status === 'cancelled') {
    await orderRepo.update(order.id, {
      status: 'CANCELLED',
      cancellationReason: 'TIMEOUT',
    });
    broadcast(order.txosnaId, 'order:cancelled', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      reason: 'TIMEOUT',
    });
  }

  return Response.json({ received: true }, { status: 200 });
}
