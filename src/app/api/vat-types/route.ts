import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { vatTypeRepo } from '@/lib/store';
import type { NextRequest } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const associationId = (session.user as any).associationId as string;

  if (!prisma) {
    const vatTypes = await vatTypeRepo.list(associationId);
    return Response.json(vatTypes);
  }

  const vatTypes = await prisma.vatType.findMany({
    where: { associationId },
    orderBy: { percentage: 'asc' },
  });

  return Response.json(vatTypes);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const body = await request.json();
  const { label, percentage } = body;

  if (!label || percentage === undefined) {
    return new Response('label and percentage are required', { status: 400 });
  }

  if (!prisma) {
    const existing = await vatTypeRepo.findByLabel(associationId, label);
    if (existing) {
      return new Response(`VAT type "${label}" already exists for this association`, {
        status: 400,
      });
    }
    const vatType = await vatTypeRepo.create({
      associationId,
      label,
      percentage: parseFloat(percentage),
    });
    return Response.json(vatType, { status: 201 });
  }

  try {
    const vatType = await prisma.vatType.create({
      data: { label, percentage: parseFloat(percentage), associationId },
    });
    return Response.json(vatType, { status: 201 });
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === 'P2002') {
      return new Response(`VAT type "${label}" already exists for this association`, {
        status: 400,
      });
    }
    throw error;
  }
}
