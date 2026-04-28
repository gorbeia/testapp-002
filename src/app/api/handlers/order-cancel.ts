import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/sse';
import { orderRepo, txosnaRepo } from '@/lib/store';
import type { CancellationReason } from '@/lib/store/types';

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  let body: { reason?: string };
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const reason = (body.reason ?? 'CUSTOMER') as CancellationReason;

  let isVolunteer = false;
  let sessionAssociationId: string | null = null;
  if (process.env.PROTO_MODE !== 'true') {
    const session = await auth();
    isVolunteer = !!session?.user;
    if (isVolunteer)
      sessionAssociationId = (session?.user as { associationId?: string }).associationId ?? null;
  } else {
    isVolunteer = true;
  }

  if (!isVolunteer && reason !== 'CUSTOMER') {
    return Response.json(
      { error: 'Customers can only cancel with reason CUSTOMER' },
      { status: 403 }
    );
  }

  const order = await orderRepo.findById(orderId);
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

  if (isVolunteer && sessionAssociationId !== null) {
    const txosna = await txosnaRepo.findById(order.txosnaId);
    if (!txosna || txosna.associationId !== sessionAssociationId)
      return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (order.status === 'CANCELLED') {
    return Response.json({ error: 'Order is already cancelled' }, { status: 409 });
  }

  if (!isVolunteer && order.status !== 'PENDING_PAYMENT') {
    return Response.json(
      { error: 'Customers can only cancel PENDING_PAYMENT orders' },
      { status: 409 }
    );
  }

  const updated = await orderRepo.update(orderId, {
    status: 'CANCELLED',
    cancellationReason: reason,
  });

  broadcast(order.txosnaId, 'order:cancelled', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    reason,
  });

  return Response.json(updated, { status: 200 });
}
