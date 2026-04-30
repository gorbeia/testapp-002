import { auth } from '@/lib/auth';
import { ticketBaiConfigRepo } from '@/lib/store';
import type { TicketBaiProviderType } from '@/lib/store/types';
import { createTicketBaiProvider } from '@/lib/ticketbai';
import { NextResponse } from 'next/server';

const DEFAULT_CONFIG = { providerType: 'MOCK' as TicketBaiProviderType, series: 'TB' };

async function resolveSession(
  associationId: string
): Promise<{ associationId: string; role: string } | Response> {
  if (process.env.PROTO_MODE === 'true') {
    return {
      associationId:
        ((global as Record<string, unknown>).__TEST_ASSOCIATION_ID__ as string) ?? 'assoc-1',
      role: ((global as Record<string, unknown>).__TEST_ROLE__ as string) ?? 'ADMIN',
    };
  }
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
  _request: Request,
  { params }: { params: Promise<{ associationId: string }> }
) {
  const { associationId } = await params;
  const resolved = await resolveSession(associationId);
  if (resolved instanceof Response) return resolved;
  if (resolved.role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const config = await ticketBaiConfigRepo.findByAssociation(associationId);
  return NextResponse.json(config ?? { ...DEFAULT_CONFIG, associationId, id: null });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ associationId: string }> }
) {
  const { associationId } = await params;
  const resolved = await resolveSession(associationId);
  if (resolved instanceof Response) return resolved;
  if (resolved.role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const body = await request.json();
  const { providerType, series, credentials } = body as {
    providerType?: TicketBaiProviderType;
    series?: string;
    credentials?: Record<string, string>;
  };

  if (providerType !== undefined && providerType !== 'MOCK') {
    return NextResponse.json({ error: `Unknown providerType: ${providerType}` }, { status: 422 });
  }

  if (series !== undefined && (typeof series !== 'string' || series.trim() === '')) {
    return NextResponse.json({ error: 'series must be a non-empty string' }, { status: 422 });
  }

  const config = await ticketBaiConfigRepo.upsert(associationId, {
    ...(providerType !== undefined && { providerType }),
    ...(series !== undefined && { series: series.trim() }),
    ...(credentials !== undefined && { credentials }),
  });

  return NextResponse.json(config);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ associationId: string }> }
) {
  const { associationId } = await params;
  const resolved = await resolveSession(associationId);
  if (resolved instanceof Response) return resolved;
  if (resolved.role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const config = await ticketBaiConfigRepo.findByAssociation(associationId);
  if (!config) {
    return NextResponse.json({ error: 'No TicketBAI config found' }, { status: 404 });
  }

  const provider = createTicketBaiProvider(config);
  const result = await provider.validate();
  return NextResponse.json(result);
}
