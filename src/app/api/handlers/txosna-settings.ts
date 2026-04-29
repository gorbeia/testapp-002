/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { txosnaRepo } from '@/lib/store';
import { broadcast } from '@/lib/sse';

interface SessionUser {
  id: string;
  role: string;
  associationId: string;
  email: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  let role: string;
  let sessionAssociationId: string;
  if (process.env.PROTO_MODE === 'true') {
    role = (global as any).__TEST_ROLE__ ?? 'ADMIN';
    sessionAssociationId = (global as any).__TEST_ASSOCIATION_ID__ ?? 'assoc-1';
  } else {
    const session = await auth();
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    ({ role, associationId: sessionAssociationId } = session.user as SessionUser);
  }

  if (role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 });
  }

  const { slug }: { slug: string } = await params;
  const txosna = await txosnaRepo.findBySlug(slug);
  if (!txosna) {
    return new Response('Not Found', { status: 404 });
  }

  if (txosna.associationId !== sessionAssociationId) {
    return new Response('Forbidden', { status: 403 });
  }

  const settings = {
    status: txosna.status,
    waitMinutes: txosna.waitMinutes,
    counterSetup: txosna.counterSetup,
    kitchenPosts: txosna.kitchenPosts,
    enabledChannels: txosna.enabledChannels,
    enabledPaymentMethods: txosna.enabledPaymentMethods,
    printingEnabled: txosna.printingEnabled,
    mobileTrackingEnabled: txosna.mobileTrackingEnabled,
    pendingPaymentTimeout: txosna.pendingPaymentTimeout,
  };

  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  let role: string;
  let sessionAssociationId: string;
  if (process.env.PROTO_MODE === 'true') {
    role = (global as any).__TEST_ROLE__ ?? 'ADMIN';
    sessionAssociationId = (global as any).__TEST_ASSOCIATION_ID__ ?? 'assoc-1';
  } else {
    const session = await auth();
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    ({ role, associationId: sessionAssociationId } = session.user as SessionUser);
  }

  if (role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 });
  }

  const { slug }: { slug: string } = await params;
  const txosna = await txosnaRepo.findBySlug(slug);
  if (!txosna) {
    return new Response('Not Found', { status: 404 });
  }

  if (txosna.associationId !== sessionAssociationId) {
    return new Response('Forbidden', { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  const whitelist = [
    'status',
    'waitMinutes',
    'counterSetup',
    'kitchenPosts',
    'enabledChannels',
    'enabledPaymentMethods',
    'printingEnabled',
    'mobileTrackingEnabled',
    'pendingPaymentTimeout',
  ];

  for (const key of whitelist) {
    if (key in body && body[key] !== undefined) {
      patch[key] = body[key];
    }
  }

  if (patch.status !== undefined) {
    const validStatuses = ['OPEN', 'PAUSED', 'CLOSED'];
    const status = patch.status as string;
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status value' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (patch.kitchenPosts !== undefined) {
    if (
      !Array.isArray(patch.kitchenPosts) ||
      (patch.kitchenPosts as unknown[]).some((p) => typeof p !== 'string')
    ) {
      return new Response(JSON.stringify({ error: 'kitchenPosts must be an array of strings' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const updated = await txosnaRepo.update(txosna.id, patch);

    if (patch.status === 'PAUSED' || patch.status === 'CLOSED') {
      broadcast(txosna.id, 'txosna:status_changed', { status: patch.status });
    }

    const settings = {
      status: updated.status,
      waitMinutes: updated.waitMinutes,
      counterSetup: updated.counterSetup,
      kitchenPosts: updated.kitchenPosts,
      enabledChannels: updated.enabledChannels,
      enabledPaymentMethods: updated.enabledPaymentMethods,
      printingEnabled: updated.printingEnabled,
      mobileTrackingEnabled: updated.mobileTrackingEnabled,
      pendingPaymentTimeout: updated.pendingPaymentTimeout,
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
