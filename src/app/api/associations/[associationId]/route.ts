import { auth } from '@/lib/auth';
import { associationRepo } from '@/lib/store';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

async function resolveSession(
  associationId: string
): Promise<{ associationId: string; role: string } | Response> {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  const { role, associationId: sessionAssocId } = session.user as {
    role: string;
    associationId: string;
  };
  if (sessionAssocId !== associationId) return new Response('Forbidden', { status: 403 });
  return { associationId: sessionAssocId, role };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
) {
  const { associationId } = await params;
  const resolved = await resolveSession(associationId);
  if (resolved instanceof Response) return resolved;

  const association = await associationRepo.findById(associationId);
  if (!association) return new Response('Not found', { status: 404 });

  return NextResponse.json(association);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
) {
  const { associationId } = await params;
  const resolved = await resolveSession(associationId);
  if (resolved instanceof Response) return resolved;
  if (resolved.role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const body = (await request.json()) as {
    name?: string;
    phone?: string;
    cif?: string;
    ticketBaiEnabled?: boolean;
  };
  const { name, phone, cif, ticketBaiEnabled } = body;

  try {
    const association = await associationRepo.update(associationId, {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(cif !== undefined && { cif }),
      ...(ticketBaiEnabled !== undefined && { ticketBaiEnabled }),
    });
    return NextResponse.json(association);
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
