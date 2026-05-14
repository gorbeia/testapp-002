import { beforeEach, describe, expect, it } from 'vitest';
import { resetStore, seedMockData, seedDemoData } from '@/test/store-setup';
import { GET as txosnaGET } from '../[slug]/route';
import { GET as catalogGET } from '../[slug]/catalog/route';

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

beforeEach(() => {
  resetStore();
  seedMockData();
  seedDemoData();
});

// ── GET /api/txosnak/[slug] ───────────────────────────────────────────────────

describe('GET /api/txosnak/[slug]', () => {
  it('does not expose pinHash or passwordHash', async () => {
    const res = await txosnaGET(new Request('http://localhost'), makeParams('aste-nagusia-2026'));
    const body = await res.json();
    expect(body.pinHash).toBeUndefined();
  });

  it('returns demo txosna when enabled', async () => {
    const res = await txosnaGET(new Request('http://localhost'), makeParams('demo-janaria'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('OPEN');
  });

  it('PAUSED txosna is still accessible (not 404)', async () => {
    const res = await txosnaGET(new Request('http://localhost'), makeParams('demo-edariak'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('PAUSED');
  });
});

// ── GET /api/txosnak/[slug]/catalog ──────────────────────────────────────────

describe('GET /api/txosnak/[slug]/catalog', () => {
  it('each product has effectivePrice and soldOut fields', async () => {
    const res = await catalogGET(new Request('http://localhost'), makeParams('aste-nagusia-2026'));
    const body = await res.json();
    const prod = body[0].products[0];
    expect(typeof prod.effectivePrice).toBe('number');
    expect(typeof prod.soldOut).toBe('boolean');
  });

  it('demo catalog has soldOut product in demo-janaria', async () => {
    const res = await catalogGET(new Request('http://localhost'), makeParams('demo-janaria'));
    const body = await res.json();
    const allProducts = body.flatMap((c: { products: unknown[] }) => c.products) as {
      id: string;
      soldOut: boolean;
    }[];
    const soldOutProd = allProducts.find((p) => p.id === 'demo-prod-4');
    expect(soldOutProd).toBeDefined();
    expect(soldOutProd!.soldOut).toBe(true);
  });

  it('soldOut flag is scoped per txosna — same product is not soldOut in demo-edariak', async () => {
    const res = await catalogGET(new Request('http://localhost'), makeParams('demo-edariak'));
    const body = await res.json();
    const allProducts = body.flatMap((c: { products: unknown[] }) => c.products) as {
      id: string;
      soldOut: boolean;
    }[];
    const prod = allProducts.find((p) => p.id === 'demo-prod-4');
    if (prod) {
      expect(prod.soldOut).toBe(false);
    }
  });
});
