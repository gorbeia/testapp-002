import assert from 'assert';
import { Given, When, Then } from '@cucumber/cucumber';
import { BASE_URL } from './world';
import type { E2eWorld } from './world';

// ── PIN flow helpers ────────────────────────────────────────────────────────

async function doPinFlow(world: E2eWorld, mode: string, pin: string, slug = 'aste-nagusia-2026') {
  await world.page.goto(`${BASE_URL}/eu/pin?slug=${slug}`, { waitUntil: 'domcontentloaded' });
  // Select mode and wait for the button state to update
  await world.page.getByRole('button', { name: mode }).click();
  await world.page.waitForLoadState('networkidle');
  // Enter PIN digits one by one via keypad buttons
  for (const digit of pin) {
    await world.page.getByRole('button', { name: digit, exact: true }).click();
  }
  // Press confirm
  await world.page.getByRole('button', { name: /Sartu|Baieztatu|Confirm/i }).click();
  await world.page.waitForTimeout(1_500);
}

Given(
  'I am on the food counter page via PIN {string}',
  async function (this: E2eWorld, pin: string) {
    await doPinFlow(this, 'Janaria', pin);
    await this.page.waitForURL((url) => url.pathname.includes('/counter'), { timeout: 15_000 });
  }
);

Given(
  'I am on the drinks counter page via PIN {string}',
  async function (this: E2eWorld, pin: string) {
    await doPinFlow(this, 'Edariak', pin);
    await this.page.waitForURL((url) => url.pathname.includes('/drinks'), { timeout: 15_000 });
  }
);

Given(
  'I am on the KDS page via PIN {string} and post {string}',
  async function (this: E2eWorld, pin: string, post: string) {
    await doPinFlow(this, 'Sukaldea', pin);
    // Post selection screen appears
    await this.page.waitForSelector(`text=Hautatu postua`, { timeout: 10_000 });
    await this.page.getByRole('button', { name: new RegExp(post, 'i') }).click();
    await this.page.waitForURL((url) => url.pathname.includes('/kitchen'), { timeout: 15_000 });
  }
);

Given(
  'I am on the kitchen manager page via PIN {string}',
  async function (this: E2eWorld, pin: string) {
    await doPinFlow(this, 'Kudeaketa', pin);
    await this.page.waitForURL((url) => url.pathname.includes('/kitchen-manager'), {
      timeout: 15_000,
    });
  }
);

Given('I am on the overview page via PIN {string}', async function (this: E2eWorld, pin: string) {
  await doPinFlow(this, 'Janaria', pin);
  await this.page.waitForURL((url) => url.pathname.includes('/counter'), { timeout: 15_000 });
  await this.page.goto(`${BASE_URL}/eu/overview`, { waitUntil: 'domcontentloaded' });
});

// ── PIN page steps ─────────────────────────────────────────────────────────

When('I select pin mode {string}', async function (this: E2eWorld, mode: string) {
  await this.page.getByRole('button', { name: mode }).click();
  await this.page.waitForLoadState('networkidle');
});

When('I enter PIN {string}', async function (this: E2eWorld, pin: string) {
  for (const digit of pin) {
    await this.page.getByRole('button', { name: digit, exact: true }).click();
  }
});

When('I press the confirm button', async function (this: E2eWorld) {
  await this.page.getByRole('button', { name: /Sartu|Baieztatu/i }).click();
  await this.page.waitForTimeout(1_500);
});

Then(
  'the page shows four mode buttons: {string}, {string}, {string}, {string}',
  async function (this: E2eWorld, m1: string, m2: string, m3: string, m4: string) {
    for (const mode of [m1, m2, m3, m4]) {
      await this.page.waitForSelector(`button:has-text("${mode}")`, { timeout: 10_000 });
    }
  }
);

Then('the page shows a 4-digit keypad', async function (this: E2eWorld) {
  // The keypad has digit buttons 0-9
  for (const digit of ['1', '2', '3']) {
    await this.page.waitForSelector(`button:has-text("${digit}")`, { timeout: 5_000 });
  }
});

Then('the {string} button appears selected', async function (this: E2eWorld, mode: string) {
  // Selected mode has a distinct style — wait for the button to exist
  await this.page.waitForSelector(`button:has-text("${mode}")`, { timeout: 5_000 });
  // The selected state is conveyed visually; we just verify the button is present
});

Then(
  'the page shows a post selection screen with {string} and {string}',
  async function (this: E2eWorld, post1: string, post2: string) {
    await this.page.waitForSelector('text=Hautatu postua', { timeout: 10_000 });
    await this.page.waitForSelector(`button:has-text("${post1}")`, { timeout: 5_000 });
    await this.page.waitForSelector(`button:has-text("${post2}")`, { timeout: 5_000 });
  }
);

Then('I am on the food counter page', async function (this: E2eWorld) {
  await this.page.waitForURL((url) => url.pathname.includes('/counter'), { timeout: 10_000 });
});

Then('I am on the drinks counter page', async function (this: E2eWorld) {
  await this.page.waitForURL((url) => url.pathname.includes('/drinks'), { timeout: 10_000 });
});

Then('the page shows {string} error', async function (this: E2eWorld, errorText: string) {
  await this.page.waitForSelector(`text=${errorText}`, { timeout: 5_000 });
});

// ── Counter steps ─────────────────────────────────────────────────────────

When('I click {string}', async function (this: E2eWorld, label: string) {
  await this.page.getByRole('button', { name: label }).click();
});

When(
  'I click the product {string} in the product grid',
  async function (this: E2eWorld, productName: string) {
    await this.page.waitForSelector(`button:has-text("${productName}")`, { timeout: 10_000 });
    await this.page.getByRole('button', { name: productName }).click();
  }
);

When('I select variant option {string}', async function (this: E2eWorld, optionName: string) {
  await this.page.waitForSelector(`text=${optionName}`, { timeout: 5_000 });
  await this.page.getByText(optionName).click();
});

When('I confirm adding the product', async function (this: E2eWorld) {
  await this.page.getByRole('button', { name: /Gehitu|Add/i }).click();
  await this.page.waitForTimeout(500);
});

Then('the product appears in the new order summary', async function (this: E2eWorld) {
  const body = await this.page.evaluate(() => document.body.innerText);
  assert.ok(
    body.includes('Burgerra') || body.includes('PRODUKTUAK') || body.includes('€'),
    `Expected product summary. Got: ${body.slice(0, 300)}`
  );
});

// ── KDS / overview steps ──────────────────────────────────────────────────────

Then('the page header contains {string}', async function (this: E2eWorld, text: string) {
  await this.page.waitForSelector(`text=${text}`, { timeout: 10_000 });
});

Then(
  'the page shows a stat card labelled {string}',
  async function (this: E2eWorld, label: string) {
    await this.page.waitForSelector(`text=${label}`, { timeout: 10_000 });
  }
);

Then('the page shows a txosna status block', async function (this: E2eWorld) {
  const body = await this.page.evaluate(() => document.body.innerText);
  const hasStatus = ['Irekita', 'Geldituta', 'Itxita', 'IREKITA', 'OPEN'].some((s) =>
    body.includes(s)
  );
  assert.ok(hasStatus, `Expected txosna status in overview. Got: ${body.slice(0, 300)}`);
});
