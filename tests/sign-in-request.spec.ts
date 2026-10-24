import { expect, test } from '@playwright/test';
import { admin, latestCode, provisionAccount } from './fixtures';

test('sign-in email correction is local and accessible before requesting a normalized code', async ({ page }) => {
  const learner = await provisionAccount();
  try {
    await page.goto('/login');
    const email = page.getByLabel('Email address', { exact: true });
    const submissions: string[] = [];
    page.on('request', request => {
      if (request.url().endsWith('/api/auth/request') && request.method() === 'POST') {
        submissions.push(request.postData() ?? '');
      }
    });

    await email.fill('not-an-email');
    await page.getByRole('button', { name: 'Send code', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Enter a valid email address.');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAccessibleDescription('Enter a valid email address.');
    await expect(email).toBeFocused();
    await expect(email).toHaveValue('not-an-email');
    expect(submissions).toEqual([]);

    await email.fill(`  ${learner.email.toUpperCase()}  `);
    const delivery = page.waitForResponse(response => response.url().endsWith('/api/auth/request'));
    await page.getByRole('button', { name: 'Send code', exact: true }).click();
    expect((await delivery).status()).toBe(200);
    expect(submissions).toEqual([JSON.stringify({ email: learner.email })]);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('status', { name: 'Sign-in status' })).toHaveText(
      'If this email has a provisioned account, a code is on its way. Check your inbox and spam folder.',
    );
    await expect(page.getByLabel('Email code', { exact: true })).toBeFocused();

    const { code } = await latestCode(page.request, learner.email);
    await page.getByLabel('Email code', { exact: true }).fill(code);
    await page.getByRole('button', { name: 'Verify code', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
    expect(await (await page.request.get('/api/account')).json()).toEqual({ id: learner.id });
  } finally {
    await admin().auth.admin.deleteUser(learner.id);
  }
});
