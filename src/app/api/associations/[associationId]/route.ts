import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
) {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { associationId: sessionAssociationId } = session.user as any;
  const { associationId } = await params;

  if (associationId !== sessionAssociationId) {
    return new Response('Forbidden', { status: 403 });
  }

  const association = await prisma.association.findUnique({
    where: { id: associationId },
  });

  if (!association) return new Response('Not found', { status: 404 });

  return Response.json(association);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
) {
  if (!prisma) return new Response('Service unavailable', { status: 503 });

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { role, associationId: sessionAssociationId } = session.user as any;
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const { associationId } = await params;
  if (associationId !== sessionAssociationId) {
    return new Response('Forbidden', { status: 403 });
  }

  const body = await request.json();
  const { name, phone, cif, ticketBaiEnabled } = body;

  const association = await prisma.association.update({
    where: { id: associationId },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(cif !== undefined && { cif }),
      ...(ticketBaiEnabled !== undefined && { ticketBaiEnabled }),
    },
  });

  return Response.json(association);
}
