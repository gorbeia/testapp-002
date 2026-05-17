import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

  if (!prisma) {
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

  const txosna = await prisma.txosna.findFirst({ where: { id: txosnaId, associationId } });
  if (!txosna) return new Response('Not found', { status: 404 });

  const product = await prisma.product.findFirst({
    where: { id: productId, category: { associationId } },
  });
  if (!product) return new Response('Product not found', { status: 404 });

  if (enabled === false) {
    await prisma.txosnaProduct.deleteMany({ where: { txosnaId, productId } });
    return new Response(null, { status: 204 });
  }

  const txosnaProduct = await prisma.txosnaProduct.upsert({
    where: { txosnaId_productId: { txosnaId, productId } },
    create: {
      txosnaId,
      productId,
      available: true,
      soldOut: false,
      priceOverride: priceOverride ?? null,
      preparationInstructions: preparationInstructions ?? null,
    },
    update: {
      priceOverride: priceOverride !== undefined ? priceOverride : undefined,
      preparationInstructions:
        preparationInstructions !== undefined ? preparationInstructions : undefined,
    },
  });

  return Response.json(txosnaProduct);
}
