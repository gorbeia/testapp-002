/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/lib/auth';
import { txosnaRepo, ticketRepo, orderRepo } from '@/lib/store';
import type { CounterType, TicketStatus } from '@/lib/store/types';

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

  const url = new URL(request.url);
  const counterType = url.searchParams.get('counterType') as CounterType | null;
  const kitchenPost = url.searchParams.get('kitchenPost');
  const statusParam = url.searchParams.get('status');
  const statuses = statusParam ? (statusParam.split(',').filter(Boolean) as TicketStatus[]) : null;

  let tickets = await ticketRepo.listByTxosna(txosna.id, {
    counterType: counterType ?? undefined,
    kitchenPost: kitchenPost ?? undefined,
    status: statuses?.length === 1 ? statuses[0] : undefined,
  });

  if (statuses && statuses.length > 1) {
    tickets = tickets.filter((t) => statuses.includes(t.status));
  }

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
