/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/lib/auth';
import { ticketRepo, txosnaRepo } from '@/lib/store';
import { broadcast } from '@/lib/sse';
import type { TicketStatus } from '@/lib/store/types';

// ── PATCH /api/tickets/[id] ──────────────────────────────────────────
// Advances ticket through lifecycle (RECEIVED → IN_PREPARATION → READY → COMPLETED).
// Requires volunteer session and ticket belongs to the volunteer's association.

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let sessionAssociationId: string;
  if (process.env.PROTO_MODE === 'true') {
    sessionAssociationId = (global as any).__TEST_ASSOCIATION_ID__ ?? 'assoc-1';
  } else {
    const session = await auth();
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    ({ associationId: sessionAssociationId } = session.user as any);
  }

  let body: { status: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const newStatus = body.status as TicketStatus;
  if (!['RECEIVED', 'IN_PREPARATION', 'READY', 'COMPLETED'].includes(newStatus)) {
    return Response.json({ error: 'Invalid status' }, { status: 422 });
  }

  const ticket = await ticketRepo.findById(id);
  if (!ticket) return Response.json({ error: 'Not found' }, { status: 404 });

  const txosna = await txosnaRepo.findById(ticket.txosnaId);
  if (!txosna || txosna.associationId !== sessionAssociationId)
    return Response.json({ error: 'Forbidden' }, { status: 403 });

  // Validate forward-only transition
  const ORDER: TicketStatus[] = ['RECEIVED', 'IN_PREPARATION', 'READY', 'COMPLETED'];
  const currentIndex = ORDER.indexOf(ticket.status);
  const newIndex = ORDER.indexOf(newStatus);

  if (newIndex <= currentIndex) {
    return Response.json({ error: 'Can only advance ticket status forward' }, { status: 422 });
  }

  // Update ticket
  const patch: Record<string, unknown> = { status: newStatus };
  if (newStatus === 'READY') {
    patch.readyAt = new Date();
  } else if (newStatus === 'COMPLETED') {
    patch.completedAt = new Date();
  }

  const updated = await ticketRepo.update(id, patch as Parameters<typeof ticketRepo.update>[1]);

  // Broadcast ticket:status_changed
  broadcast(ticket.txosnaId, 'ticket:status_changed', {
    ticketId: id,
    oldStatus: ticket.status,
    newStatus,
  });

  // Check if all tickets in order are now READY (or beyond)
  const orderTickets = await ticketRepo.listByOrder(ticket.orderId);
  const allReady = orderTickets.every((t) => {
    const idx = ORDER.indexOf(t.status);
    return idx >= ORDER.indexOf('READY');
  });

  if (allReady) {
    broadcast(ticket.txosnaId, 'order:ready', {
      orderId: ticket.orderId,
    });
  }

  return Response.json(updated, { status: 200 });
}
