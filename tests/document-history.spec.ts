import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

test('browser Back/Forward preserves outstanding Subject Draft and open block text', async ({ page }) => {
  const account = await provisionAccount();
  const origin = process.env.TEST_BASE_URL!;
  try {
    await browserSignIn(page, account.email);
    const first = await (await page.request.post('/api/subjects', { headers: { origin }, data: { name: 'First Subject' } })).json();
    await page.request.post('/api/subjects', { headers: { origin }, data: { name: 'Second Subject' } });
    await page.goto(`/?subject=${first.id}`);
    await page.getByRole('button', { name: 'Switch subject' }).click();
    await page.getByRole('menuitemradio', { name: 'Second Subject', exact: true }).click();
    await page.getByRole('button', { name: 'New Learning Document', exact: true }).click();
    await page.getByLabel('Document title', { exact: true }).fill('Outstanding title');
    await page.getByRole('button', { name: 'Add Markdown block', exact: true }).click();
    await page.getByLabel('Block 1 Markdown').fill('Text not even saved to the local block yet');
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'First Subject', exact: true })).toBeVisible();
    await page.goForward();
    await expect(page.getByLabel('Document title', { exact: true })).toHaveValue('Outstanding title');
    await expect(page.getByLabel('Block 1 Markdown')).toHaveValue('Text not even saved to the local block yet');
    await expect(page.getByRole('status')).toContainText('Unsaved local edits');
  } finally { await admin().auth.admin.deleteUser(account.id); }
});
