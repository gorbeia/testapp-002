import { NextResponse } from 'next/server';
import { txosnaRepo, paymentProviderRepo } from '@/lib/store';
import { _test_insertOrder } from '@/lib/store/memory';
import type { StoredOrder } from '@/lib/store/types';

// Only enabled when the NEXTAUTH_SECRET identifies a CI/test environment
function isTestEnv(): boolean {
  return !!process.env.NEXTAUTH_SECRET?.includes('ci-e2e-test');
}

export async function POST(request: Request) {
  if (!isTestEnv()) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  let body: { action: string; slug?: string; orderName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  switch (body.action) {
    case 'enableOnlinePayment': {
      const slug = body.slug;
      if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
      const txosna = await txosnaRepo.findBySlug(slug);
      if (!txosna) return NextResponse.json({ error: 'Txosna not found' }, { status: 404 });
      const methods = txosna.enabledPaymentMethods.includes('ONLINE')
        ? txosna.enabledPaymentMethods
        : ([...txosna.enabledPaymentMethods, 'ONLINE'] as typeof txosna.enabledPaymentMethods);
      await txosnaRepo.update(txosna.id, { enabledPaymentMethods: methods });
      return NextResponse.json({ ok: true });
    }

    case 'createRedsysProvider': {
      const slug = body.slug;
      if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
      const txosna = await txosnaRepo.findBySlug(slug);
      if (!txosna) return NextResponse.json({ error: 'Txosna not found' }, { status: 404 });
      // Remove existing Redsys provider to avoid duplicates
      const existing = await paymentProviderRepo.listByAssociation(txosna.associationId);
      for (const p of existing) {
        if (p.providerType === 'REDSYS') {
          await paymentProviderRepo.delete(p.id);
        }
      }
      await paymentProviderRepo.create({
        associationId: txosna.associationId,
        providerType: 'REDSYS',
        testMode: true,
        credentials: {
          merchantCode: '999008881',
          terminal: '1',
          secretKey: 'sq7HjrUOBfKmC576ILgskD5srU870gJ7',
        },
        bizumEnabled: false,
      });
      return NextResponse.json({ ok: true });
    }

    case 'createOnlineOrder': {
      const slug = body.slug;
      const orderName = body.orderName;
      if (!slug || !orderName)
        return NextResponse.json({ error: 'slug and orderName required' }, { status: 400 });
      const txosna = await txosnaRepo.findBySlug(slug);
      if (!txosna) return NextResponse.json({ error: 'Txosna not found' }, { status: 404 });
      const order: StoredOrder = {
        id: orderName,
        orderNumber: 1,
        txosnaId: txosna.id,
        status: 'PENDING_PAYMENT',
        cancellationReason: null,
        channel: 'SELF_SERVICE',
        paymentMethod: 'ONLINE',
        customerName: 'E2E Test',
        notes: null,
        total: 8.5,
        verificationCode: orderName,
        registeredById: null,
        paymentSessionId: null,
        confirmedAt: null,
        expiresAt: new Date(Date.now() + 30 * 60_000),
        pendingLines: [
          {
            counterType: 'FOOD',
            requiresPreparation: true,
            notes: null,
            lines: [
              {
                productId: 'prod-1',
                productName: 'Burgerra',
                unitPrice: 8.5,
                quantity: 1,
                selectedVariant: null,
                selectedModifiers: [],
                splitInstructions: null,
              },
            ],
          },
        ],
        fiscalReceiptRef: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      _test_insertOrder(order);
      return NextResponse.json({ id: order.id, txosnaId: txosna.id });
    }

    case 'reset': {
      const slug = body.slug;
      if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
      const txosna = await txosnaRepo.findBySlug(slug);
      if (!txosna) return NextResponse.json({ error: 'Txosna not found' }, { status: 404 });
      // Reset online payment methods for this txosna
      const methods = txosna.enabledPaymentMethods.filter(
        (m) => m !== 'ONLINE'
      ) as typeof txosna.enabledPaymentMethods;
      await txosnaRepo.update(txosna.id, { enabledPaymentMethods: methods });
      // Remove Redsys providers
      const providers = await paymentProviderRepo.listByAssociation(txosna.associationId);
      for (const p of providers) {
        if (p.providerType === 'REDSYS') {
          await paymentProviderRepo.delete(p.id);
        }
      }
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
  }
}
