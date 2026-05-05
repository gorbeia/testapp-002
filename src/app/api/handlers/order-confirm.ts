import { auth } from '@/lib/auth';
import { confirmOrder } from '@/lib/confirm-order';

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const session = await auth();
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const volunteerId = (session.user as { id?: string }).id ?? null;
  const associationId = (session.user as { associationId?: string }).associationId ?? null;

  const result = await confirmOrder(orderId, volunteerId, associationId);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result.order, { status: 200 });
}
