import { expect, test } from '@playwright/test';
import { admin, latestCode, provisionAccount } from './fixtures';

test('email delivery failures are safe and the learner can retry', async ({ page, request }) => {
  const learner = await provisionAccount();
  const chaosURL = `${process.env.TEST_MAIL_URL}/api/v1/chaos`;
  try {
    expect((await request.put(chaosURL, { data: { Sender: { ErrorCode: 451, Probability: 100 } } })).ok()).toBe(true);
    await page.goto('/login');
    await page.getByLabel('Email address').fill(learner.email);
    await page.getByRole('button', { name: 'Send code', exact: true }).click();
    await expect(page.getByRole('alert', { name: 'Sign-in status' })).toHaveText('Could not send a code. Try again in a moment.');
    expect((await request.put(chaosURL, { data: {} })).ok()).toBe(true);
    await page.waitForTimeout(2100);
    await page.getByRole('button', { name: 'Send code', exact: true }).click();
    await expect(page.getByLabel('Email code')).toBeVisible();
    await latestCode(request, learner.email);
  } finally {
    await request.put(chaosURL, { data: {} });
    await admin().auth.admin.deleteUser(learner.id);
  }
});

test('a learner can correct email, recover from an invalid code and request another code', async ({ page }) => {
  const learner = await provisionAccount();
  try {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto('/login');
    await page.getByLabel('Email address').fill('mistyped@example.test');
    await page.getByRole('button', { name: 'Send code', exact: true }).click();
    await page.getByRole('button', { name: 'Change email' }).click();
    await expect(page.getByLabel('Email address')).toBeFocused();
    await page.getByLabel('Email address').fill(learner.email);
    await page.getByRole('button', { name: 'Send code', exact: true }).click();
    const first = await latestCode(page.request, learner.email);
    const invalid = first.code === '000000' ? '111111' : '000000';
    await page.getByLabel('Email code').fill(invalid);
    await page.getByRole('button', { name: 'Verify code', exact: true }).click();
    await expect(page.getByRole('alert', { name: 'Sign-in status' })).toContainText('invalid or has expired');
    // Do not assume that a resend invalidates older codes or changes token contents.
    await page.waitForTimeout(2100); // Real provider's local minimum resend interval.
    await page.getByRole('button', { name: 'Send another code' }).click();
    const next = await latestCode(page.request, learner.email, first.messageID);
    await page.getByLabel('Email code').fill(next.code);
    await page.getByRole('button', { name: 'Verify code', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeInViewport();
    }
  } finally { await admin().auth.admin.deleteUser(learner.id); }
});

test('request limits are recoverable without leaving code entry', async ({ page }) => {
  const learner = await provisionAccount();
  try {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(learner.email);
    await page.getByRole('button', { name: 'Send code', exact: true }).click();
    await expect(page.getByLabel('Email code')).toBeVisible();
    await page.getByRole('button', { name: 'Send another code' }).click();
    await expect(page.getByRole('alert', { name: 'Sign-in status' })).toContainText('Too many requests');
    await page.waitForTimeout(2100);
    await page.getByRole('button', { name: 'Send another code' }).click();
    await expect(page.getByRole('status')).toContainText('a code is on its way');
  } finally { await admin().auth.admin.deleteUser(learner.id); }
});
