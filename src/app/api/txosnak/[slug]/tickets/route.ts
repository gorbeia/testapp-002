import { auth } from '@/lib/auth';
import { txosnaRepo, ticketRepo } from '@/lib/store';
import type { CounterType, TicketStatus } from '@/lib/store/types';

// ── GET /api/txosnak/[slug]/tickets ──────────────────────────────────────────
// Returns all tickets for a txosna, optionally filtered by counterType and status.
// Requires volunteer session and belongs to the volunteer's association.

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { associationId: sessionAssociationId } = session.user as { associationId: string };

  const txosna = await txosnaRepo.findBySlug(slug);
  if (!txosna) return Response.json({ error: 'Not found' }, { status: 404 });

  if (txosna.associationId !== sessionAssociationId)
    return Response.json({ error: 'Forbidden' }, { status: 403 });

  // Parse query params
  const url = new URL(request.url);
  const counterType = url.searchParams.get('counterType') as CounterType | null;
  const status = url.searchParams.get('status') as TicketStatus | null;

  const tickets = await ticketRepo.listByTxosna(txosna.id, {
    counterType: counterType ?? undefined,
    status: status ?? undefined,
  });

  return Response.json({ tickets }, { status: 200 });
}
