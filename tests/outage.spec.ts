import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

test('temporary Auth and Data API outages preserve local work and allow retry', async ({ page, request }) => {
  const learner = await provisionAccount();
  const control = process.env.TEST_AUTH_CONTROL_URL;
  try {
    await browserSignIn(page, learner.email);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.setItem('learning-companion:unsent', 'synthetic local work'));
    for (const service of ['data', 'auth']) {
      expect((await request.post(`${control}/control/${service}/off`)).ok()).toBe(true);
      expect((await page.request.get('/api/account')).status()).toBe(503);
      // Exercise the same public browser return event that revalidates an open app.
      await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
      await expect(page.getByRole('alert', { name: 'Account status' })).toContainText('temporarily unavailable', { timeout: 15_000 });
      expect(await page.evaluate(() => localStorage.getItem('learning-companion:unsent'))).toBe('synthetic local work');
      await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
      expect((await request.post(`${control}/control/${service}/on`)).ok()).toBe(true);
      await page.getByRole('button', { name: 'Try again', exact: true }).click();
      await expect(page.getByRole('alert', { name: 'Account status' })).toHaveCount(0);
      expect(await (await page.request.get('/api/account')).json()).toEqual({ id: learner.id });
    }
  } finally {
    await request.post(`${control}/control/data/on`);
    await request.post(`${control}/control/auth/on`);
    await admin().auth.admin.deleteUser(learner.id);
  }
});
