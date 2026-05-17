import { auth } from '@/lib/auth';
import { catalogRepo, txosnaRepo } from '@/lib/store';
import type { NextRequest } from 'next/server';

// GET /api/txosnak/[slug]/products
// Returns the full master catalog annotated with per-txosna TxosnaProduct data
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const associationId = (session.user as any).associationId as string;
  const { slug } = await params;

  const txosna = await txosnaRepo.findById(slug);
  if (!txosna || txosna.associationId !== associationId) {
    return new Response('Not found', { status: 404 });
  }

  const txosnaId = txosna.id;
  const [cats, txosnaProducts] = await Promise.all([
    catalogRepo.listCategories(associationId),
    catalogRepo.listTxosnaProducts(txosnaId),
  ]);

  const tpMap = new Map(txosnaProducts.map((tp) => [tp.productId, tp]));

  const categories = await Promise.all(
    cats.map(async (cat) => {
      const products = await catalogRepo.listProducts(cat.id);
      return {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        displayOrder: cat.displayOrder,
        products: products.map((p) => ({
          ...p,
          customerImageUrl: p.imageUrl,
          ingredients: p.removableIngredients.join(', ') || null,
          txosnaProduct: tpMap.get(p.id) ?? null,
        })),
      };
    })
  );
  return Response.json(categories);
}
