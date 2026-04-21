import { txosnaRepo, ticketRepo } from '@/lib/store';
import type { CounterType, TicketStatus } from '@/lib/store/types';

// ── GET /api/txosnak/[slug]/tickets ──────────────────────────────────────────
// Returns all tickets for a txosna, optionally filtered by counterType and status.
// Requires volunteer session (or PROTO_MODE bypass).

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const txosna = await txosnaRepo.findBySlug(slug);
  if (!txosna) return Response.json({ error: 'Not found' }, { status: 404 });

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
