import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

export async function GET() {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const associationId = (session.user as any).associationId as string;

  const vatTypes = await prisma.vatType.findMany({
    where: { associationId },
    orderBy: { percentage: 'asc' },
  });

  return Response.json(vatTypes);
}

export async function POST(request: NextRequest) {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { role, associationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const body = await request.json();
  const { label, percentage } = body;

  if (!label || percentage === undefined) {
    return new Response('label and percentage are required', { status: 400 });
  }

  try {
    const vatType = await prisma.vatType.create({
      data: {
        label,
        percentage: parseFloat(percentage),
        associationId,
      },
    });

    return Response.json(vatType, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return new Response(`VAT type "${label}" already exists for this association`, {
        status: 400,
      });
    }
    throw error;
  }
}
