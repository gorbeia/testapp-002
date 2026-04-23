import { txosnaRepo } from '@/lib/store';

// GET /api/txosnak/[slug]
// Public — returns txosna name, status, wait time, counter setup, and ordering config.
// Returns 404 if the slug is not found or the txosna is CLOSED.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const txosna = await txosnaRepo.findBySlug(slug);

  if (!txosna || txosna.status === 'CLOSED') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json({
    id: txosna.id,
    slug: txosna.slug,
    name: txosna.name,
    status: txosna.status,
    associationId: txosna.associationId,
    counterSetup: txosna.counterSetup,
    waitMinutes: txosna.waitMinutes,
    enabledChannels: txosna.enabledChannels,
    enabledPaymentMethods: txosna.enabledPaymentMethods,
  });
}
