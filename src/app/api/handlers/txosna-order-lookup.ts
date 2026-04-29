import { NextRequest, NextResponse } from 'next/server';
import { orderRepo, txosnaRepo, ticketRepo } from '@/lib/store';

// Simple sliding-window rate limiter: max 20 requests per IP per slug per 60 seconds.
const rateLimitWindows = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const window = 60_000;
  const max = 20;
  const timestamps = (rateLimitWindows.get(key) ?? []).filter((t) => now - t < window);
  if (timestamps.length >= max) return true;
  timestamps.push(now);
  rateLimitWindows.set(key, timestamps);
  return false;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(`${ip}:${slug}`)) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });
  }

  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'missing_code' }, { status: 400 });
  }

  const txosna = await txosnaRepo.findBySlug(slug);
  if (!txosna || !txosna.mobileTrackingEnabled) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const order = await orderRepo.findByVerificationCode(txosna.id, code);
  if (!order) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const tickets = await ticketRepo.listByOrder(order.id);

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    status: order.status,
    confirmedAt: order.confirmedAt,
    tickets: tickets.map((t) => ({
      id: t.id,
      counterType: t.counterType,
      status: t.status,
    })),
  });
}
