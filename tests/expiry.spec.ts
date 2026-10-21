import { expect, test } from '@playwright/test';
import { admin, browserSignIn, latestCode, provisionAccount } from './fixtures';

test('an expired email code is rejected and a fresh code restores access', async ({ page }) => {
  test.setTimeout(100_000);
  const learner = await provisionAccount();
  try {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(learner.email);
    await page.getByRole('button', { name: 'Send code', exact: true }).click();
    const first = await latestCode(page.request, learner.email);
    await page.waitForTimeout(65_000); // Real local Auth expiry, not mocked browser time.
    await page.getByLabel('Email code').fill(first.code);
    await page.getByRole('button', { name: 'Verify code', exact: true }).click();
    await expect(page.getByRole('alert', { name: 'Sign-in status' })).toContainText('invalid or has expired');
    await page.getByRole('button', { name: 'Send another code' }).click();
    const next = await latestCode(page.request, learner.email, first.messageID);
    await page.getByLabel('Email code').fill(next.code);
    await page.getByRole('button', { name: 'Verify code', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  } finally { await admin().auth.admin.deleteUser(learner.id); }
});

test('a returning browser can refresh an expired access token without another email code', async ({ page, browser }) => {
  test.setTimeout(160_000);
  const learner = await provisionAccount();
  try {
    await browserSignIn(page, learner.email);
    await page.waitForLoadState('networkidle');
    const state = await page.context().storageState();
    await page.close();
    await new Promise(resolve => setTimeout(resolve, 125_000));
    // A separate browser context has no React state or cached application response.
    const returning = await browser.newContext({ storageState: state });
    try {
      const returned = await returning.newPage();
      await returned.goto('/');
      await expect(returned.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
      expect(await (await returned.request.get('/api/account')).json()).toEqual({ id: learner.id });
      await returned.getByRole('button', { name: 'Log out', exact: true }).click();
      await expect(returned.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
    } finally { await returning.close(); }
  } finally { await admin().auth.admin.deleteUser(learner.id); }
});
