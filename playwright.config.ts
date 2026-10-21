import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/ready.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'http://localhost:3000',
    // Auth traces, screenshots and videos could contain codes or session cookies.
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  reporter: 'list',
});
