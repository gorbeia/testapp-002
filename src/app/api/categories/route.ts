import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

export async function GET() {
  let associationId: string;
  if (process.env.PROTO_MODE === 'true') {
    associationId = (global as any).__TEST_ASSOCIATION_ID__ ?? 'assoc-1';
  } else {
    const session = await auth();
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    associationId = (session.user as any).associationId as string;
  }

  if (!prisma) {
    const { catalogRepo } = await import('@/lib/store');
    const cats = await catalogRepo.listCategories(associationId);
    const categories = await Promise.all(
      cats.map(async (cat) => {
        const products = await catalogRepo.listProducts(cat.id);
        return {
          ...cat,
          products: products.map((p) => ({
            ...p,
            defaultPrice: p.defaultPrice,
            customerImageUrl: p.imageUrl,
            ingredients: p.removableIngredients.join(', ') || null,
          })),
        };
      })
    );
    return Response.json(categories);
  }

  const categories = await prisma.category.findMany({
    where: { associationId },
    orderBy: { displayOrder: 'asc' },
    include: {
      products: {
        orderBy: { displayOrder: 'asc' },
        include: {
          variantGroups: {
            orderBy: { displayOrder: 'asc' },
            include: {
              options: { orderBy: { displayOrder: 'asc' } },
            },
          },
          modifiers: { orderBy: { displayOrder: 'asc' } },
        },
      },
    },
  });

  return Response.json(categories);
}

export async function POST(request: NextRequest) {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const body = await request.json();
  const { name, type } = body;

  if (!name || !type) {
    return new Response('name and type are required', { status: 400 });
  }

  // Auto-assign displayOrder as max + 1
  const max = await prisma.category.findFirst({
    where: { associationId },
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });

  const category = await prisma.category.create({
    data: {
      name,
      type,
      displayOrder: (max?.displayOrder ?? -1) + 1,
      associationId,
    },
  });

  return Response.json(category, { status: 201 });
}
