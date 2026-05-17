import { auth } from '@/lib/auth';
import { vatTypeRepo } from '@/lib/store';
import type { NextRequest } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const associationId = (session.user as any).associationId as string;

  const vatTypes = await vatTypeRepo.list(associationId);
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

  const existing = await vatTypeRepo.findByLabel(associationId, label);
  if (existing) {
    return new Response(`VAT type "${label}" already exists for this association`, { status: 400 });
  }

  const vatType = await vatTypeRepo.create({
    associationId,
    label,
    percentage: parseFloat(percentage),
  });
  return Response.json(vatType, { status: 201 });
}
