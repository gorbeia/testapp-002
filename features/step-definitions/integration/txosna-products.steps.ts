import assert from 'assert';
import { When, Then } from '@cucumber/cucumber';
import { NextRequest } from 'next/server';
import { GET as productsGET } from '../../../src/app/api/txosnak/[slug]/products/route';
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
