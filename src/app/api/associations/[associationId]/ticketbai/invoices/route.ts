import { auth } from '@/lib/auth';
import { ticketBaiInvoiceRepo } from '@/lib/store';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ associationId: string }> }
) {
  const { associationId } = await params;

  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  const { role, associationId: sessionAssocId } = session.user as {
    role: string;
    associationId: string;
  };

  if (sessionAssocId !== associationId) return new Response('Forbidden', { status: 403 });
  if (role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  const invoices = await ticketBaiInvoiceRepo.listByAssociation(associationId);
  return NextResponse.json(invoices);
}
