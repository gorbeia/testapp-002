/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { paymentProviderRepo } from '@/lib/store';

async function resolveSession(sessionAssocId: string, urlAssocId: string) {
  if (sessionAssocId !== urlAssocId) return null;
  return sessionAssocId;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
) {
  const { associationId } = await params;

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

  if (!(await resolveSession(sessionAssociationId, associationId))) {
    return new Response('Forbidden', { status: 403 });
  }

  const providers = await paymentProviderRepo.listByAssociation(associationId);
  const safe = providers.map(({ credentials: _c, ...rest }) => rest);
  return NextResponse.json(safe);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
) {
  const { associationId } = await params;

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

  if (!(await resolveSession(sessionAssociationId, associationId))) {
    return new Response('Forbidden', { status: 403 });
  }

  const body = await req.json();
  const { providerType, displayName, testMode, credentials, bizumEnabled } = body;

  if (!providerType || !['STRIPE', 'REDSYS'].includes(providerType)) {
    return NextResponse.json({ error: 'Invalid providerType' }, { status: 400 });
  }

  const provider = await paymentProviderRepo.create({
    associationId,
    providerType,
    displayName,
    testMode: testMode ?? true,
    credentials: credentials ?? {},
    bizumEnabled: bizumEnabled ?? false,
  });

  const { credentials: _c, ...safe } = provider;
  return NextResponse.json(safe, { status: 201 });
}
