import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/sse';
import { txosnaRepo, orderRepo, catalogRepo } from '@/lib/store';
import type {
  CounterType,
  CreateOrderInput,
  CreateTicketInput,
  CreateOrderLineInput,
  PaymentMethod,
} from '@/lib/store/types';

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const txosna = await txosnaRepo.findBySlug(slug);
  if (!txosna) return Response.json({ error: 'Not found' }, { status: 404 });
  if (txosna.status !== 'OPEN')
    return Response.json({ error: 'Txosna is not open' }, { status: 409 });

  let body: {
    channel: string;
    customerName: string | null;
    notes: string | null;
    paymentMethod: string;
    lines: Array<{
      productId: string;
      quantity: number;
      selectedVariantOptionId: string | null;
      selectedModifierIds: string[];
      splitInstructions: string | null;
    }>;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return Response.json({ error: 'lines must be a non-empty array' }, { status: 400 });
  }

  const paymentMethod = body.paymentMethod as PaymentMethod;
  if (!txosna.enabledPaymentMethods.includes(paymentMethod)) {
    return Response.json(
      { error: `Payment method ${paymentMethod} is not enabled for this txosna` },
      { status: 422 }
    );
  }

  const isSelfService = body.channel === 'SELF_SERVICE' || body.channel === 'PHONE_TO_COUNTER';
  let registeredById: string | null = null;
  if (!isSelfService) {
    if (process.env.PROTO_MODE !== 'true') {
      const session = await auth();
      if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const sessionAssociationId =
        (session.user as { associationId?: string }).associationId ?? null;
      if (txosna.associationId !== sessionAssociationId)
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      registeredById = (session.user as { id?: string }).id ?? null;
    }
  }

  const grouped = await catalogRepo.listProductViews(txosna.id);
  const productMap = new Map(grouped.flatMap(({ products }) => products.map((p) => [p.id, p])));
  const categoryMap = new Map(grouped.map(({ category }) => [category.id, category]));

  type ResolvedLine = CreateOrderLineInput & {
    counterType: CounterType;
    requiresPreparation: boolean;
    linePosts: string[]; // de-duplicated kitchen posts for this line (FOOD only)
  };
  const resolved: ResolvedLine[] = [];

  for (const line of body.lines) {
    const view = productMap.get(line.productId);
    if (!view)
      return Response.json({ error: `Product ${line.productId} not found` }, { status: 422 });
    if (view.soldOut)
      return Response.json({ error: `Product ${view.name} is sold out` }, { status: 422 });
    if (!view.available)
      return Response.json({ error: `Product ${view.name} is not available` }, { status: 422 });

    let variantName: string | null = null;
    let variantDelta = 0;
    let variantKitchenPost: string | null = null;
    if (line.selectedVariantOptionId) {
      for (const vg of view.variantGroups) {
        const opt = vg.options.find((o) => o.id === line.selectedVariantOptionId);
        if (opt) {
          variantName = opt.name;
          variantDelta = opt.priceDelta;
          variantKitchenPost = opt.kitchenPost ?? null;
          break;
        }
      }
    }

    let modifierTotal = 0;
    const modifierNames: string[] = [];
    const modifierKitchenPosts: string[] = [];
    for (const modId of line.selectedModifierIds ?? []) {
      const mod = view.modifiers.find((m) => m.id === modId);
      if (mod) {
        modifierTotal += mod.price;
        modifierNames.push(mod.name);
        if (mod.kitchenPost) modifierKitchenPosts.push(mod.kitchenPost);
      }
    }

    const unitPrice = view.effectivePrice + variantDelta + modifierTotal;
    const cat = categoryMap.get(view.categoryId);
    const counterType: CounterType = cat?.type === 'DRINKS' ? 'DRINKS' : 'FOOD';

    // Collect and de-duplicate kitchen posts for this line (FOOD only)
    const postSet = new Set<string>();
    if (counterType === 'FOOD') {
      if (view.kitchenPost) postSet.add(view.kitchenPost);
      if (variantKitchenPost) postSet.add(variantKitchenPost);
      for (const p of modifierKitchenPosts) postSet.add(p);
    }

    resolved.push({
      productId: view.id,
      productName: view.name,
      quantity: line.quantity,
      unitPrice,
      selectedVariant: variantName,
      selectedModifiers: modifierNames,
      splitInstructions: line.splitInstructions ?? null,
      counterType,
      requiresPreparation: view.requiresPreparation,
      linePosts: [...postSet],
    });
  }

  // DRINKS lines → always one ticket, kitchenPost = null
  // FOOD lines → one ticket per distinct kitchen post when txosna has posts configured;
  //              lines with no post values go into a general ticket (kitchenPost = null)
  const hasKitchenPosts = txosna.kitchenPosts.length > 0;

  // Map key: `DRINKS` or `FOOD:${post}` (post is '' for the general food ticket)
  const ticketMap = new Map<
    string,
    { counterType: CounterType; kitchenPost: string | null; lines: ResolvedLine[] }
  >();

  for (const line of resolved) {
    if (line.counterType !== 'DRINKS' && hasKitchenPosts && line.linePosts.length > 0) {
      // One copy of the line per distinct post it belongs to
      for (const post of line.linePosts) {
        const postKey = `FOOD:${post}`;
        const bucket = ticketMap.get(postKey) ?? {
          counterType: 'FOOD' as CounterType,
          kitchenPost: post,
          lines: [],
        };
        bucket.lines.push(line);
        ticketMap.set(postKey, bucket);
      }
      continue;
    }

    const key = line.counterType === 'DRINKS' || !hasKitchenPosts ? line.counterType : 'FOOD:';
    const bucket = ticketMap.get(key) ?? {
      counterType: line.counterType,
      kitchenPost: null,
      lines: [],
    };
    bucket.lines.push(line);
    ticketMap.set(key, bucket);
  }

  const tickets: CreateTicketInput[] = [];
  for (const { counterType, kitchenPost, lines } of ticketMap.values()) {
    const requiresPreparation = lines.some((l) => l.requiresPreparation);
    tickets.push({
      counterType,
      kitchenPost,
      requiresPreparation,
      notes: body.notes ?? null,
      lines: lines.map(({ counterType: _ct, requiresPreparation: _rp, linePosts: _lp, ...l }) => l),
    });
  }

  const total = resolved.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  const status = isSelfService ? 'PENDING_PAYMENT' : 'CONFIRMED';
  const expiresAt = isSelfService
    ? new Date(Date.now() + txosna.pendingPaymentTimeout * 60_000)
    : null;

  const input: CreateOrderInput = {
    txosnaId: txosna.id,
    channel: body.channel as CreateOrderInput['channel'],
    customerName: body.customerName ?? null,
    notes: body.notes ?? null,
    paymentMethod: body.paymentMethod as CreateOrderInput['paymentMethod'],
    registeredById,
    status,
    total,
    expiresAt,
    tickets,
    pendingLines: isSelfService ? tickets : undefined,
  };

  const order = await orderRepo.create(input);

  const eventName = isSelfService ? 'order:pending' : 'order:created';
  broadcast(txosna.id, eventName, {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    total: order.total,
    status: order.status,
  });

  return Response.json(order, { status: 201 });
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (process.env.PROTO_MODE !== 'true') {
    const session = await auth();
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const txosna = await txosnaRepo.findBySlug(slug);
  if (!txosna) return Response.json({ error: 'Not found' }, { status: 404 });

  const { expirePendingOrders } = await import('@/lib/expire-pending-orders');
  await expirePendingOrders(txosna.id);

  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status');
  const channelParam = url.searchParams.get('channel');
  const sinceParam = url.searchParams.get('since');

  const orders = await orderRepo.listByTxosna(txosna.id, {
    status: statusParam ? (statusParam as import('@/lib/store/types').OrderStatus) : undefined,
    channel: channelParam
      ? (channelParam as import('@/lib/store/types').OrderingChannel)
      : undefined,
    since: sinceParam ? new Date(sinceParam) : undefined,
  });

  return Response.json(orders);
}
