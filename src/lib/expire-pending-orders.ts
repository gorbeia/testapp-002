/**
 * Expiry sweep for PENDING_PAYMENT orders.
 * Finds all orders that have exceeded their expiry time and cancels them with TIMEOUT reason.
 * Call this at the start of volunteer-facing routes (GET /api/txosnak/[slug]/orders) for lazy cleanup.
 */

import { broadcast } from '@/lib/sse';
import { orderRepo } from '@/lib/store';

export async function expirePendingOrders(txosnaId: string): Promise<number> {
  const orders = await orderRepo.listByTxosna(txosnaId, { status: 'PENDING_PAYMENT' });
  const now = new Date();
  let expired = 0;

  for (const order of orders) {
    if (order.expiresAt && order.expiresAt < now) {
      // Cancel with TIMEOUT reason
      await orderRepo.update(order.id, {
        status: 'CANCELLED',
        cancellationReason: 'TIMEOUT',
      });

      // Notify customer and volunteers
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
