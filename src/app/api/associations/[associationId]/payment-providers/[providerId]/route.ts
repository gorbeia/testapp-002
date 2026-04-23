/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { paymentProviderRepo } from '@/lib/store';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ associationId: string; providerId: string }> }
) {
  const { associationId, providerId } = await params;

  let sessionAssociationId: string;
  if (process.env.PROTO_MODE === 'true') {
    sessionAssociationId = (global as any).__TEST_ASSOCIATION_ID__ ?? 'assoc-1';
  } else {
    const session = await auth();
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    const user = session.user as any;
    if (user.role !== 'ADMIN') return new Response('Forbidden', { status: 403 });
    sessionAssociationId = user.associationId;
  }

  if (sessionAssociationId !== associationId) return new Response('Forbidden', { status: 403 });

  const provider = await paymentProviderRepo.findById(providerId);
  if (!provider) return new Response('Not found', { status: 404 });
  if (provider.associationId !== associationId) return new Response('Forbidden', { status: 403 });

  const body = await req.json();
  const { displayName, enabled, testMode, credentials, bizumEnabled } = body;

  const updated = await paymentProviderRepo.update(providerId, {
    ...(displayName !== undefined && { displayName }),
    ...(enabled !== undefined && { enabled }),
    ...(testMode !== undefined && { testMode }),
    ...(credentials !== undefined && { credentials }),
    ...(bizumEnabled !== undefined && { bizumEnabled }),
  });

  const { credentials: _c, ...safe } = updated;
  return NextResponse.json(safe);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ associationId: string; providerId: string }> }
) {
  const { associationId, providerId } = await params;

  let sessionAssociationId: string;
  if (process.env.PROTO_MODE === 'true') {
    sessionAssociationId = (global as any).__TEST_ASSOCIATION_ID__ ?? 'assoc-1';
  } else {
    const session = await auth();
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    const user = session.user as any;
    if (user.role !== 'ADMIN') return new Response('Forbidden', { status: 403 });
    sessionAssociationId = user.associationId;
  }

  if (sessionAssociationId !== associationId) return new Response('Forbidden', { status: 403 });

  const provider = await paymentProviderRepo.findById(providerId);
  if (!provider) return new Response('Not found', { status: 404 });
  if (provider.associationId !== associationId) return new Response('Forbidden', { status: 403 });

  await paymentProviderRepo.delete(providerId);
  return new Response(null, { status: 204 });
}
