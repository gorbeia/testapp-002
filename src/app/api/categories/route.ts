import { auth } from '@/lib/auth';
import { catalogRepo } from '@/lib/store';
import type { NextRequest } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const associationId = (session.user as any).associationId as string;

  const cats = await catalogRepo.listCategories(associationId);
  const categories = await Promise.all(
    cats.map(async (cat) => {
      const products = await catalogRepo.listProducts(cat.id);
      return {
        ...cat,
        products: products.map((p) => ({
          ...p,
          customerImageUrl: p.imageUrl,
          ingredients: p.removableIngredients.join(', ') || null,
        })),
      };
    })
  );
  return Response.json(categories);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const body = await request.json();
  const { name, type } = body;

  if (!name || !type) {
    return new Response('name and type are required', { status: 400 });
  }

  const category = await catalogRepo.createCategory({ name, type, associationId });
  return Response.json(category, { status: 201 });
}
