import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

test('create private Subjects, validate names and switch durable study contexts', async ({ page, browser }) => {
  const account = await provisionAccount();
  const other = await browser.newContext();
  try {
    await browserSignIn(page, account.email);
    await expect(page.getByRole('heading', { name: 'No Subjects yet' })).toBeVisible();
    await page.getByRole('button', { name: 'Switch subject' }).click();
    await page.getByRole('menuitem', { name: 'Add subject' }).click();
    await page.getByLabel('Subject name', { exact: true }).fill('   ');
    await page.getByRole('button', { name: 'Create subject', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Enter a Subject name');
    await page.getByLabel('Subject name', { exact: true }).fill('  Photography  ');
    await page.getByRole('button', { name: 'Create subject', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Photography', exact: true })).toBeVisible();
    const photographyURL = page.url();
    await expect(page.getByText(/^Capture study material in Learning Documents below/)).toContainText('Ready to Practice');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Photography', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Switch subject' }).click();
    await page.getByRole('menuitem', { name: 'Add subject' }).click();
    await page.getByLabel('Subject name', { exact: true }).fill('photography');
    await page.getByRole('button', { name: 'Create subject', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('already exists');
    await page.getByLabel('Subject name', { exact: true }).fill('Physics');
    await page.getByRole('button', { name: 'Create subject', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Physics', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Switch subject' }).click();
    await page.getByRole('menuitemradio', { name: 'Photography', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Photography', exact: true })).toBeVisible();
    await page.waitForTimeout(2100); // Local provider's minimum resend interval.
    const second = await other.newPage();
    await browserSignIn(second, account.email);
    await second.goto(photographyURL);
    await expect(second.getByRole('heading', { name: 'Photography', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await page.waitForTimeout(2100);
    await browserSignIn(page, account.email);
    await page.goto(photographyURL);
    await expect(page.getByRole('heading', { name: 'Photography', exact: true })).toBeVisible();
  } finally {
    await other.close();
    await admin().auth.admin.deleteUser(account.id);
  }
});
