import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const associationId = (session.user as any).associationId as string;
  const { searchParams } = request.nextUrl;
  const categoryId = searchParams.get('categoryId');

  const products = await prisma.product.findMany({
    where: {
      category: { associationId },
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { displayOrder: 'asc' },
    include: {
      variantGroups: {
        orderBy: { displayOrder: 'asc' },
        include: { options: { orderBy: { displayOrder: 'asc' } } },
      },
      modifiers: { orderBy: { displayOrder: 'asc' } },
    },
  });

  return Response.json(products);
}

export async function POST(request: NextRequest) {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const body = await request.json();
  const {
    name,
    categoryId,
    defaultPrice,
    description,
    customerImageUrl,
    allergens,
    dietaryFlags,
    ageRestricted,
    splittable,
    requiresPreparation,
    displayOrder,
    ingredients,
    preparationInstructions,
    variantGroups,
    modifiers,
  } = body;

  if (!name || !categoryId || defaultPrice === undefined) {
    return new Response('name, categoryId, and defaultPrice are required', { status: 400 });
  }

  // Verify categoryId belongs to this association
  const category = await prisma.category.findFirst({
    where: { id: categoryId, associationId },
  });
  if (!category) return new Response('Category not found', { status: 404 });

  // Auto-assign displayOrder if not provided
  let order = displayOrder;
  if (order === undefined) {
    const max = await prisma.product.findFirst({
      where: { categoryId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    order = (max?.displayOrder ?? -1) + 1;
  }

  const product = await prisma.product.create({
    data: {
      name,
      categoryId,
      defaultPrice,
      description: description ?? null,
      customerImageUrl: customerImageUrl ?? null,
      allergens: allergens ?? [],
      dietaryFlags: dietaryFlags ?? [],
      ageRestricted: ageRestricted ?? false,
      splittable: splittable ?? false,
      requiresPreparation: requiresPreparation ?? false,
      displayOrder: order,
      ingredients: ingredients ?? null,
      preparationInstructions: preparationInstructions ?? null,
      variantGroups: variantGroups?.length
        ? {
            create: variantGroups.map((vg: any, vgIdx: number) => ({
              name: vg.name,
              displayOrder: vg.displayOrder ?? vgIdx,
              options: {
                create:
                  vg.options?.map((opt: any, optIdx: number) => ({
                    name: opt.name,
                    priceDelta: opt.priceDelta ?? 0,
                    allergens: opt.allergens ?? [],
                    displayOrder: opt.displayOrder ?? optIdx,
                  })) ?? [],
              },
            })),
          }
        : undefined,
      modifiers: modifiers?.length
        ? {
            create: modifiers.map((mod: any, modIdx: number) => ({
              name: mod.name,
              price: mod.price ?? 0,
              allergens: mod.allergens ?? [],
              displayOrder: mod.displayOrder ?? modIdx,
            })),
          }
        : undefined,
    },
    include: {
      variantGroups: {
        orderBy: { displayOrder: 'asc' },
        include: { options: { orderBy: { displayOrder: 'asc' } } },
      },
      modifiers: { orderBy: { displayOrder: 'asc' } },
    },
  });

  return Response.json(product, { status: 201 });
}
