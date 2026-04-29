import { getPaymentProvider, createPaymentProvider } from '@/lib/payments';
import { orderRepo, txosnaRepo, paymentProviderRepo } from '@/lib/store';
import { confirmOrder } from '@/lib/confirm-order';
import { broadcast } from '@/lib/sse';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (provider !== 'stripe' && provider !== 'redsys') {
    return Response.json({ error: 'Unknown provider' }, { status: 404 });
  }

  if (provider === 'redsys') {
    return handleRedsys(request);
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

  return applyEvent(order, event.status);
}

async function handleRedsys(request: Request) {
  const rawBody = await request.text();
  const form = new URLSearchParams(rawBody);
  const encodedParams = form.get('Ds_MerchantParameters') ?? '';

  let dsOrder: string;
  try {
    const decoded = JSON.parse(Buffer.from(encodedParams, 'base64').toString('utf-8')) as Record<
      string,
      unknown
    >;
    dsOrder = decoded['Ds_Order'] as string;
    if (!dsOrder) throw new Error('missing Ds_Order');
  } catch {
    return Response.json({ error: 'Malformed Ds_MerchantParameters' }, { status: 400 });
  }

  const order = await orderRepo.findByPaymentSessionId(dsOrder);
  if (!order) {
    return Response.json({ error: 'Order not found for session' }, { status: 404 });
  }

  const txosna = await txosnaRepo.findById(order.txosnaId);
  const providers = txosna ? await paymentProviderRepo.listByAssociation(txosna.associationId) : [];
  const storedProvider = providers.find((p) => p.providerType === 'REDSYS' && p.enabled);
  if (!storedProvider) {
    return Response.json({ error: 'No active Redsys provider configured' }, { status: 400 });
  }

  let event;
  try {
    const syntheticReq = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: rawBody,
    });
    event = await createPaymentProvider(storedProvider).verifyWebhook(syntheticReq);
  } catch {
    return Response.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  return applyEvent(order, event.status);
}

async function applyEvent(
  order: Awaited<ReturnType<typeof orderRepo.findByPaymentSessionId>>,
  status: 'succeeded' | 'failed' | 'cancelled'
) {
  if (!order) return Response.json({ error: 'Order not found for session' }, { status: 404 });

  if (status === 'succeeded') {
    const result = await confirmOrder(order.id, null, null);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
  } else if (status === 'cancelled') {
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
