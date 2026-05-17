import { auth } from '@/lib/auth';
import { catalogRepo } from '@/lib/store';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return new Response('ids array is required', { status: 400 });
  }

  const allCats = await catalogRepo.listCategories(associationId);
  const catIds = new Set(allCats.map((c) => c.id));
  if (ids.some((id: string) => !catIds.has(id))) {
    return new Response('One or more category ids not found', { status: 404 });
  }
  await catalogRepo.reorderCategories(associationId, ids);
  return new Response(null, { status: 204 });
}
