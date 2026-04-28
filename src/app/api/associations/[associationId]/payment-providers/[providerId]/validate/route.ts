/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { paymentProviderRepo } from '@/lib/store';
import { createPaymentProvider } from '@/lib/payments';

export async function POST(
  _req: Request,
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

  if (sessionAssociationId !== associationId) {
    return new Response('Forbidden', { status: 403 });
  }

  const provider = await paymentProviderRepo.findById(providerId);
  if (!provider) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (provider.associationId !== associationId) {
    return new Response('Forbidden', { status: 403 });
  }

  let result: { ok: boolean; error?: string };
  try {
    result = await createPaymentProvider(provider).validate();
  } catch (err) {
    result = { ok: false, error: err instanceof Error ? err.message : 'Validation failed' };
  }

  if (result.ok) {
    await paymentProviderRepo.update(providerId, { verifiedAt: new Date() });
  }

  return NextResponse.json(result);
}
