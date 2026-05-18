import { auth } from '@/lib/auth';
import { associationRepo, catalogRepo } from '@/lib/store';
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

  const product = await catalogRepo.getProduct(productId);
  if (!product) return new Response('Not found', { status: 404 });
  const cat = await catalogRepo.findCategory(product.categoryId);
  if (!cat || cat.associationId !== associationId)
    return new Response('Not found', { status: 404 });
  return Response.json(shapeProduct(product));
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
    splitMaxWays,
    requiresPreparation,
    displayOrder,
    ingredients,
    preparationInstructions,
    variantGroups,
    modifiers,
    vatTypeId,
  } = body;

  const existing = await catalogRepo.getProduct(productId);
  if (!existing) return new Response('Not found', { status: 404 });
  const cat = await catalogRepo.findCategory(existing.categoryId);
  if (!cat || cat.associationId !== associationId)
    return new Response('Not found', { status: 404 });

  const association = await associationRepo.findById(associationId);
  if (association?.ticketBaiEnabled && vatTypeId === null && existing.vatTypeId) {
    return new Response('vatTypeId cannot be removed when TicketBAI is enabled', { status: 400 });
  }
  if (association?.ticketBaiEnabled && !vatTypeId && !existing.vatTypeId) {
    return new Response('vatTypeId is required when TicketBAI is enabled', { status: 400 });
  }

  if (categoryId) {
    const newCat = await catalogRepo.findCategory(categoryId);
    if (!newCat || newCat.associationId !== associationId)
      return new Response('Category not found', { status: 404 });
  }

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
    splitMaxWays,
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

  const existing = await catalogRepo.getProduct(productId);
  if (!existing) return new Response('Not found', { status: 404 });
  const cat = await catalogRepo.findCategory(existing.categoryId);
  if (!cat || cat.associationId !== associationId)
    return new Response('Not found', { status: 404 });

  await catalogRepo.deleteProduct(productId);
  return new Response(null, { status: 204 });
}
