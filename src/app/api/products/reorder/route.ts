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

  const cats = await catalogRepo.listCategories(associationId);
  const allProducts = (
    await Promise.all(cats.map((cat) => catalogRepo.listProducts(cat.id)))
  ).flat();
  const productIds = new Set(allProducts.map((p) => p.id));
  if (ids.some((id: string) => !productIds.has(id))) {
    return new Response('One or more product ids not found', { status: 404 });
  }
  const categoryId = allProducts.find((p) => p.id === ids[0])?.categoryId ?? '';
  await catalogRepo.reorderProducts(categoryId, ids);
  return new Response(null, { status: 204 });
}
