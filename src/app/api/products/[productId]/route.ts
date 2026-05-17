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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const associationId = (session.user as any).associationId as string;
  const { productId } = await params;

  if (!prisma) {
    const product = await catalogRepo.getProduct(productId);
    if (!product) return new Response('Not found', { status: 404 });
    const cat = await catalogRepo.findCategory(product.categoryId);
    if (!cat || cat.associationId !== associationId)
      return new Response('Not found', { status: 404 });
    return Response.json(shapeProduct(product));
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, category: { associationId } },
    include: {
      variantGroups: {
        orderBy: { displayOrder: 'asc' },
        include: { options: { orderBy: { displayOrder: 'asc' } } },
      },
      modifiers: { orderBy: { displayOrder: 'asc' } },
      vatType: true,
    },
  });

  if (!product) return new Response('Not found', { status: 404 });

  return Response.json(product);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const { productId } = await params;
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

  if (!prisma) {
    const existing = await catalogRepo.getProduct(productId);
    if (!existing) return new Response('Not found', { status: 404 });
    const cat = await catalogRepo.findCategory(existing.categoryId);
    if (!cat || cat.associationId !== associationId)
      return new Response('Not found', { status: 404 });
    const updated = await catalogRepo.updateProduct(productId, {
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
    });
    return Response.json(shapeProduct(updated));
  }

  const existing = await prisma.product.findFirst({
    where: { id: productId, category: { associationId } },
  });
  if (!existing) return new Response('Not found', { status: 404 });

  const association = await prisma.association.findUnique({ where: { id: associationId } });

  if (association?.ticketBaiEnabled && vatTypeId === null && existing.vatTypeId) {
    return new Response('vatTypeId cannot be removed when TicketBAI is enabled', { status: 400 });
  }

  if (association?.ticketBaiEnabled && !vatTypeId && !existing.vatTypeId) {
    return new Response('vatTypeId is required when TicketBAI is enabled', { status: 400 });
  }

  if (categoryId) {
    const category = await prisma.category.findFirst({ where: { id: categoryId, associationId } });
    if (!category) return new Response('Category not found', { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = await prisma.$transaction(async (tx: any) => {
    if (variantGroups !== undefined) {
      await tx.variantGroup.deleteMany({ where: { productId } });
    }
    if (modifiers !== undefined) {
      await tx.modifier.deleteMany({ where: { productId } });
    }

    return tx.product.update({
      where: { id: productId },
      data: {
        ...(name !== undefined && { name }),
        ...(categoryId !== undefined && { categoryId }),
        ...(defaultPrice !== undefined && { defaultPrice }),
        ...(description !== undefined && { description }),
        ...(customerImageUrl !== undefined && { customerImageUrl }),
        ...(allergens !== undefined && { allergens }),
        ...(dietaryFlags !== undefined && { dietaryFlags }),
        ...(ageRestricted !== undefined && { ageRestricted }),
        ...(splittable !== undefined && { splittable }),
        ...(requiresPreparation !== undefined && { requiresPreparation }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(ingredients !== undefined && { ingredients }),
        ...(preparationInstructions !== undefined && { preparationInstructions }),
        ...(variantGroups !== undefined &&
          variantGroups.length > 0 && {
            variantGroups: {
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
            },
          }),
        ...(modifiers !== undefined &&
          modifiers.length > 0 && {
            modifiers: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              create: modifiers.map((mod: any, modIdx: number) => ({
                name: mod.name,
                price: mod.price ?? 0,
                allergens: mod.allergens ?? [],
                displayOrder: mod.displayOrder ?? modIdx,
              })),
            },
          }),
        ...(vatTypeId !== undefined && { vatTypeId: vatTypeId ?? null }),
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
  });

  return Response.json(product);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const { productId } = await params;

  if (!prisma) {
    const existing = await catalogRepo.getProduct(productId);
    if (!existing) return new Response('Not found', { status: 404 });
    const cat = await catalogRepo.findCategory(existing.categoryId);
    if (!cat || cat.associationId !== associationId)
      return new Response('Not found', { status: 404 });
    await catalogRepo.deleteProduct(productId);
    return new Response(null, { status: 204 });
  }

  const existing = await prisma.product.findFirst({
    where: { id: productId, category: { associationId } },
  });
  if (!existing) return new Response('Not found', { status: 404 });

  const orderLineCount = await prisma.orderLine.count({ where: { productId } });
  if (orderLineCount > 0) {
    return new Response('Product has existing orders and cannot be deleted', { status: 409 });
  }

  await prisma.product.delete({ where: { id: productId } });

  return new Response(null, { status: 204 });
}
