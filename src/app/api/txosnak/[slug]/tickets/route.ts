/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/lib/auth';
import { txosnaRepo, ticketRepo, orderRepo } from '@/lib/store';
import type { CounterType, TicketStatus } from '@/lib/store/types';

// ── GET /api/txosnak/[slug]/tickets ──────────────────────────────────────────
// Returns all tickets for a txosna, optionally filtered by counterType and status.
// status param accepts comma-separated values: ?status=RECEIVED,IN_PREPARATION
// Each ticket is enriched with orderNumber and customerName from its order.
// Requires volunteer session and belongs to the volunteer's association.

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let sessionAssociationId: string;
  if (process.env.PROTO_MODE === 'true') {
    sessionAssociationId = (global as any).__TEST_ASSOCIATION_ID__ ?? 'assoc-1';
  } else {
    const session = await auth();
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    ({ associationId: sessionAssociationId } = session.user as any);
  }

  const txosna = await txosnaRepo.findBySlug(slug);
  if (!txosna) return Response.json({ error: 'Not found' }, { status: 404 });

  if (txosna.associationId !== sessionAssociationId)
    return Response.json({ error: 'Forbidden' }, { status: 403 });

  // Parse query params — status supports comma-separated values
  const url = new URL(request.url);
  const counterType = url.searchParams.get('counterType') as CounterType | null;
  const kitchenPost = url.searchParams.get('kitchenPost');
  const statusParam = url.searchParams.get('status');
  const statuses = statusParam ? (statusParam.split(',').filter(Boolean) as TicketStatus[]) : null;

  // Fetch all matching tickets (filter per status below if multi-value)
  let tickets = await ticketRepo.listByTxosna(txosna.id, {
    counterType: counterType ?? undefined,
    kitchenPost: kitchenPost ?? undefined,
    status: statuses?.length === 1 ? statuses[0] : undefined,
  });

  if (statuses && statuses.length > 1) {
    tickets = tickets.filter((t) => statuses.includes(t.status));
  }

  // Enrich tickets with orderNumber + customerName from their orders
  const enriched = await Promise.all(
    tickets.map(async (ticket) => {
      const order = await orderRepo.findById(ticket.orderId);
      return {
        ...ticket,
        orderNumber: order?.orderNumber ?? null,
        customerName: order?.customerName ?? null,
      };
    })
  );

  return Response.json({ tickets: enriched }, { status: 200 });
}
