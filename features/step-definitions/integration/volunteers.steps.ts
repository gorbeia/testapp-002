/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { NextRequest } from 'next/server';
import { POST as volunteersPost } from '../../../src/app/api/handlers/assoc-volunteers';
import {
  DELETE as volunteerDelete,
  PATCH as volunteerPatch,
} from '../../../src/app/api/handlers/volunteer';
import { POST as pinPost } from '../../../src/app/api/auth/pin/route';
import { volunteerRepo, _test_insertTxosna } from '../../../src/test/store-setup';
import type { IntegrationWorld } from './world';

function assocParams(associationId: string) {
  return { params: Promise.resolve({ associationId }) };
}

function volunteerParams(volunteerId: string) {
  return { params: Promise.resolve({ volunteerId }) };
}

// Map display names to internal IDs
const ASSOCIATION_MAP: Record<string, string> = {
  'elkartea-1': 'assoc-1',
};

// ===== Given steps =====

Given(
  'I am authenticated as an ADMIN for association {string}',
  function (this: IntegrationWorld, associationName: string) {
    global.__TEST_ROLE__ = 'ADMIN';
    global.__TEST_ASSOCIATION_ID__ = ASSOCIATION_MAP[associationName] ?? associationName;
  }
);

Given('I am authenticated as a VOLUNTEER', function (this: IntegrationWorld) {
  global.__TEST_ROLE__ = 'VOLUNTEER';
});

Given(
  'volunteer {string} exists and is active',
  async function (this: IntegrationWorld, volunteerId: string) {
    const volunteer = await volunteerRepo.findById(volunteerId);
    assert.ok(volunteer, `volunteer ${volunteerId} should exist in store`);
    assert.equal(volunteer.active, true, `volunteer ${volunteerId} should be active`);
  }
);

Given(
  'the txosna {string} has PIN {string}',
  function (this: IntegrationWorld, _slug: string, pin: string) {
    assert.ok(this.currentTxosna, 'currentTxosna must be set via Background');

    _test_insertTxosna({ ...this.currentTxosna, pinHash: pin } as any);
  }
);

// ===== When steps =====

When(
  'I POST a new volunteer with email {string} and password {string}',
  async function (this: IntegrationWorld, email: string, password: string) {
    const associationId = global.__TEST_ASSOCIATION_ID__ ?? 'assoc-1';
    const body = {
      name: 'Berri Boluntarioa',
      email,
      password,
      role: 'VOLUNTEER',
    };

    const req = new NextRequest(`http://localhost/api/associations/${associationId}/volunteers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    this.lastResponse = await volunteersPost(req, assocParams(associationId));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);

    // Store email for later verification step
    (this as any)._lastCreatedEmail = email;
  }
);

When('I POST a new volunteer', async function (this: IntegrationWorld) {
  const associationId = global.__TEST_ASSOCIATION_ID__ ?? 'assoc-1';
  const body = {
    name: 'Generic Volunteer',
    email: 'generic@test.com',
    password: 'password123',
    role: 'VOLUNTEER',
  };

  const req = new NextRequest(`http://localhost/api/associations/${associationId}/volunteers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  this.lastResponse = await volunteersPost(req, assocParams(associationId));
  this.lastBody = await this.lastResponse
    .clone()
    .json()
    .catch(() => null);
});

When('I DELETE volunteer {string}', async function (this: IntegrationWorld, volunteerId: string) {
  const req = new NextRequest(`http://localhost/api/volunteers/${volunteerId}`, {
    method: 'DELETE',
  });

  this.lastResponse = await volunteerDelete(req, volunteerParams(volunteerId));
  this.lastBody = await this.lastResponse
    .clone()
    .json()
    .catch(() => null);
});

When(
  'I POST to \\/auth\\/pin with slug {string} and pin {string}',
  async function (this: IntegrationWorld, txosnaSlug: string, pin: string) {
    const body = { txosnaSlug, pin };

    const req = new NextRequest('http://localhost/api/auth/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    this.lastResponse = await pinPost(req);
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

// ===== Then steps =====

Then(
  'the stored volunteer has a hashed password \\(not plaintext\\)',
  async function (this: IntegrationWorld) {
    const email = (this as any)._lastCreatedEmail;
    assert.ok(email, 'email must be tracked from the POST step');
    const volunteer = await volunteerRepo.findByEmail(email);
    assert.ok(volunteer, `volunteer with email ${email} should exist`);
    assert.ok(
      volunteer.passwordHash.startsWith('$2'),
      `passwordHash should be a bcrypt hash (starts with $2), got: ${volunteer.passwordHash}`
    );
  }
);

Then(
  'volunteer {string} has active set to false',
  async function (this: IntegrationWorld, volunteerId: string) {
    const volunteer = await volunteerRepo.findById(volunteerId);
    assert.ok(volunteer, `volunteer ${volunteerId} should exist`);
    assert.equal(volunteer.active, false, `volunteer ${volunteerId} should have active: false`);
  }
);

Then('the body contains valid: true', function (this: IntegrationWorld) {
  const body = this.lastBody as { valid: boolean };
  assert.equal(body.valid, true, 'response body should contain valid: true');
});

Then('the body contains valid: false', function (this: IntegrationWorld) {
  const body = this.lastBody as { valid: boolean };
  assert.equal(body.valid, false, 'response body should contain valid: false');
});

When(
  'I PATCH volunteer {string} with name {string}',
  async function (this: IntegrationWorld, volunteerId: string, name: string): Promise<void> {
    const req = new NextRequest(`http://localhost/api/volunteers/${volunteerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    this.lastResponse = await volunteerPatch(req, volunteerParams(volunteerId));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

When(
  'I PATCH volunteer {string} with active false',
  async function (this: IntegrationWorld, volunteerId: string): Promise<void> {
    const req = new NextRequest(`http://localhost/api/volunteers/${volunteerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    });
    this.lastResponse = await volunteerPatch(req, volunteerParams(volunteerId));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

When(
  'I PATCH volunteer {string} with role {string}',
  async function (this: IntegrationWorld, volunteerId: string, role: string): Promise<void> {
    const req = new NextRequest(`http://localhost/api/volunteers/${volunteerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    this.lastResponse = await volunteerPatch(req, volunteerParams(volunteerId));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

Then(
  'the returned volunteer has name {string}',
  function (this: IntegrationWorld, expectedName: string): void {
    const body = this.lastBody as { name: string };
    assert.equal(body.name, expectedName);
  }
);

Then(
  'the returned volunteer has role {string}',
  function (this: IntegrationWorld, expectedRole: string): void {
    const body = this.lastBody as { role: string };
    assert.equal(body.role, expectedRole);
  }
);
