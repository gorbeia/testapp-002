import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

// PUT /api/txosnak/[txosnaId]/products/[productId]
// Upsert or delete a TxosnaProduct entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ txosnaId: string; productId: string }> }
) {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const { txosnaId, productId } = await params;

  // Verify txosna belongs to this association
  const txosna = await prisma.txosna.findFirst({ where: { id: txosnaId, associationId } });
  if (!txosna) return new Response('Not found', { status: 404 });

  // Verify product belongs to this association
  const product = await prisma.product.findFirst({
    where: { id: productId, category: { associationId } },
  });
  if (!product) return new Response('Product not found', { status: 404 });

  const body = await request.json();
  const { enabled, priceOverride, preparationInstructions } = body;

  if (enabled === false) {
    // Remove TxosnaProduct if it exists
    await prisma.txosnaProduct.deleteMany({ where: { txosnaId, productId } });
    return new Response(null, { status: 204 });
  }

  // Upsert TxosnaProduct
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
