import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetStore, txosnaRepo } from '@/test/store-setup';
import * as authModule from '@/lib/auth';
import * as sseModule from '@/lib/sse';
import { GET as settingsGet, PATCH as settingsPatch } from '../[slug]/settings/route';
import { PATCH as pinPatch } from '../[slug]/pin/route';
import bcrypt from 'bcryptjs';

// Stub NextAuth — must be hoisted
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

// Stub SSE broadcast
vi.mock('@/lib/sse', () => ({
  broadcast: vi.fn(),
  registerClient: vi.fn(),
  removeClient: vi.fn(),
}));

const authMock = vi.mocked(authModule.auth);
const broadcastSpy = vi.mocked(sseModule.broadcast);

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

function makeGetSettings(slug: string) {
  return new Request(`http://localhost/api/txosnak/${slug}/settings`);
}

function makePatchSettings(slug: string, body: Record<string, unknown>) {
  return new Request(`http://localhost/api/txosnak/${slug}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makePatchPin(slug: string, body: Record<string, unknown>) {
  return new Request(`http://localhost/api/txosnak/${slug}/pin`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
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

describe('Txosna Settings API', () => {
  describe('GET /api/txosnak/[slug]/settings', () => {
    it('returns settings for ADMIN of same association', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(settingsGet, makeGetSettings('aste-nagusia-2026'), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('waitMinutes');
      expect(body).toHaveProperty('counterSetup');
      expect(body).toHaveProperty('enabledChannels');
      expect(body).toHaveProperty('enabledPaymentMethods');
      expect(body).toHaveProperty('printingEnabled');
      expect(body).toHaveProperty('pendingPaymentTimeout');
      expect(body).not.toHaveProperty('pinHash');
    });

    it('returns 401 when no session', async () => {
      const res = await resolveParams(settingsGet, makeGetSettings('aste-nagusia-2026'), {
        slug: 'aste-nagusia-2026',
      });
      expect(res.status).toBe(401);
    });

    it('returns 403 when role is VOLUNTEER', async () => {
      mockSession('VOLUNTEER', 'assoc-1');

      const res = await resolveParams(settingsGet, makeGetSettings('aste-nagusia-2026'), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(403);
    });

    it('returns 404 for unknown slug', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(settingsGet, makeGetSettings('unknown-slug'), {
        slug: 'unknown-slug',
      });

      expect(res.status).toBe(404);
    });

    it('returns 403 when ADMIN of different association', async () => {
      mockSession('ADMIN', 'assoc-2');

      const res = await resolveParams(settingsGet, makeGetSettings('aste-nagusia-2026'), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/txosnak/[slug]/settings', () => {
    it('updates status to PAUSED and broadcasts SSE', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(
        settingsPatch,
        makePatchSettings('aste-nagusia-2026', { status: 'PAUSED' }),
        {
          slug: 'aste-nagusia-2026',
        }
      );

      expect(res.status).toBe(200);
      const updated = await txosnaRepo.findBySlug('aste-nagusia-2026');
      expect(updated?.status).toBe('PAUSED');

      // Check broadcast was called
      expect(broadcastSpy).toHaveBeenCalledWith(expect.any(String), 'txosna:status_changed', {
        status: 'PAUSED',
      });
    });

    it('updates status to CLOSED and broadcasts SSE', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(
        settingsPatch,
        makePatchSettings('aste-nagusia-2026', { status: 'CLOSED' }),
        {
          slug: 'aste-nagusia-2026',
        }
      );

      expect(res.status).toBe(200);
      expect(broadcastSpy).toHaveBeenCalledWith(expect.any(String), 'txosna:status_changed', {
        status: 'CLOSED',
      });
    });

    it('does NOT broadcast when status changes to OPEN', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(
        settingsPatch,
        makePatchSettings('aste-nagusia-2026', { status: 'OPEN' }),
        {
          slug: 'aste-nagusia-2026',
        }
      );

      expect(res.status).toBe(200);
      expect(broadcastSpy).not.toHaveBeenCalled();
    });

    it('rejects invalid status value with 422', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(
        settingsPatch,
        makePatchSettings('aste-nagusia-2026', { status: 'INVALID' }),
        {
          slug: 'aste-nagusia-2026',
        }
      );

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body).toHaveProperty('error');
    });

    it('updates waitMinutes', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(
        settingsPatch,
        makePatchSettings('aste-nagusia-2026', { waitMinutes: 12 }),
        {
          slug: 'aste-nagusia-2026',
        }
      );

      expect(res.status).toBe(200);
      const updated = await txosnaRepo.findBySlug('aste-nagusia-2026');
      expect(updated?.waitMinutes).toBe(12);
    });

    it('updates enabledPaymentMethods', async () => {
      mockSession('ADMIN', 'assoc-1');

      const newMethods = ['CASH', 'ONLINE'];
      const res = await resolveParams(
        settingsPatch,
        makePatchSettings('aste-nagusia-2026', { enabledPaymentMethods: newMethods }),
        { slug: 'aste-nagusia-2026' }
      );

      expect(res.status).toBe(200);
      const updated = await txosnaRepo.findBySlug('aste-nagusia-2026');
      expect(updated?.enabledPaymentMethods).toEqual(newMethods);
    });

    it('updates printingEnabled', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(
        settingsPatch,
        makePatchSettings('aste-nagusia-2026', { printingEnabled: true }),
        {
          slug: 'aste-nagusia-2026',
        }
      );

      expect(res.status).toBe(200);
      const updated = await txosnaRepo.findBySlug('aste-nagusia-2026');
      expect(updated?.printingEnabled).toBe(true);
    });

    it('updates pendingPaymentTimeout', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(
        settingsPatch,
        makePatchSettings('aste-nagusia-2026', { pendingPaymentTimeout: 20 }),
        {
          slug: 'aste-nagusia-2026',
        }
      );

      expect(res.status).toBe(200);
      const updated = await txosnaRepo.findBySlug('aste-nagusia-2026');
      expect(updated?.pendingPaymentTimeout).toBe(20);
    });

    it('returns 401 when no session', async () => {
      const res = await resolveParams(
        settingsPatch,
        makePatchSettings('aste-nagusia-2026', { waitMinutes: 10 }),
        {
          slug: 'aste-nagusia-2026',
        }
      );

      expect(res.status).toBe(401);
    });

    it('returns 403 when role is VOLUNTEER', async () => {
      mockSession('VOLUNTEER', 'assoc-1');

      const res = await resolveParams(
        settingsPatch,
        makePatchSettings('aste-nagusia-2026', { waitMinutes: 10 }),
        {
          slug: 'aste-nagusia-2026',
        }
      );

      expect(res.status).toBe(403);
    });

    it('returns 404 for unknown slug', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(
        settingsPatch,
        makePatchSettings('unknown-slug', { waitMinutes: 10 }),
        {
          slug: 'unknown-slug',
        }
      );

      expect(res.status).toBe(404);
    });

    it('returns 403 when ADMIN of different association', async () => {
      mockSession('ADMIN', 'assoc-2');

      const res = await resolveParams(
        settingsPatch,
        makePatchSettings('aste-nagusia-2026', { waitMinutes: 10 }),
        {
          slug: 'aste-nagusia-2026',
        }
      );

      expect(res.status).toBe(403);
    });

    it('GET includes kitchenPosts in response', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(settingsGet, makeGetSettings('aste-nagusia-2026'), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('kitchenPosts');
      expect(Array.isArray(body.kitchenPosts)).toBe(true);
    });

    it('updates kitchenPosts', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(
        settingsPatch,
        makePatchSettings('aste-nagusia-2026', { kitchenPosts: ['fryer', 'grill'] }),
        { slug: 'aste-nagusia-2026' }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.kitchenPosts).toEqual(['fryer', 'grill']);
      const updated = await txosnaRepo.findBySlug('aste-nagusia-2026');
      expect(updated?.kitchenPosts).toEqual(['fryer', 'grill']);
    });

    it('rejects kitchenPosts that is not an array with 422', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(
        settingsPatch,
        makePatchSettings('aste-nagusia-2026', { kitchenPosts: 'not-an-array' }),
        { slug: 'aste-nagusia-2026' }
      );

      expect(res.status).toBe(422);
    });

    it('preserves unmentioned fields', async () => {
      mockSession('ADMIN', 'assoc-1');
      const original = await txosnaRepo.findBySlug('aste-nagusia-2026');

      const res = await resolveParams(
        settingsPatch,
        makePatchSettings('aste-nagusia-2026', { waitMinutes: 99 }),
        {
          slug: 'aste-nagusia-2026',
        }
      );

      expect(res.status).toBe(200);
      const updated = await txosnaRepo.findBySlug('aste-nagusia-2026');
      expect(updated?.waitMinutes).toBe(99);
      expect(updated?.status).toBe(original?.status);
      expect(updated?.enabledChannels).toEqual(original?.enabledChannels);
    });
  });

  describe('PATCH /api/txosnak/[slug]/pin', () => {
    it('updates PIN hash', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(
        pinPatch,
        makePatchPin('aste-nagusia-2026', { pin: 'newpin1234' }),
        {
          slug: 'aste-nagusia-2026',
        }
      );

      expect(res.status).toBe(204);
      const updated = await txosnaRepo.findBySlug('aste-nagusia-2026');
      expect(updated?.pinHash).toBeDefined();

      // Verify hash matches new PIN
      const valid = await bcrypt.compare('newpin1234', updated!.pinHash);
      expect(valid).toBe(true);
    });

    it('returns 401 when no session', async () => {
      const res = await resolveParams(
        pinPatch,
        makePatchPin('aste-nagusia-2026', { pin: 'test' }),
        {
          slug: 'aste-nagusia-2026',
        }
      );

      expect(res.status).toBe(401);
    });

    it('returns 403 when role is VOLUNTEER', async () => {
      mockSession('VOLUNTEER', 'assoc-1');

      const res = await resolveParams(
        pinPatch,
        makePatchPin('aste-nagusia-2026', { pin: 'test' }),
        {
          slug: 'aste-nagusia-2026',
        }
      );

      expect(res.status).toBe(403);
    });

    it('returns 422 when PIN is missing', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(pinPatch, makePatchPin('aste-nagusia-2026', {}), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(422);
    });

    it('returns 422 when PIN is empty string', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(pinPatch, makePatchPin('aste-nagusia-2026', { pin: '' }), {
        slug: 'aste-nagusia-2026',
      });

      expect(res.status).toBe(422);
    });

    it('returns 404 for unknown slug', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(pinPatch, makePatchPin('unknown-slug', { pin: 'test' }), {
        slug: 'unknown-slug',
      });

      expect(res.status).toBe(404);
    });

    it('returns 403 when ADMIN of different association', async () => {
      mockSession('ADMIN', 'assoc-2');

      const res = await resolveParams(
        pinPatch,
        makePatchPin('aste-nagusia-2026', { pin: 'test' }),
        {
          slug: 'aste-nagusia-2026',
        }
      );

      expect(res.status).toBe(403);
    });
  });
});
