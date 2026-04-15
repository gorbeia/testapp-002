import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

async function getProductForAssociation(productId: string, associationId: string) {
  return prisma!.product.findFirst({
    where: { id: productId, category: { associationId } },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const associationId = (session.user as any).associationId as string;
  const { productId } = await params;

  const product = await prisma.product.findFirst({
    where: { id: productId, category: { associationId } },
    include: {
      variantGroups: {
        orderBy: { displayOrder: 'asc' },
        include: { options: { orderBy: { displayOrder: 'asc' } } },
      },
      modifiers: { orderBy: { displayOrder: 'asc' } },
    },
  });

  if (!product) return new Response('Not found', { status: 404 });

  return Response.json(product);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const { productId } = await params;
  const existing = await getProductForAssociation(productId, associationId);
  if (!existing) return new Response('Not found', { status: 404 });

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

  // If categoryId provided, verify it belongs to the association
  if (categoryId) {
    const category = await prisma.category.findFirst({ where: { id: categoryId, associationId } });
    if (!category) return new Response('Category not found', { status: 404 });
  }

  // Replace nested data in a transaction
  const product = await prisma.$transaction(async (tx) => {
    // Delete and recreate variant groups + options
    if (variantGroups !== undefined) {
      await tx.variantGroup.deleteMany({ where: { productId } });
    }

    // Delete and recreate modifiers
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
        ...(variantGroups !== undefined && variantGroups.length > 0 && {
          variantGroups: {
            create: variantGroups.map((vg: any, vgIdx: number) => ({
              name: vg.name,
              displayOrder: vg.displayOrder ?? vgIdx,
              options: {
                create: vg.options?.map((opt: any, optIdx: number) => ({
                  name: opt.name,
                  priceDelta: opt.priceDelta ?? 0,
                  allergens: opt.allergens ?? [],
                  displayOrder: opt.displayOrder ?? optIdx,
                })) ?? [],
              },
            })),
          },
        }),
        ...(modifiers !== undefined && modifiers.length > 0 && {
          modifiers: {
            create: modifiers.map((mod: any, modIdx: number) => ({
              name: mod.name,
              price: mod.price ?? 0,
              allergens: mod.allergens ?? [],
              displayOrder: mod.displayOrder ?? modIdx,
            })),
          },
        }),
      },
      include: {
        variantGroups: {
          orderBy: { displayOrder: 'asc' },
          include: { options: { orderBy: { displayOrder: 'asc' } } },
        },
        modifiers: { orderBy: { displayOrder: 'asc' } },
      },
    });
  });

  return Response.json(product);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const { productId } = await params;
  const existing = await getProductForAssociation(productId, associationId);
  if (!existing) return new Response('Not found', { status: 404 });

  // Reject if referenced by any OrderLine
  const orderLineCount = await prisma.orderLine.count({ where: { productId } });
  if (orderLineCount > 0) {
    return new Response('Product has existing orders and cannot be deleted', { status: 409 });
  }

  await prisma.product.delete({ where: { id: productId } });

  return new Response(null, { status: 204 });
}
