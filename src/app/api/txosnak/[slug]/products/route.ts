import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

// GET /api/txosnak/[slug]/products
// Returns the full master catalog annotated with per-txosna TxosnaProduct data
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const associationId = (session.user as any).associationId as string;
  const { slug } = await params;

  // Verify txosna belongs to this association (slug is actually the txosna ID for admin routes)
  const txosna = await prisma.txosna.findFirst({ where: { id: slug, associationId } });
  if (!txosna) return new Response('Not found', { status: 404 });

  const txosnaId = txosna.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories: any[] = await prisma.category.findMany({
    where: { associationId },
    orderBy: { displayOrder: 'asc' },
    include: {
      products: {
        orderBy: { displayOrder: 'asc' },
        include: {
          variantGroups: {
            orderBy: { displayOrder: 'asc' },
            include: { options: { orderBy: { displayOrder: 'asc' } } },
          },
          modifiers: { orderBy: { displayOrder: 'asc' } },
          txosnaProducts: {
            where: { txosnaId },
          },
        },
      },
    },
  });

  // Shape: flatten txosnaProducts (at most one per product for this txosna) into txosnaProduct
  const shaped = categories.map((cat: (typeof categories)[number]) => ({
    id: cat.id,
    name: cat.name,
    type: cat.type,
    displayOrder: cat.displayOrder,
    products: cat.products.map((prod: (typeof cat.products)[number]) => {
      const { txosnaProducts, ...rest } = prod;
      return {
        ...rest,
        txosnaProduct: txosnaProducts[0] ?? null,
      };
    }),
  }));

  return Response.json(shaped);
}
