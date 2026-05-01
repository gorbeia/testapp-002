import { broadcast } from '@/lib/sse';
import { orderRepo, ticketRepo, txosnaRepo } from '@/lib/store';
import { issueTicketBaiInvoice } from '@/lib/ticketbai/service';

export async function confirmOrder(
  orderId: string,
  registeredById: string | null,
  associationId: string | null
): Promise<
  | { ok: true; order: Awaited<ReturnType<typeof orderRepo.findById>> }
  | { ok: false; status: number; error: string }
> {
  const order = await orderRepo.findById(orderId);
  if (!order) return { ok: false, status: 404, error: 'Order not found' };

  if (associationId !== null) {
    const txosna = await txosnaRepo.findById(order.txosnaId);
    if (!txosna || txosna.associationId !== associationId)
      return { ok: false, status: 403, error: 'Forbidden' };
  }

  if (order.status !== 'PENDING_PAYMENT') {
    return { ok: false, status: 409, error: `Cannot confirm order with status ${order.status}` };
  }

  if (order.expiresAt && new Date() > order.expiresAt) {
    return { ok: false, status: 409, error: 'Order has expired' };
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

  const txosna = await txosnaRepo.findById(order.txosnaId);
  if (txosna) {
    issueTicketBaiInvoice(updated!, txosna.associationId).catch(() => {});
  }

  return { ok: true, order: updated };
}
