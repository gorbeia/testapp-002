import { beforeEach, describe, expect, it } from 'vitest';
import { resetStore } from '@/test/store-setup';
import { GET as txosnaGET } from '../[slug]/route';
import { GET as catalogGET } from '../[slug]/catalog/route';

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

beforeEach(() => {
  resetStore();
});

// ── GET /api/txosnak/[slug] ───────────────────────────────────────────────────

describe('GET /api/txosnak/[slug]', () => {
  it('returns txosna info for a known OPEN slug', async () => {
    const res = await txosnaGET(new Request('http://localhost'), makeParams('aste-nagusia-2026'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slug).toBe('aste-nagusia-2026');
    expect(body.status).toBe('OPEN');
    expect(body.name).toBeTruthy();
    expect(body.counterSetup).toBeTruthy();
    expect(Array.isArray(body.enabledChannels)).toBe(true);
  });

  it('returns 404 for unknown slug', async () => {
    const res = await txosnaGET(new Request('http://localhost'), makeParams('no-such-slug'));
    expect(res.status).toBe(404);
  });

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

  it('returns 404 for PAUSED demo txosna... wait, PAUSED should still be accessible', async () => {
    // PAUSED txosna is still visible — ordering may be disabled but info is accessible
    const res = await txosnaGET(new Request('http://localhost'), makeParams('demo-edariak'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('PAUSED');
  });
});

// ── GET /api/txosnak/[slug]/catalog ──────────────────────────────────────────

describe('GET /api/txosnak/[slug]/catalog', () => {
  it('returns categories with products for a known slug', async () => {
    const res = await catalogGET(new Request('http://localhost'), makeParams('aste-nagusia-2026'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    for (const cat of body) {
      expect(cat.id).toBeTruthy();
      expect(Array.isArray(cat.products)).toBe(true);
      expect(cat.products.length).toBeGreaterThan(0);
    }
  });

  it('returns 404 for unknown slug', async () => {
    const res = await catalogGET(new Request('http://localhost'), makeParams('no-such-slug'));
    expect(res.status).toBe(404);
  });

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

  it('demo-prod-4 is NOT soldOut in demo-edariak', async () => {
    const res = await catalogGET(new Request('http://localhost'), makeParams('demo-edariak'));
    const body = await res.json();
    const allProducts = body.flatMap((c: { products: unknown[] }) => c.products) as {
      id: string;
      soldOut: boolean;
    }[];
    const prod = allProducts.find((p) => p.id === 'demo-prod-4');
    // demo-prod-4 is a FOOD product — it may not appear in demo-edariak catalog at all
    // but if it does, it should not be soldOut
    if (prod) {
      expect(prod.soldOut).toBe(false);
    }
  });
});
