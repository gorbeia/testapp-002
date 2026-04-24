import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { chromium, Browser, BrowserContext, Page } from 'playwright';

export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export class E2eWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async openBrowser() {
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  async closeBrowser() {
    await this.browser?.close();
  }

  /** Navigate to a path and wait for the page to be interactive */
  async goto(path: string) {
    await this.page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
  }

  /** Base URL of the current txosna dashboard, set after login */
  txosnaBaseUrl: string = '';

  consoleErrors: string[] = [];

  trackConsoleErrors() {
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') this.consoleErrors.push(msg.text());
    });
    this.page.on('pageerror', (err) => {
      this.consoleErrors.push(err.message);
    });
  }
}

setWorldConstructor(E2eWorld);
