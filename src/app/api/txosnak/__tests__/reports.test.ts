import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetStore, orderRepo, txosnaRepo } from '@/test/store-setup';
import * as authModule from '@/lib/auth';
import { GET as reportsGet } from '../[slug]/reports/route';

// Stub NextAuth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

const authMock = vi.mocked(authModule.auth);

beforeEach(() => {
  resetStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authMock.mockResolvedValue(null as any);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function mockSession(role: string, associationId: string) {
  authMock.mockResolvedValue({
    user: { id: 'v1', role, associationId, email: 'admin@test.com' },
  } as any);
}

function makeGetReports(slug: string, period?: string) {
  const url = new URL(`http://localhost/api/txosnak/${slug}/reports`);
  if (period) {
    url.searchParams.set('period', period);
  }
  return new Request(url);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveParams<T extends Record<string, any>>(
  route: (req: any, params: any) => any,
  req: Request,
  params: T
): Promise<Response> {
  return route(req, { params: Promise.resolve(params) });
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Reports API', () => {
  describe('GET /api/txosnak/[slug]/reports', () => {
    it('returns 200 with correct shape', async () => {
      mockSession('ADMIN', 'assoc-1');

      // Seed one confirmed order
      const txosna = await txosnaRepo.findBySlug('aste-nagusia-2026');
      await orderRepo.create({
        txosnaId: txosna!.id,
        channel: 'COUNTER',
        customerName: 'Test Customer',
        notes: null,
        paymentMethod: 'CASH',
        registeredById: 'v1',
        status: 'CONFIRMED',
        total: 10.0,
        expiresAt: null,
        tickets: [
          {
            counterType: 'FOOD',
            requiresPreparation: true,
            notes: null,
            lines: [
              {
                productId: 'prod-1',
                productName: 'Burgerra',
                quantity: 1,
                unitPrice: 10.0,
                selectedVariant: null,
                selectedModifiers: [],
                splitInstructions: null,
              },
            ],
          },
        ],
      });

      const res = await resolveParams(reportsGet, makeGetReports('aste-nagusia-2026', 'today'), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('period');
      expect(body).toHaveProperty('ordersTotal');
      expect(body).toHaveProperty('ordersConfirmed');
      expect(body).toHaveProperty('ordersCancelled');
      expect(body).toHaveProperty('revenue');
      expect(body).toHaveProperty('avgOrderValue');
      expect(body).toHaveProperty('topProducts');
      expect(body).toHaveProperty('ticketsByStatus');
    });

    it('computes totals correctly', async () => {
      mockSession('ADMIN', 'assoc-1');
      const txosna = await txosnaRepo.findBySlug('aste-nagusia-2026');

      // Seed 10 confirmed orders with total 10.0 each
      for (let i = 0; i < 10; i++) {
        await orderRepo.create({
          txosnaId: txosna!.id,
          channel: 'COUNTER',
          customerName: `Customer ${i}`,
          notes: null,
          paymentMethod: 'CASH',
          registeredById: 'v1',
          status: 'CONFIRMED',
          total: 10.0,
          expiresAt: null,
          tickets: [
            {
              counterType: 'FOOD',
              requiresPreparation: true,
              notes: null,
              lines: [
                {
                  productId: 'prod-1',
                  productName: 'Burgerra',
                  quantity: 1,
                  unitPrice: 10.0,
                  selectedVariant: null,
                  selectedModifiers: [],
                  splitInstructions: null,
                },
              ],
            },
          ],
        });
      }

      // Seed 2 cancelled orders
      for (let i = 0; i < 2; i++) {
        await orderRepo.create({
          txosnaId: txosna!.id,
          channel: 'COUNTER',
          customerName: `Cancelled ${i}`,
          notes: null,
          paymentMethod: 'CASH',
          registeredById: null,
          status: 'CANCELLED',
          total: 10.0,
          expiresAt: null,
          tickets: [
            {
              counterType: 'FOOD',
              requiresPreparation: true,
              notes: null,
              lines: [
                {
                  productId: 'prod-1',
                  productName: 'Burgerra',
                  quantity: 1,
                  unitPrice: 10.0,
                  selectedVariant: null,
                  selectedModifiers: [],
                  splitInstructions: null,
                },
              ],
            },
          ],
        });
      }

      const res = await resolveParams(reportsGet, makeGetReports('aste-nagusia-2026', 'today'), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ordersTotal).toBe(12);
      expect(body.ordersConfirmed).toBe(10);
      expect(body.ordersCancelled).toBe(2);
      expect(body.revenue).toBe(100.0);
      expect(body.avgOrderValue).toBe(10.0);
    });

    it('filters by today period correctly', async () => {
      mockSession('ADMIN', 'assoc-1');
      const txosna = await txosnaRepo.findBySlug('aste-nagusia-2026');

      // Seed 3 confirmed orders for today
      for (let i = 0; i < 3; i++) {
        await orderRepo.create({
          txosnaId: txosna!.id,
          channel: 'COUNTER',
          customerName: `Today ${i}`,
          notes: null,
          paymentMethod: 'CASH',
          registeredById: 'v1',
          status: 'CONFIRMED',
          total: 10.0,
          expiresAt: null,
          tickets: [
            {
              counterType: 'FOOD',
              requiresPreparation: true,
              notes: null,
              lines: [
                {
                  productId: 'prod-1',
                  productName: 'Burgerra',
                  quantity: 1,
                  unitPrice: 10.0,
                  selectedVariant: null,
                  selectedModifiers: [],
                  splitInstructions: null,
                },
              ],
            },
          ],
        });
      }

      // Seed 2 confirmed orders and backdate them to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      for (let i = 0; i < 2; i++) {
        const order = await orderRepo.create({
          txosnaId: txosna!.id,
          channel: 'COUNTER',
          customerName: `Yesterday ${i}`,
          notes: null,
          paymentMethod: 'CASH',
          registeredById: 'v1',
          status: 'CONFIRMED',
          total: 10.0,
          expiresAt: null,
          tickets: [
            {
              counterType: 'FOOD',
              requiresPreparation: true,
              notes: null,
              lines: [
                {
                  productId: 'prod-1',
                  productName: 'Burgerra',
                  quantity: 1,
                  unitPrice: 10.0,
                  selectedVariant: null,
                  selectedModifiers: [],
                  splitInstructions: null,
                },
              ],
            },
          ],
        });
        // Backdate it
        await orderRepo.update(order.id, { createdAt: yesterday });
      }

      const res = await resolveParams(reportsGet, makeGetReports('aste-nagusia-2026', 'today'), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ordersTotal).toBe(3);
      expect(body.ordersConfirmed).toBe(3);
    });

    it('period=week includes orders from 7 days ago', async () => {
      mockSession('ADMIN', 'assoc-1');
      const txosna = await txosnaRepo.findBySlug('aste-nagusia-2026');

      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      // Seed 2 orders from 6 days ago
      for (let i = 0; i < 2; i++) {
        const order = await orderRepo.create({
          txosnaId: txosna!.id,
          channel: 'COUNTER',
          customerName: `6-days ${i}`,
          notes: null,
          paymentMethod: 'CASH',
          registeredById: 'v1',
          status: 'CONFIRMED',
          total: 10.0,
          expiresAt: null,
          tickets: [
            {
              counterType: 'FOOD',
              requiresPreparation: true,
              notes: null,
              lines: [
                {
                  productId: 'prod-1',
                  productName: 'Burgerra',
                  quantity: 1,
                  unitPrice: 10.0,
                  selectedVariant: null,
                  selectedModifiers: [],
                  splitInstructions: null,
                },
              ],
            },
          ],
        });
        await orderRepo.update(order.id, { createdAt: sixDaysAgo });
      }

      // Seed 1 order from 8 days ago
      const orderOld = await orderRepo.create({
        txosnaId: txosna!.id,
        channel: 'COUNTER',
        customerName: '8-days ago',
        notes: null,
        paymentMethod: 'CASH',
        registeredById: 'v1',
        status: 'CONFIRMED',
        total: 10.0,
        expiresAt: null,
        tickets: [
          {
            counterType: 'FOOD',
            requiresPreparation: true,
            notes: null,
            lines: [
              {
                productId: 'prod-1',
                productName: 'Burgerra',
                quantity: 1,
                unitPrice: 10.0,
                selectedVariant: null,
                selectedModifiers: [],
                splitInstructions: null,
              },
            ],
          },
        ],
      });
      await orderRepo.update(orderOld.id, { createdAt: eightDaysAgo });

      const res = await resolveParams(reportsGet, makeGetReports('aste-nagusia-2026', 'week'), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ordersTotal).toBe(2);
    });

    it('topProducts sorted by quantity descending', async () => {
      mockSession('ADMIN', 'assoc-1');
      const txosna = await txosnaRepo.findBySlug('aste-nagusia-2026');

      // Seed 3 orders: each buys 2x prod-1 and 1x prod-2
      for (let i = 0; i < 3; i++) {
        await orderRepo.create({
          txosnaId: txosna!.id,
          channel: 'COUNTER',
          customerName: `Customer ${i}`,
          notes: null,
          paymentMethod: 'CASH',
          registeredById: 'v1',
          status: 'CONFIRMED',
          total: 25.0,
          expiresAt: null,
          tickets: [
            {
              counterType: 'FOOD',
              requiresPreparation: true,
              notes: null,
              lines: [
                {
                  productId: 'prod-1',
                  productName: 'Burgerra',
                  quantity: 2,
                  unitPrice: 10.0,
                  selectedVariant: null,
                  selectedModifiers: [],
                  splitInstructions: null,
                },
                {
                  productId: 'prod-2',
                  productName: 'Txuleta',
                  quantity: 1,
                  unitPrice: 5.0,
                  selectedVariant: null,
                  selectedModifiers: [],
                  splitInstructions: null,
                },
              ],
            },
          ],
        });
      }

      const res = await resolveParams(reportsGet, makeGetReports('aste-nagusia-2026', 'today'), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.topProducts).toHaveLength(2);
      expect(body.topProducts[0].productId).toBe('prod-1');
      expect(body.topProducts[0].quantitySold).toBe(6);
      expect(body.topProducts[0].revenue).toBe(60.0);
      expect(body.topProducts[1].productId).toBe('prod-2');
      expect(body.topProducts[1].quantitySold).toBe(3);
      expect(body.topProducts[1].revenue).toBe(15.0);
    });

    it('excludes cancelled orders from revenue and topProducts', async () => {
      mockSession('ADMIN', 'assoc-1');
      const txosna = await txosnaRepo.findBySlug('aste-nagusia-2026');

      // Seed 2 confirmed orders for prod-1
      for (let i = 0; i < 2; i++) {
        await orderRepo.create({
          txosnaId: txosna!.id,
          channel: 'COUNTER',
          customerName: `Confirmed ${i}`,
          notes: null,
          paymentMethod: 'CASH',
          registeredById: 'v1',
          status: 'CONFIRMED',
          total: 10.0,
          expiresAt: null,
          tickets: [
            {
              counterType: 'FOOD',
              requiresPreparation: true,
              notes: null,
              lines: [
                {
                  productId: 'prod-1',
                  productName: 'Burgerra',
                  quantity: 1,
                  unitPrice: 10.0,
                  selectedVariant: null,
                  selectedModifiers: [],
                  splitInstructions: null,
                },
              ],
            },
          ],
        });
      }

      // Seed 1 cancelled order for prod-1
      await orderRepo.create({
        txosnaId: txosna!.id,
        channel: 'COUNTER',
        customerName: 'Cancelled',
        notes: null,
        paymentMethod: 'CASH',
        registeredById: null,
        status: 'CANCELLED',
        total: 10.0,
        expiresAt: null,
        tickets: [
          {
            counterType: 'FOOD',
            requiresPreparation: true,
            notes: null,
            lines: [
              {
                productId: 'prod-1',
                productName: 'Burgerra',
                quantity: 1,
                unitPrice: 10.0,
                selectedVariant: null,
                selectedModifiers: [],
                splitInstructions: null,
              },
            ],
          },
        ],
      });

      const res = await resolveParams(reportsGet, makeGetReports('aste-nagusia-2026', 'today'), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.revenue).toBe(20.0);
      expect(body.topProducts[0].quantitySold).toBe(2);
    });

    it('returns 401 when no session', async () => {
      const res = await resolveParams(reportsGet, makeGetReports('aste-nagusia-2026', 'today'), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(401);
    });

    it('returns 403 when role is VOLUNTEER', async () => {
      mockSession('VOLUNTEER', 'assoc-1');

      const res = await resolveParams(reportsGet, makeGetReports('aste-nagusia-2026', 'today'), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(403);
    });

    it('returns 404 for unknown slug', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(reportsGet, makeGetReports('unknown-slug', 'today'), {
        slug: 'unknown-slug',
      });

      expect(res.status).toBe(404);
    });

    it('returns 403 when ADMIN of different association', async () => {
      mockSession('ADMIN', 'assoc-2');

      const res = await resolveParams(reportsGet, makeGetReports('aste-nagusia-2026', 'today'), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(403);
    });

    it('returns 422 when period is missing', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(reportsGet, makeGetReports('aste-nagusia-2026'), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(422);
    });

    it('returns 422 when period is invalid', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(reportsGet, makeGetReports('aste-nagusia-2026', 'invalid'), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(422);
    });
  });
});
