import { auth } from '@/lib/auth';
import { ticketBaiInvoiceRepo } from '@/lib/store';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ associationId: string }> }
) {
  const { associationId } = await params;

  let sessionAssocId: string;
  let role: string;

  if (process.env.PROTO_MODE === 'true') {
    sessionAssocId =
      ((global as Record<string, unknown>).__TEST_ASSOCIATION_ID__ as string) ?? 'assoc-1';
    role = ((global as Record<string, unknown>).__TEST_ROLE__ as string) ?? 'ADMIN';
  } else {
    const session = await auth();
    if (!session?.user) return new Response('Unauthorized', { status: 401 });
    const user = session.user as { role: string; associationId: string };
    sessionAssocId = user.associationId;
    role = user.role;
  }

  if (sessionAssocId !== associationId) return new Response('Forbidden', { status: 403 });
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const invoices = await ticketBaiInvoiceRepo.listByAssociation(associationId);
  return NextResponse.json(invoices);
}
