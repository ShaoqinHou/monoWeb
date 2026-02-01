import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    port: 3001,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
