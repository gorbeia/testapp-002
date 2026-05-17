import { auth } from '@/lib/auth';
import { catalogRepo } from '@/lib/store';
import type { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const associationId = (session.user as any).associationId as string;
  const { categoryId } = await params;

  const cat = await catalogRepo.findCategory(categoryId);
  if (!cat || cat.associationId !== associationId) {
    return new Response('Not found', { status: 404 });
  }
  const products = await catalogRepo.listProducts(categoryId);
  return Response.json({
    ...cat,
    products: products.map((p) => ({
      ...p,
      customerImageUrl: p.imageUrl,
      ingredients: p.removableIngredients.join(', ') || null,
    })),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const { categoryId } = await params;
  const body = await request.json();
  const { name, type, displayOrder } = body;

  const cat = await catalogRepo.findCategory(categoryId);
  if (!cat || cat.associationId !== associationId) {
    return new Response('Not found', { status: 404 });
  }
  const updated = await catalogRepo.updateCategory(categoryId, {
    ...(name !== undefined && { name }),
    ...(type !== undefined && { type }),
    ...(displayOrder !== undefined && { displayOrder }),
  });
  return Response.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const { categoryId } = await params;

  const cat = await catalogRepo.findCategory(categoryId);
  if (!cat || cat.associationId !== associationId) {
    return new Response('Not found', { status: 404 });
  }
  const catProducts = await catalogRepo.listProducts(categoryId);
  if (catProducts.length > 0) {
    return new Response('Category has products and cannot be deleted', { status: 409 });
  }
  await catalogRepo.deleteCategory(categoryId);
  return new Response(null, { status: 204 });
}
