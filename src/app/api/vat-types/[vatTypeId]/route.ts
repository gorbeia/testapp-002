import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ vatTypeId: string }> }
) {
  const { vatTypeId } = await params;
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { role, associationId: sessionAssociationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const body = await request.json();
  const { label, percentage } = body;

  try {
    const existing = await prisma.vatType.findUnique({ where: { id: vatTypeId } });
    if (!existing) return new Response('VAT type not found', { status: 404 });
    if (existing.associationId !== sessionAssociationId)
      return new Response('Forbidden', { status: 403 });

    const vatType = await prisma.vatType.update({
      where: { id: vatTypeId },
      data: {
        ...(label && { label }),
        ...(percentage !== undefined && { percentage: parseFloat(percentage) }),
      },
    });

    return Response.json(vatType);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return new Response('VAT type with this label already exists', { status: 400 });
    }
    if (error.code === 'P2025') {
      return new Response('VAT type not found', { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ vatTypeId: string }> }
) {
  const { vatTypeId } = await params;
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { role, associationId: sessionAssociationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const existing = await prisma.vatType.findUnique({ where: { id: vatTypeId } });
  if (!existing) return new Response('VAT type not found', { status: 404 });
  if (existing.associationId !== sessionAssociationId)
    return new Response('Forbidden', { status: 403 });

  // Check if any products reference this VAT type
  const productCount = await prisma.product.count({
    where: { vatTypeId },
  });

  if (productCount > 0) {
    return new Response(`Cannot delete VAT type: ${productCount} product(s) still assigned to it`, {
      status: 409,
    });
  }

  try {
    await prisma.vatType.delete({
      where: { id: vatTypeId },
    });

    return new Response('', { status: 204 });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return new Response('VAT type not found', { status: 404 });
    }
    throw error;
  }
}
