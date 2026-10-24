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
    await expect(page.getByRole('alert', { name: 'Sign-in status' })).toHaveText('Enter a valid email address.');
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
    await expect(page.getByRole('alert', { name: 'Sign-in status' })).toHaveCount(0);
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

test('a malformed code request response keeps email correction available without exposing diagnostics', async ({ page }) => {
  const learner = await provisionAccount();
  try {
    await page.goto('/login');
    const email = page.getByLabel('Email address', { exact: true });
    await email.fill(learner.email);
    for (const response of [
      { status: 200, body: JSON.stringify({ ok: false, diagnostic: 'unsafe synthetic email diagnostic' }) },
      { status: 200, body: 'null' },
      { status: 200, body: '[]' },
      { status: 200, body: '{"ok":"true"}' },
      { status: 200, body: '{' },
      { status: 503, body: JSON.stringify({ error: 'unsafe synthetic email diagnostic' }) },
      { status: 503, body: 'null' },
      { status: 503, body: '{' },
    ]) {
      await page.route('**/api/auth/request', route => route.fulfill({ ...response, contentType: 'application/json' }));
      await page.getByRole('button', { name: 'Send code', exact: true }).click();
      await expect(page.getByRole('alert', { name: 'Sign-in status' })).toHaveText('Could not send a code. Try again in a moment.');
      await expect(email).toHaveValue(learner.email);
      await expect(page.getByLabel('Email code', { exact: true })).toHaveCount(0);
      await expect(page.locator('main')).not.toContainText('unsafe synthetic email diagnostic');
      await page.unroute('**/api/auth/request');
    }
    await page.route('**/api/auth/request', route => route.abort('failed'));
    await page.getByRole('button', { name: 'Send code', exact: true }).click();
    await expect(page.getByRole('alert', { name: 'Sign-in status' })).toHaveText('Could not connect. Check your connection and try again.');
    await expect(email).toHaveValue(learner.email);
    await page.unroute('**/api/auth/request');
    await page.getByRole('button', { name: 'Send code', exact: true }).click();
    await expect(page.getByLabel('Email code', { exact: true })).toBeFocused();
    await latestCode(page.request, learner.email);
  } finally {
    await admin().auth.admin.deleteUser(learner.id);
  }
});

test('request and resend keep pending controls and recover from a real Auth outage', async ({ page, request }) => {
  const learner = await provisionAccount();
  const control = process.env.TEST_AUTH_CONTROL_URL;
  let release = () => {};
  try {
    await page.goto('/login');
    const email = page.getByLabel('Email address', { exact: true });
    await email.fill(learner.email);
    expect((await request.post(`${control}/control/auth/off`)).ok()).toBe(true);
    const failedDelivery = page.waitForResponse(response => response.url().endsWith('/api/auth/request'));
    await page.getByRole('button', { name: 'Send code', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Please wait…', exact: true })).toBeDisabled();
    expect((await failedDelivery).status()).toBe(503);
    await expect(page.getByRole('alert', { name: 'Sign-in status' })).toHaveText('Could not send a code. Try again in a moment.');
    await expect(email).toHaveValue(learner.email);
    await expect(page.getByRole('button', { name: 'Send code', exact: true })).toBeEnabled();
    await expect(page.getByLabel('Email code', { exact: true })).toHaveCount(0);
    expect((await request.post(`${control}/control/auth/on`)).ok()).toBe(true);
    await page.getByRole('button', { name: 'Send code', exact: true }).click();
    await expect(page.getByLabel('Email code', { exact: true })).toBeFocused();
    const first = await latestCode(page.request, learner.email);

    await page.waitForTimeout(2100); // Real local provider resend interval.
    await page.getByLabel('Email code', { exact: true }).fill('123456');
    await page.route('**/api/auth/request', async route => {
      await new Promise<void>(resolve => { release = resolve; });
      await route.continue();
    });
    await page.getByRole('button', { name: 'Send another code', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Please wait…', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Send another code', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Change email', exact: true })).toBeDisabled();
    await expect(page.getByLabel('Email code', { exact: true })).toHaveValue('123456');
    release();
    const next = await latestCode(page.request, learner.email, first.messageID);
    await expect(page.getByLabel('Email code', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('Email code', { exact: true })).toBeFocused();
    await expect(page.getByRole('status', { name: 'Sign-in status' })).toContainText('a code is on its way');
    await page.getByLabel('Email code', { exact: true }).fill(next.code);
    await page.getByRole('button', { name: 'Verify code', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  } finally {
    release();
    await request.post(`${control}/control/auth/on`);
    await admin().auth.admin.deleteUser(learner.id);
  }
});
