/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { NextRequest } from 'next/server';
import { PATCH as settingsPATCH } from '../../../src/app/api/txosnak/[slug]/settings/route';
import { GET as txosnaGET } from '../../../src/app/api/txosnak/[slug]/route';
import { _test_insertTxosna } from '../../../src/test/store-setup';
import type { IntegrationWorld } from './world';

function slugParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

// ===== Given steps =====

Given('I am authenticated as an ADMIN', function (this: IntegrationWorld) {
  global.__TEST_ROLE__ = 'ADMIN';
  global.__TEST_ASSOCIATION_ID__ = 'assoc-1';
});

Given('the txosna {string} exists', function (this: IntegrationWorld, slug: string) {
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

// ===== Then steps =====

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
