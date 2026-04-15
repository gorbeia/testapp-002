import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return new Response('ids array is required', { status: 400 });
  }

  // Verify all ids belong to this association
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, category: { associationId } },
    select: { id: true },
  });

  if (products.length !== ids.length) {
    return new Response('One or more product ids not found', { status: 404 });
  }

  await prisma.$transaction(
    ids.map((id: string, index: number) =>
      prisma!.product.update({ where: { id }, data: { displayOrder: index } })
    )
  );

  return new Response(null, { status: 204 });
}
