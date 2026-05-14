/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { NextRequest } from 'next/server';
import {
  GET as settingsGET,
  PATCH as settingsPATCH,
} from '../../../src/app/api/handlers/txosna-settings';
import { PATCH as pinPATCH } from '../../../src/app/api/txosnak/[slug]/pin/route';
import { GET as txosnaGET } from '../../../src/app/api/handlers/txosna';
import { txosnaRepo, _test_insertTxosna } from '../../../src/test/store-setup';
import bcrypt from 'bcryptjs';
import type { IntegrationWorld } from './world';

function slugParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

// ===== Given steps =====

Given('I am authenticated as an ADMIN', function (this: IntegrationWorld) {
  global.__TEST_ROLE__ = 'ADMIN';
  global.__TEST_ASSOCIATION_ID__ = 'assoc-1';
});

Given('the txosna {string} exists', async function (this: IntegrationWorld, slug: string) {
  const existing = await txosnaRepo.findBySlug(slug);
  if (existing) {
    this.currentTxosna = existing;
    return;
  }

  const txosna = {
    id: `test-txosna-${slug}`,
    slug,
    name: `Test Txosna (${slug})`,
    status: 'OPEN' as const,
    counterSetup: 'SINGLE' as const,
    waitMinutes: null,
    pinHash: '0000',
    enabledChannels: ['COUNTER', 'SELF_SERVICE'] as const,
    enabledPaymentMethods: ['CASH'] as const,
    pendingPaymentTimeout: 15,
    printingEnabled: false,
    associationId: 'assoc-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  _test_insertTxosna(txosna as any);
  this.currentTxosna = txosna as any;
});

// ===== When steps =====

When(
  'I PATCH settings for {string} with status {string}',
  async function (this: IntegrationWorld, slug: string, status: string) {
    const body = { status };

    const req = new NextRequest(`http://localhost/api/txosnak/${slug}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    this.lastResponse = await settingsPATCH(req, slugParams(slug));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

When('I GET settings for {string}', async function (this: IntegrationWorld, slug: string) {
  const req = new NextRequest(`http://localhost/api/txosnak/${slug}/settings`, { method: 'GET' });
  this.lastResponse = await settingsGET(req, slugParams(slug));
  this.lastBody = await this.lastResponse
    .clone()
    .json()
    .catch(() => null);
});

When(
  'I PATCH settings for {string} with waitMinutes {int}',
  async function (this: IntegrationWorld, slug: string, waitMinutes: number) {
    const req = new NextRequest(`http://localhost/api/txosnak/${slug}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waitMinutes }),
    });
    this.lastResponse = await settingsPATCH(req, slugParams(slug));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

When(
  'I PATCH settings for {string} with enabledPaymentMethods {string}',
  async function (this: IntegrationWorld, slug: string, methods: string) {
    const enabledPaymentMethods = methods.split(',').map((m) => m.trim());
    const req = new NextRequest(`http://localhost/api/txosnak/${slug}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabledPaymentMethods }),
    });
    this.lastResponse = await settingsPATCH(req, slugParams(slug));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

When(
  'I PATCH PIN for {string} with {string}',
  async function (this: IntegrationWorld, slug: string, pin: string) {
    const req = new NextRequest(`http://localhost/api/txosnak/${slug}/pin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    this.lastResponse = await pinPATCH(req, slugParams(slug));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

// ===== Then steps =====

Then('the settings response has required fields', function (this: IntegrationWorld) {
  const body = this.lastBody as Record<string, unknown>;
  const required = [
    'status',
    'waitMinutes',
    'counterSetup',
    'enabledChannels',
    'enabledPaymentMethods',
    'printingEnabled',
    'pendingPaymentTimeout',
  ];
  for (const field of required) {
    assert.ok(field in body, `settings response should include field "${field}"`);
  }
});

Then('the response body does not include pinHash', function (this: IntegrationWorld) {
  const body = this.lastBody as Record<string, unknown>;
  assert.ok(!('pinHash' in body), 'settings response should not expose pinHash');
});

Then('the settings waitMinutes is {int}', function (this: IntegrationWorld, expected: number) {
  const body = this.lastBody as { waitMinutes: number };
  assert.equal(body.waitMinutes, expected, `settings waitMinutes should be ${expected}`);
});

Then(
  'the settings enabledPaymentMethods includes {string}',
  function (this: IntegrationWorld, method: string) {
    const body = this.lastBody as { enabledPaymentMethods: string[] };
    assert.ok(
      body.enabledPaymentMethods.includes(method),
      `enabledPaymentMethods should include "${method}"`
    );
  }
);

Then(
  'the stored pinHash for {string} verifies against {string}',
  async function (this: IntegrationWorld, slug: string, pin: string) {
    const txosna = await txosnaRepo.findBySlug(slug);
    assert.ok(txosna, `txosna "${slug}" should exist`);
    assert.ok(txosna.pinHash, `txosna "${slug}" should have a pinHash`);
    const matches = await bcrypt.compare(pin, txosna.pinHash);
    assert.ok(matches, `stored pinHash should verify against "${pin}"`);
  }
);

Then(
  'the stored pinHash for {string} does not equal {string}',
  async function (this: IntegrationWorld, slug: string, pin: string) {
    const txosna = await txosnaRepo.findBySlug(slug);
    assert.ok(txosna, `txosna "${slug}" should exist`);
    assert.notEqual(txosna.pinHash, pin, `stored pinHash should not equal the plaintext "${pin}"`);
  }
);

Then(
  'fetching the txosna returns status {string}',
  async function (this: IntegrationWorld, expectedStatus: string) {
    assert.ok(this.currentTxosna, 'currentTxosna must be set');
    const req = new NextRequest(`http://localhost/api/txosnak/${this.currentTxosna.slug}`, {
      method: 'GET',
    });

    const response = await txosnaGET(req, slugParams(this.currentTxosna.slug));
    const body = await response
      .clone()
      .json()
      .catch(() => null);

    assert.equal(body.status, expectedStatus, `txosna status should be ${expectedStatus}`);
  }
);
