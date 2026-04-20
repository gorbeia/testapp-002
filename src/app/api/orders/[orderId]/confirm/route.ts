import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/sse';
import { orderRepo, ticketRepo } from '@/lib/store';

// ── POST /api/orders/[orderId]/confirm ──────────────────────────────────────
// Volunteer confirms payment for a PENDING_PAYMENT order.
// Creates tickets and transitions order to CONFIRMED.
// Requires volunteer session (or PROTO_MODE bypass).

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  // Auth — volunteer only
  let volunteerId: string | null = null;
  if (process.env.PROTO_MODE !== 'true') {
    const session = await auth();
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    volunteerId = (session.user as { id?: string }).id ?? null;
  } else {
    volunteerId = 'proto-volunteer-id';
  }

  const order = await orderRepo.findById(orderId);
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

  // Only PENDING_PAYMENT orders can be confirmed
  if (order.status !== 'PENDING_PAYMENT') {
    return Response.json(
      { error: `Cannot confirm order with status ${order.status}` },
      { status: 409 }
    );
  }

  // Check that pendingLines exist
  if (!order.pendingLines || order.pendingLines.length === 0) {
    return Response.json({ error: 'No pending lines to confirm' }, { status: 409 });
  }

  // Create tickets from pendingLines
  for (const ticketInput of order.pendingLines) {
    await ticketRepo.create(order.id, order.txosnaId, ticketInput);
  }

  // Update order: confirm and clear pendingLines
  const updated = await orderRepo.update(orderId, {
    status: 'CONFIRMED',
    registeredById: volunteerId,
    confirmedAt: new Date(),
    pendingLines: null,
  });

  // Broadcast confirmation to customer
  broadcast(order.txosnaId, 'order:confirmed', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: 'CONFIRMED',
  });

  return Response.json(updated, { status: 200 });
}
