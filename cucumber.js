const common = {
  format: ['progress-bar', 'html:reports/cucumber.html'],
  publishQuiet: true,
};

module.exports = {
  // Fast — no network, no browser
  integration: {
    ...common,
    require: ['features/step-definitions/integration/**/*.ts', 'features/support/hooks.ts'],
    requireModule: ['ts-node/register'],
    paths: ['features/**/*.feature'],
    tags: 'not @e2e-only',
  },

  // Slow — real browser against running Next.js dev server
  e2e: {
    ...common,
    require: ['features/step-definitions/e2e/**/*.ts', 'features/support/hooks.ts'],
    requireModule: ['ts-node/register'],
    paths: ['features/**/*.feature'],
    tags: '@smoke or @e2e',
  },
};
