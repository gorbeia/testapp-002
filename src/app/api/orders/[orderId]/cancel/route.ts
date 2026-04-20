import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/sse';
import { orderRepo } from '@/lib/store';
import type { CancellationReason } from '@/lib/store/types';

// ── POST /api/orders/[orderId]/cancel ───────────────────────────────────────
// Cancel an order. Customers can only cancel PENDING_PAYMENT orders.
// Volunteers can cancel any order with a reason.
// Broadcasts order:cancelled SSE event.

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  let body: { reason?: string };
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const reason = (body.reason ?? 'CUSTOMER') as CancellationReason;

  // Check auth — volunteers can provide any reason; customers only CUSTOMER
  let isVolunteer = false;
  if (process.env.PROTO_MODE !== 'true') {
    const session = await auth();
    isVolunteer = !!session?.user;
  } else {
    isVolunteer = true; // in PROTO_MODE, allow both
  }

  if (!isVolunteer && reason !== 'CUSTOMER') {
    return Response.json(
      { error: 'Customers can only cancel with reason CUSTOMER' },
      { status: 403 }
    );
  }

  const order = await orderRepo.findById(orderId);
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

  // Already cancelled
  if (order.status === 'CANCELLED') {
    return Response.json({ error: 'Order is already cancelled' }, { status: 409 });
  }

  // Customers can only cancel PENDING_PAYMENT; volunteers can cancel any status
  if (!isVolunteer && order.status !== 'PENDING_PAYMENT') {
    return Response.json(
      { error: 'Customers can only cancel PENDING_PAYMENT orders' },
      { status: 409 }
    );
  }

  // Update order
  const updated = await orderRepo.update(orderId, {
    status: 'CANCELLED',
    cancellationReason: reason,
  });

  // Broadcast cancellation
  broadcast(order.txosnaId, 'order:cancelled', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    reason,
  });

  return Response.json(updated, { status: 200 });
}
