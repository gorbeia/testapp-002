import { broadcast } from '@/lib/sse';
import { orderRepo, txosnaRepo } from '@/lib/store';

export async function expirePendingOrders(txosnaId: string): Promise<number> {
  const [txosna, pendingOrders] = await Promise.all([
    txosnaRepo.findById(txosnaId),
    orderRepo.listByTxosna(txosnaId, { status: 'PENDING_PAYMENT' }),
  ]);

  if (!txosna) return 0;

  const now = Date.now();
  const timeoutMs = txosna.pendingPaymentTimeout * 60_000;
  let expired = 0;

  for (const order of pendingOrders) {
    if (order.createdAt.getTime() + timeoutMs < now) {
      await orderRepo.update(order.id, {
        status: 'CANCELLED',
        cancellationReason: 'TIMEOUT',
      });

      broadcast(txosnaId, 'order:cancelled', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        reason: 'TIMEOUT',
      });

      expired++;
    }
  }

  return expired;
}
