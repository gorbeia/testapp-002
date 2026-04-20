import { orderRepo, ticketRepo } from '@/lib/store';

// ── GET /api/orders/[orderId] ─────────────────────────────────────────────────
// Returns order status for customers. No auth required.
// Two lookup modes:
//   1. Direct: /api/orders/ord-abc123 (from localStorage)
//   2. Shared: /api/orders/ord-abc123?txosnaId=&orderNumber=&verificationCode=
// If verificationCode is provided, it must match the order's code (403 if wrong).

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const order = await orderRepo.findById(orderId);
  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  // If verification code is provided in query params, validate it
  const url = new URL(request.url);
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
