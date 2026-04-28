/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/lib/auth';
import { txosnaRepo, associationRepo } from '@/lib/store';

export async function GET() {
  let sessionAssociationId: string;
  if (process.env.PROTO_MODE === 'true') {
    sessionAssociationId = (global as any).__TEST_ASSOCIATION_ID__ ?? 'assoc-1';
  } else {
    const session = await auth();
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    const { role: sessionRole, associationId } = session.user as any;
    if (sessionRole !== 'ADMIN') return new Response('Forbidden', { status: 403 });
    sessionAssociationId = associationId;
  }

  const association = await associationRepo.findById(sessionAssociationId);
  if (!association) return Response.json({ error: 'Association not found' }, { status: 404 });

  const all = await txosnaRepo.list(sessionAssociationId);

  return Response.json({
    association: { name: association.name },
    txosnak: all.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status,
      waitMinutes: t.waitMinutes,
      counterSetup: t.counterSetup,
    })),
  });
}
