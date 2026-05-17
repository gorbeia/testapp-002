import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { vatTypeRepo } from '@/lib/store';
import type { NextRequest } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ vatTypeId: string }> }
) {
  const { vatTypeId } = await params;

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const body = await request.json();
  const { label, percentage } = body;

  if (!prisma) {
    const existing = await vatTypeRepo.findById(vatTypeId);
    if (!existing) return new Response('VAT type not found', { status: 404 });
    if (existing.associationId !== associationId) return new Response('Forbidden', { status: 403 });
    if (label) {
      const conflict = await vatTypeRepo.findByLabel(associationId, label);
      if (conflict && conflict.id !== vatTypeId) {
        return new Response('VAT type with this label already exists', { status: 400 });
      }
    }
    const updated = await vatTypeRepo.update(vatTypeId, {
      ...(label && { label }),
      ...(percentage !== undefined && { percentage: parseFloat(percentage) }),
    });
    return Response.json(updated);
  }

  try {
    const existing = await prisma.vatType.findUnique({ where: { id: vatTypeId } });
    if (!existing) return new Response('VAT type not found', { status: 404 });
    if (existing.associationId !== associationId) return new Response('Forbidden', { status: 403 });

    const vatType = await prisma.vatType.update({
      where: { id: vatTypeId },
      data: {
        ...(label && { label }),
        ...(percentage !== undefined && { percentage: parseFloat(percentage) }),
      },
    });

    return Response.json(vatType);
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = (error as any).code;
    if (code === 'P2002')
      return new Response('VAT type with this label already exists', { status: 400 });
    if (code === 'P2025') return new Response('VAT type not found', { status: 404 });
    throw error;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ vatTypeId: string }> }
) {
  const { vatTypeId } = await params;

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  if (!prisma) {
    const existing = await vatTypeRepo.findById(vatTypeId);
    if (!existing) return new Response('VAT type not found', { status: 404 });
    if (existing.associationId !== associationId) return new Response('Forbidden', { status: 403 });
    await vatTypeRepo.delete(vatTypeId);
    return new Response(null, { status: 204 });
  }

  const existing = await prisma.vatType.findUnique({ where: { id: vatTypeId } });
  if (!existing) return new Response('VAT type not found', { status: 404 });
  if (existing.associationId !== associationId) return new Response('Forbidden', { status: 403 });

  const productCount = await prisma.product.count({ where: { vatTypeId } });
  if (productCount > 0) {
    return new Response(`Cannot delete VAT type: ${productCount} product(s) still assigned to it`, {
      status: 409,
    });
  }

  try {
    await prisma.vatType.delete({ where: { id: vatTypeId } });
    return new Response(null, { status: 204 });
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === 'P2025') return new Response('VAT type not found', { status: 404 });
    throw error;
  }
}
