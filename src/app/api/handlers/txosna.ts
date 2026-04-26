import { txosnaRepo } from '@/lib/store';

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
