/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { txosnaRepo, orderRepo, ticketRepo } from '@/lib/store';

interface SessionUser {
  id: string;
  role: string;
  associationId: string;
  email: string;
}

interface ProductStat {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

interface ReportsResponse {
  period: string;
  ordersTotal: number;
  ordersConfirmed: number;
  ordersCancelled: number;
  revenue: number;
  avgOrderValue: number;
  topProducts: ProductStat[];
  ticketsByStatus: Record<string, number>;
}

function roundTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function getPeriodStartDate(period: string): Date | undefined {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'today') {
    return todayStart;
  }
  if (period === 'week') {
    // 6 days before midnight (7 days inclusive of today)
    return new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
  }
  if (period === 'all') {
    return undefined;
  }
  throw new Error('Invalid period');
}

/**
 * GET /api/txosnak/[slug]/reports
 * Fetch reports for a txosna. Requires ADMIN role.
 * Query param: period=today|week|all
 */
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

  const url = new URL(req.url);
  const periodParam = url.searchParams.get('period');
  if (!periodParam) {
    return new Response(JSON.stringify({ error: 'Missing period parameter' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let since: Date | undefined;
  try {
    since = getPeriodStartDate(periodParam);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid period value' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const orders = await orderRepo.listByTxosna(txosna.id, { since });
    const allTickets = await ticketRepo.listByTxosna(txosna.id);

    // Compute order-level stats
    const ordersTotal = orders.length;
    const ordersConfirmed = orders.filter((o) => o.status === 'CONFIRMED').length;
    const ordersCancelled = orders.filter((o) => o.status === 'CANCELLED').length;

    // Revenue from confirmed orders only
    const revenue = roundTwoDecimals(
      orders.filter((o) => o.status === 'CONFIRMED').reduce((sum, o) => sum + o.total, 0)
    );

    const avgOrderValue = ordersConfirmed > 0 ? roundTwoDecimals(revenue / ordersConfirmed) : 0;

    // Top products from confirmed order tickets
    const confirmedOrderIds = new Set(
      orders.filter((o) => o.status === 'CONFIRMED').map((o) => o.id)
    );

    const productMap = new Map<string, ProductStat>();
    for (const ticket of allTickets) {
      if (!confirmedOrderIds.has(ticket.orderId)) continue;
      for (const line of ticket.lines) {
        const existing = productMap.get(line.productId) || {
          productId: line.productId,
          name: line.productName,
          quantitySold: 0,
          revenue: 0,
        };
        existing.quantitySold += line.quantity;
        existing.revenue = roundTwoDecimals(existing.revenue + line.unitPrice * line.quantity);
        productMap.set(line.productId, existing);
      }
    }

    const topProducts = [...productMap.values()]
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    // Tickets by status (for confirmed orders only)
    const ticketsByStatus: Record<string, number> = {};
    for (const ticket of allTickets) {
      if (!confirmedOrderIds.has(ticket.orderId)) continue;
      ticketsByStatus[ticket.status] = (ticketsByStatus[ticket.status] ?? 0) + 1;
    }

    const response: ReportsResponse = {
      period: periodParam,
      ordersTotal,
      ordersConfirmed,
      ordersCancelled,
      revenue,
      avgOrderValue,
      topProducts,
      ticketsByStatus,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating reports:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
