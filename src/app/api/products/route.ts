import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { catalogRepo } from '@/lib/store';
import type { StoredProduct } from '@/lib/store';
import type { NextRequest } from 'next/server';

function shapeProduct(p: StoredProduct) {
  return {
    ...p,
    customerImageUrl: p.imageUrl,
    ingredients: p.removableIngredients.join(', ') || null,
  };
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const associationId = (session.user as any).associationId as string;
  const { searchParams } = request.nextUrl;
  const categoryId = searchParams.get('categoryId');

  if (!prisma) {
    if (categoryId) {
      const cat = await catalogRepo.findCategory(categoryId);
      if (!cat || cat.associationId !== associationId) return Response.json([]);
      const products = await catalogRepo.listProducts(categoryId);
      return Response.json(products.map(shapeProduct));
    }
    const cats = await catalogRepo.listCategories(associationId);
    const products = (
      await Promise.all(cats.map((cat) => catalogRepo.listProducts(cat.id)))
    ).flat();
    return Response.json(products.map(shapeProduct));
  }

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
      vatType: true,
    },
  });

  return Response.json(products);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    vatTypeId,
  } = body;

  if (!name || !categoryId || defaultPrice === undefined) {
    return new Response('name, categoryId, and defaultPrice are required', { status: 400 });
  }

  if (!prisma) {
    const cat = await catalogRepo.findCategory(categoryId);
    if (!cat || cat.associationId !== associationId) {
      return new Response('Category not found', { status: 404 });
    }
    const product = await catalogRepo.createProduct({
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
      vatTypeId,
      variantGroups,
      modifiers,
    });
    return Response.json(shapeProduct(product), { status: 201 });
  }

  const association = await prisma.association.findUnique({ where: { id: associationId } });

  if (association?.ticketBaiEnabled && !vatTypeId) {
    return new Response('vatTypeId is required when TicketBAI is enabled', { status: 400 });
  }

  const category = await prisma.category.findFirst({ where: { id: categoryId, associationId } });
  if (!category) return new Response('Category not found', { status: 404 });

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
      vatTypeId: vatTypeId ?? null,
      variantGroups: variantGroups?.length
        ? {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            create: variantGroups.map((vg: any, vgIdx: number) => ({
              name: vg.name,
              displayOrder: vg.displayOrder ?? vgIdx,
              options: {
                create:
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      vatType: true,
    },
  });

  return Response.json(product, { status: 201 });
}
