import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

test('a provisioned learner can sign in, return, and log out', async ({ page, context }) => {
  const learner = await provisionAccount();
  try {
    await browserSignIn(page, learner.email);
    await expect(page.getByText(`Signed in as ${learner.email}`)).toBeVisible();
    expect(await (await page.request.get('/api/account')).json()).toEqual({ id: learner.id });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
    const savedCookies = await context.cookies();
    expect(savedCookies.some(cookie => cookie.httpOnly && cookie.sameSite === 'Lax')).toBe(true);
    await page.evaluate(() => {
      localStorage.setItem('learning-companion:unsent', 'synthetic unsent text');
      sessionStorage.setItem('learning-companion:selection', 'synthetic selection');
    });
    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('learning-companion:unsent'))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem('learning-companion:selection'))).toBeNull();
    expect((await page.request.get('/api/account')).status()).toBe(401);
    // Replay cookies captured before logout: clearing the browser alone is not revocation.
    await context.addCookies(savedCookies);
    expect((await page.request.get('/api/account')).status()).toBe(401);
  } finally { await admin().auth.admin.deleteUser(learner.id); }
});
