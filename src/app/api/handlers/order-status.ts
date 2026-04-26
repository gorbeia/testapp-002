import { orderRepo, ticketRepo } from '@/lib/store';

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const url = new URL(request.url);

  let order = await orderRepo.findById(orderId);

  const txosnaId = url.searchParams.get('txosnaId');
  const orderNumberParam = url.searchParams.get('orderNumber');
  if (txosnaId && orderNumberParam) {
    const orderNumber = parseInt(orderNumberParam, 10);
    order = await orderRepo.findByNumber(txosnaId, orderNumber);
  }

  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  if (!txosnaId && !orderNumberParam && order.id !== orderId) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  const providedCode = url.searchParams.get('verificationCode');
  if (providedCode && order.verificationCode !== providedCode) {
    return Response.json({ error: 'Invalid verification code' }, { status: 403 });
  }

  const tickets = await ticketRepo.listByOrder(orderId);

  return Response.json({
    id: order.id,
    orderNumber: order.orderNumber,
    txosnaId: order.txosnaId,
    status: order.status,
    verificationCode: order.verificationCode,
    customerName: order.customerName,
    total: order.total,
    channel: order.channel,
    notes: order.notes,
    createdAt: order.createdAt,
    tickets: tickets.map((t) => ({
      id: t.id,
      counterType: t.counterType,
      status: t.status,
      readyAt: t.readyAt,
      completedAt: t.completedAt,
    })),
  });
}
