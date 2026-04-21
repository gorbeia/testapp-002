import { orderRepo, ticketRepo } from '@/lib/store';

// ── GET /api/orders/[orderId] ─────────────────────────────────────────────────
// Returns order status for customers. No auth required.
// Two lookup modes:
//   1. Direct: /api/orders/ord-abc123 (from localStorage)
//   2. Shared: /api/orders/ord-abc123?txosnaId=abc&orderNumber=42&verificationCode=AB-1234
// If verificationCode is provided, it must match the order's code (403 if wrong).

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const url = new URL(request.url);

  let order = await orderRepo.findById(orderId);

  // If txosnaId and orderNumber are provided as query params, use them for lookup instead
  const txosnaId = url.searchParams.get('txosnaId');
  const orderNumberParam = url.searchParams.get('orderNumber');
  if (txosnaId && orderNumberParam) {
    const orderNumber = parseInt(orderNumberParam, 10);
    order = await orderRepo.findByNumber(txosnaId, orderNumber);
  }

  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  // Verify the order matches the requested orderId if direct lookup was used
  if (!txosnaId && !orderNumberParam && order.id !== orderId) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  // If verification code is provided in query params, validate it
  const providedCode = url.searchParams.get('verificationCode');
  if (providedCode && order.verificationCode !== providedCode) {
    return Response.json({ error: 'Invalid verification code' }, { status: 403 });
  }

  // Fetch associated tickets
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
