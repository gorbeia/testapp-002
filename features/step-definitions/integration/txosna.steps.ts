import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { GET as txosnaGET } from '../../../src/app/api/handlers/txosna';
import { GET as catalogGET } from '../../../src/app/api/handlers/catalog';
import {
  _test_insertTxosna,
  _test_insertProduct,
  _test_upsertTxosnaProduct,
} from '@/test/store-setup';
import type { IntegrationWorld } from './world';

function params(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

Given(
  'the txosna {string} exists and is OPEN',
  async function (this: IntegrationWorld, slug: string) {
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
      // Links to the seeded mock association so catalog queries find products
      associationId: 'assoc-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    _test_insertTxosna(txosna as any);
    this.currentTxosna = txosna as any;
  }
);

When(
  'I request the txosna details for slug {string}',
  async function (this: IntegrationWorld, slug: string) {
    this.lastResponse = await txosnaGET(new Request('http://localhost'), params(slug));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

When('I request the catalog for {string}', async function (this: IntegrationWorld, slug: string) {
  this.lastResponse = await catalogGET(new Request('http://localhost'), params(slug));
  this.lastBody = await this.lastResponse
    .clone()
    .json()
    .catch(() => null);
});

Then('the response status is {int}', function (this: IntegrationWorld, status: number) {
  assert.equal(this.lastResponse?.status, status);
});

Then(
  'the response includes the txosna name and status {string}',
  function (this: IntegrationWorld, expectedStatus: string) {
    const body = this.lastBody as Record<string, unknown>;
    assert.ok(body.name, 'response should include name');
    assert.equal(body.status, expectedStatus);
  }
);

Then(
  'the response contains at least 1 category with nested products',
  function (this: IntegrationWorld) {
    const body = this.lastBody as Array<{ products: unknown[] }>;
    assert.ok(Array.isArray(body), 'catalog should be an array');
    assert.ok(body.length >= 1, 'catalog should have at least 1 category');
    assert.ok(
      body.every((c) => Array.isArray(c.products) && c.products.length > 0),
      'each category should have at least 1 product'
    );
  }
);

Given(
  'product {string} has available set to false',
  function (this: IntegrationWorld, productId: string) {
    _test_insertProduct({
      id: productId,
      categoryId: 'cat-1',
      name: productId,
      description: null,
      defaultPrice: 5,
      imageUrl: null,
      allergens: [],
      dietaryFlags: [],
      ageRestricted: false,
      requiresPreparation: false,
      available: false,
      splittable: false,
      splitMaxWays: 1,
      removableIngredients: [],
      preparationInstructions: null,
      displayOrder: 99,
      kitchenPost: null,
      variantGroups: [],
      modifiers: [],
    });
  }
);

Then(
  'product {string} is not in the response',
  function (this: IntegrationWorld, productId: string) {
    const body = this.lastBody as Array<{ products: Array<{ id: string }> }>;
    const allProducts = body.flatMap((c) => c.products);
    assert.ok(
      !allProducts.some((p) => p.id === productId),
      `product ${productId} should not be in catalog`
    );
  }
);

Given(
  'product {string} has soldOut set to true',
  function (this: IntegrationWorld, productId: string) {
    assert.ok(this.currentTxosna, 'currentTxosna must be set via Background step');
    _test_insertProduct({
      id: productId,
      categoryId: 'cat-1',
      name: productId,
      description: null,
      defaultPrice: 5,
      imageUrl: null,
      allergens: [],
      dietaryFlags: [],
      ageRestricted: false,
      requiresPreparation: false,
      available: true,
      splittable: false,
      splitMaxWays: 1,
      removableIngredients: [],
      preparationInstructions: null,
      displayOrder: 99,
      kitchenPost: null,
      variantGroups: [],
      modifiers: [],
    });
    _test_upsertTxosnaProduct({
      txosnaId: this.currentTxosna.id,
      productId,
      priceOverride: null,
      available: true,
      soldOut: true,
      preparationInstructions: null,
    });
  }
);

Then(
  'product {string} appears in the response with soldOut true',
  function (this: IntegrationWorld, productId: string) {
    const body = this.lastBody as Array<{ products: Array<{ id: string; soldOut: boolean }> }>;
    const allProducts = body.flatMap((c) => c.products);
    const product = allProducts.find((p) => p.id === productId);
    assert.ok(product, `product ${productId} should be in catalog`);
    assert.equal(product.soldOut, true);
  }
);
