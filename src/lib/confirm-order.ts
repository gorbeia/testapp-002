import { broadcast } from '@/lib/sse';
import { orderRepo, ticketRepo } from '@/lib/store';

export async function confirmOrder(
  orderId: string,
  registeredById: string | null
): Promise<
  | { ok: true; order: Awaited<ReturnType<typeof orderRepo.findById>> }
  | { ok: false; status: number; error: string }
> {
  const order = await orderRepo.findById(orderId);
  if (!order) return { ok: false, status: 404, error: 'Order not found' };

  if (order.status !== 'PENDING_PAYMENT') {
    return { ok: false, status: 409, error: `Cannot confirm order with status ${order.status}` };
  }

  if (!order.pendingLines || order.pendingLines.length === 0) {
    return { ok: false, status: 409, error: 'No pending lines to confirm' };
  }

  for (const ticketInput of order.pendingLines) {
    await ticketRepo.create(order.id, order.txosnaId, ticketInput);
  }

  const updated = await orderRepo.update(orderId, {
    status: 'CONFIRMED',
    registeredById,
    confirmedAt: new Date(),
    pendingLines: null,
  });

  broadcast(order.txosnaId, 'order:confirmed', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: 'CONFIRMED',
  });

  return { ok: true, order: updated };
}
