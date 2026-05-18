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

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const associationId = (session.user as any).associationId as string;
  const { searchParams } = request.nextUrl;
  const categoryId = searchParams.get('categoryId');

  if (categoryId) {
    const cat = await catalogRepo.findCategory(categoryId);
    if (!cat || cat.associationId !== associationId) return Response.json([]);
    const products = await catalogRepo.listProducts(categoryId);
    return Response.json(products.map(shapeProduct));
  }
  const cats = await catalogRepo.listCategories(associationId);
  const products = (await Promise.all(cats.map((cat) => catalogRepo.listProducts(cat.id)))).flat();
  return Response.json(products.map(shapeProduct));
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
    splitMaxWays,
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

  const cat = await catalogRepo.findCategory(categoryId);
  if (!cat || cat.associationId !== associationId) {
    return new Response('Category not found', { status: 404 });
  }

  const association = await associationRepo.findById(associationId);
  if (association?.ticketBaiEnabled && !vatTypeId) {
    return new Response('vatTypeId is required when TicketBAI is enabled', { status: 400 });
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
    splitMaxWays,
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
