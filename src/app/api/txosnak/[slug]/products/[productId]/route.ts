import { auth } from '@/lib/auth';
import { catalogRepo, txosnaRepo } from '@/lib/store';
import type { NextRequest } from 'next/server';

// PUT /api/txosnak/[slug]/products/[productId]
// Upsert or delete a TxosnaProduct entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; productId: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const { slug, productId } = await params;
  const txosnaId = slug;

  const body = await request.json();
  const { enabled, priceOverride, preparationInstructions } = body;

  const txosna = await txosnaRepo.findById(txosnaId);
  if (!txosna || txosna.associationId !== associationId) {
    return new Response('Not found', { status: 404 });
  }
  const product = await catalogRepo.getProduct(productId);
  if (!product) return new Response('Product not found', { status: 404 });
  const cat = await catalogRepo.findCategory(product.categoryId);
  if (!cat || cat.associationId !== associationId) {
    return new Response('Product not found', { status: 404 });
  }

  if (enabled === false) {
    await catalogRepo.deleteTxosnaProduct(txosnaId, productId);
    return new Response(null, { status: 204 });
  }

  const tp = await catalogRepo.upsertTxosnaProduct(txosnaId, productId, {
    available: true,
    soldOut: false,
    priceOverride: priceOverride ?? null,
    preparationInstructions: preparationInstructions ?? null,
  });
  return Response.json(tp);
}
