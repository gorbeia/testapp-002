import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const association = await prisma.association.findUnique({
    where: { id: associationId },
    select: { name: true },
  });

  if (!association) {
    return Response.json({ error: 'Association not found' }, { status: 404 });
  }

  const txosnak = await prisma.txosna.findMany({
    where: { associationId },
    select: { id: true, name: true, slug: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  return Response.json({
    association: { name: association.name },
    txosnak,
  });
}
