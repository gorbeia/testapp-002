import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { NextRequest } from 'next/server';
import { GET as productsGET } from '../../../src/app/api/txosnak/[slug]/products/route';
import { _test_insertProduct, _test_upsertTxosnaProduct } from '../../../src/test/store-setup';
import type { IntegrationWorld } from './world';

function params(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

When(
  'I request the product list for txosna {string}',
  async function (this: IntegrationWorld, txosnaId: string) {
    const req = new NextRequest(`http://localhost/api/txosnak/${txosnaId}/products`);
    this.lastResponse = await productsGET(req, params(txosnaId));
    this.lastBody = await this.lastResponse
      .clone()
      .json()
      .catch(() => null);
  }
);

function makeProduct(id: string) {
  return {
    id,
    categoryId: 'cat-1',
    name: id,
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
    vatTypeId: null,
    variantGroups: [],
    modifiers: [],
  };
}

Given(
  'product {string} is enabled for txosna {string}',
  function (this: IntegrationWorld, productId: string, txosnaId: string) {
    _test_insertProduct(makeProduct(productId));
    _test_upsertTxosnaProduct({
      txosnaId,
      productId,
      priceOverride: null,
      available: true,
      soldOut: false,
      preparationInstructions: null,
    });
  }
);

Given(
  'product {string} is disabled for txosna {string}',
  function (this: IntegrationWorld, productId: string, txosnaId: string) {
    _test_insertProduct(makeProduct(productId));
    _test_upsertTxosnaProduct({
      txosnaId,
      productId,
      priceOverride: null,
      available: false,
      soldOut: false,
      preparationInstructions: null,
    });
  }
);

Then(
  'product {string} appears in the catalog response',
  function (this: IntegrationWorld, productId: string) {
    const body = this.lastBody as Array<{ products: Array<{ id: string }> }>;
    const allProducts = body.flatMap((c) => c.products);
    assert.ok(
      allProducts.some((p) => p.id === productId),
      `product "${productId}" should appear in catalog`
    );
  }
);

Then('each product in the response has a txosnaProduct field', function (this: IntegrationWorld) {
  const body = this.lastBody as Array<{ products: Array<Record<string, unknown>> }>;
  assert.ok(Array.isArray(body), 'response should be an array of categories');
  const allProducts = body.flatMap((c) => c.products);
  assert.ok(allProducts.length > 0, 'response should contain at least one product');
  for (const product of allProducts) {
    assert.ok(
      'txosnaProduct' in product,
      `product "${product['id']}" should have a txosnaProduct field`
    );
  }
});
