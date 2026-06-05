const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 15000,
  expect: { timeout: 5000 },
  use: {
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: 'off',
    trace: 'off',
    baseURL: 'http://localhost:3456',
  },
  webServer: {
    command: 'npx serve . -p 3456 --no-clipboard --cors',
    port: 3456,
    timeout: 10000,
    reuseExistingServer: true,
  },
});
