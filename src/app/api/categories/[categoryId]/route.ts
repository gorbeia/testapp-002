import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

async function getSessionAndCategory(categoryId: string) {
  const session = await auth();
  if (!session?.user) return { error: new Response('Unauthorized', { status: 401 }) };

  const associationId = (session.user as any).associationId as string;

  const category = await prisma!.category.findFirst({
    where: { id: categoryId, associationId },
  });
  if (!category) return { error: new Response('Not found', { status: 404 }) };

  return { session, category, associationId };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const { categoryId } = await params;
  const result = await getSessionAndCategory(categoryId);
  if ('error' in result) return result.error;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      products: {
        orderBy: { displayOrder: 'asc' },
        include: {
          variantGroups: {
            orderBy: { displayOrder: 'asc' },
            include: { options: { orderBy: { displayOrder: 'asc' } } },
          },
          modifiers: { orderBy: { displayOrder: 'asc' } },
        },
      },
    },
  });

  return Response.json(category);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const { categoryId } = await params;
  const category = await prisma.category.findFirst({ where: { id: categoryId, associationId } });
  if (!category) return new Response('Not found', { status: 404 });

  const body = await request.json();
  const { name, type, displayOrder } = body;

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(displayOrder !== undefined && { displayOrder }),
    },
  });

  return Response.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const { categoryId } = await params;
  const category = await prisma.category.findFirst({ where: { id: categoryId, associationId } });
  if (!category) return new Response('Not found', { status: 404 });

  const productCount = await prisma.product.count({ where: { categoryId } });
  if (productCount > 0) {
    return new Response('Category has products and cannot be deleted', { status: 409 });
  }

  await prisma.category.delete({ where: { id: categoryId } });

  return new Response(null, { status: 204 });
}
