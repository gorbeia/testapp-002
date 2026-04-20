import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetStore, volunteerRepo } from '@/test/store-setup';
import * as authModule from '@/lib/auth';
import { GET as volunteerGet, POST as volunteerPost } from '../[associationId]/volunteers/route';
import {
  PATCH as volunteerPatch,
  DELETE as volunteerDelete,
} from '../../volunteers/[volunteerId]/route';
import { POST as pinPost } from '../../auth/pin/route';
import bcrypt from 'bcryptjs';

// Stub NextAuth — must be hoisted, can't reference outside variables
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

const authMock = vi.mocked(authModule.auth);

beforeEach(() => {
  resetStore();
  // Default to no auth unless overridden
  authMock.mockResolvedValue(null);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function mockSession(role: string, associationId: string) {
  authMock.mockResolvedValue({
    user: { id: 'v1', role, associationId, email: 'admin@test.com' },
  });
}

function makeGetVolunteers(associationId: string) {
  return new Request(`http://localhost/api/associations/${associationId}/volunteers`);
}

function makePostVolunteer(associationId: string, body: object) {
  return new Request(`http://localhost/api/associations/${associationId}/volunteers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makePatchVolunteer(volunteerId: string, body: object) {
  return new Request(`http://localhost/api/volunteers/${volunteerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeDeleteVolunteer(volunteerId: string) {
  return new Request(`http://localhost/api/volunteers/${volunteerId}`, {
    method: 'DELETE',
  });
}

function makePinRequest(txosnaSlug: string, pin: string) {
  return new Request('http://localhost/api/auth/pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txosnaSlug, pin }),
  });
}

async function resolveParams<T extends Record<string, any>>(
  route: (req: any, params: any) => any,
  req: Request,
  params: T
): Promise<Response> {
  return route(req, { params: Promise.resolve(params) });
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Volunteer Management API', () => {
  describe('GET /api/associations/[associationId]/volunteers', () => {
    it('lists volunteers for the association when ADMIN', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(volunteerGet, makeGetVolunteers('assoc-1'), {
        associationId: 'assoc-1',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0]).toHaveProperty('id');
      expect(body[0]).toHaveProperty('name');
      expect(body[0]).toHaveProperty('email');
      expect(body[0]).not.toHaveProperty('passwordHash');
    });

    it('forbids access to different association', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(volunteerGet, makeGetVolunteers('assoc-2'), {
        associationId: 'assoc-2',
      });

      expect(res.status).toBe(403);
    });

    it('forbids VOLUNTEER role', async () => {
      mockSession('VOLUNTEER', 'assoc-1');

      const res = await resolveParams(volunteerGet, makeGetVolunteers('assoc-1'), {
        associationId: 'assoc-1',
      });

      expect(res.status).toBe(403);
    });

    it('returns 401 without session', async () => {
      // mockAuthFn is null by default from beforeEach
      const res = await resolveParams(volunteerGet, makeGetVolunteers('assoc-1'), {
        associationId: 'assoc-1',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/associations/[associationId]/volunteers', () => {
    it('creates a volunteer with hashed password', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(
        volunteerPost,
        makePostVolunteer('assoc-1', {
          name: 'New Volunteer',
          email: 'newvol@test.com',
          password: 'secure123',
          role: 'VOLUNTEER',
        }),
        { associationId: 'assoc-1' }
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.id).toBeDefined();
      expect(body.name).toBe('New Volunteer');
      expect(body.email).toBe('newvol@test.com');
      expect(body.role).toBe('VOLUNTEER');
      expect(body).not.toHaveProperty('passwordHash');

      // Verify stored hash is bcrypt, not plain
      const stored = await volunteerRepo.findById(body.id);
      // Bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(stored!.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(await bcrypt.compare('secure123', stored!.passwordHash)).toBe(true);
    });

    it('rejects duplicate email', async () => {
      mockSession('ADMIN', 'assoc-1');

      // Amaia's email already exists from seed
      const res = await resolveParams(
        volunteerPost,
        makePostVolunteer('assoc-1', {
          name: 'Duplicate Name',
          email: 'amaia@elkartea.eus', // Already exists in seed
          password: 'test123',
          role: 'VOLUNTEER',
        }),
        { associationId: 'assoc-1' }
      );

      expect(res.status).toBe(409);
    });

    it('forbids non-ADMIN', async () => {
      mockSession('VOLUNTEER', 'assoc-1');

      const res = await resolveParams(
        volunteerPost,
        makePostVolunteer('assoc-1', {
          name: 'Test',
          email: 'test@test.com',
          password: 'test123',
          role: 'VOLUNTEER',
        }),
        { associationId: 'assoc-1' }
      );

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/volunteers/[volunteerId]', () => {
    it('updates volunteer fields', async () => {
      mockSession('ADMIN', 'assoc-1');
      const volunteers = await volunteerRepo.listByAssociation('assoc-1');
      const volunteerId = volunteers[0].id;

      const res = await resolveParams(
        volunteerPatch,
        makePatchVolunteer(volunteerId, {
          name: 'Updated Name',
          role: 'ADMIN',
        }),
        { volunteerId }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.name).toBe('Updated Name');
      expect(body.role).toBe('ADMIN');

      const stored = await volunteerRepo.findById(volunteerId);
      expect(stored!.name).toBe('Updated Name');
      expect(stored!.role).toBe('ADMIN');
    });

    it('hashes password when updated', async () => {
      mockSession('ADMIN', 'assoc-1');
      const volunteers = await volunteerRepo.listByAssociation('assoc-1');
      const volunteerId = volunteers[0].id;

      const res = await resolveParams(
        volunteerPatch,
        makePatchVolunteer(volunteerId, {
          password: 'newpassword456',
        }),
        { volunteerId }
      );

      expect(res.status).toBe(200);
      const stored = await volunteerRepo.findById(volunteerId);
      expect(await bcrypt.compare('newpassword456', stored!.passwordHash)).toBe(true);
    });

    it('forbids updating volunteer from different association', async () => {
      mockSession('ADMIN', 'assoc-1');
      // This test requires multiple associations in seed data.
      // For now, test that an ADMIN from assoc-1 can't update if they claim to be from assoc-2
      const volunteers = await volunteerRepo.listByAssociation('assoc-1');
      const volunteerId = volunteers[0].id;

      // Mock a session from a different association
      mockSession('ADMIN', 'assoc-2');

      const res = await resolveParams(
        volunteerPatch,
        makePatchVolunteer(volunteerId, { name: 'Hacker' }),
        { volunteerId }
      );

      expect(res.status).toBe(403);
    });

    it('returns 404 for unknown volunteer', async () => {
      mockSession('ADMIN', 'assoc-1');

      const res = await resolveParams(
        volunteerPatch,
        makePatchVolunteer('unknown-id', { name: 'Test' }),
        { volunteerId: 'unknown-id' }
      );

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/volunteers/[volunteerId]', () => {
    it('soft-deletes volunteer', async () => {
      mockSession('ADMIN', 'assoc-1');
      const volunteers = await volunteerRepo.listByAssociation('assoc-1');
      const volunteerId = volunteers[0].id;

      const res = await resolveParams(volunteerDelete, makeDeleteVolunteer(volunteerId), {
        volunteerId,
      });

      expect(res.status).toBe(204);

      const stored = await volunteerRepo.findById(volunteerId);
      expect(stored!.active).toBe(false);
    });

    it('forbids deleting volunteer from different association', async () => {
      mockSession('ADMIN', 'assoc-1');
      const volunteers = await volunteerRepo.listByAssociation('assoc-1');
      const volunteerId = volunteers[0].id;

      // Mock a session from a different association
      mockSession('ADMIN', 'assoc-2');

      const res = await resolveParams(volunteerDelete, makeDeleteVolunteer(volunteerId), {
        volunteerId,
      });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/auth/pin', () => {
    it('validates correct PIN', async () => {
      const res = await pinPost(makePinRequest('aste-nagusia-2026', '1234'));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.valid).toBe(true);
      expect(body.txosnaId).toBeDefined();
      expect(body.counterSetup).toBeDefined();
    });

    it('rejects incorrect PIN', async () => {
      const res = await pinPost(makePinRequest('aste-nagusia-2026', '9999'));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.valid).toBe(false);
    });

    it('rejects unknown slug', async () => {
      const res = await pinPost(makePinRequest('unknown-slug', '1234'));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.valid).toBe(false);
    });

    it('handles missing parameters', async () => {
      const res = await pinPost(makePinRequest('', ''));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.valid).toBe(false);
    });
  });
});
