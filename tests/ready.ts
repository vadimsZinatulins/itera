import { expect } from '@playwright/test';

export default async function ready() {
  await expect.poll(async () => {
    try {
      const auth = await fetch(`${process.env.TEST_SUPABASE_URL}/auth/v1/health`, {
        headers: { apikey: process.env.TEST_SUPABASE_PUBLIC_KEY ?? '' },
      });
      const app = await fetch(`${process.env.TEST_BASE_URL}/api/account`);
      return auth.ok && app.status === 401;
    } catch { return false; }
  }, { message: 'Local application and authentication service must be ready', timeout: 30_000 }).toBe(true);
}
