import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

test('save ordered Drafts across sessions and reject stale writes', async ({ page, browser }) => {
  const account = await provisionAccount();
  const other = await browser.newContext();
  const origin = process.env.TEST_BASE_URL!;
  try {
    await browserSignIn(page, account.email);
    const subject = await (await page.request.post('/api/subjects', { headers: { origin }, data: { name: 'Physics' } })).json();
    const input = { subjectId: subject.id, id: crypto.randomUUID(), revision: 0, title: 'Motion', description: 'Study notes', blocks: [{ id: crypto.randomUUID(), markdown: '## Velocity\n\nDistance over time.' }] };
    const created = await page.request.post('/api/documents', { headers: { origin }, data: input });
    expect(created.status()).toBe(200);
    await page.goto(`/?subject=${subject.id}`);
    await page.getByRole('button', { name: 'Open Motion', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Velocity', exact: true })).toBeVisible();
    await page.waitForTimeout(2100);
    const second = await other.newPage();
    await browserSignIn(second, account.email);
    await second.goto(`/?subject=${subject.id}`);
    await second.getByRole('button', { name: 'Open Motion', exact: true }).click();
    await page.getByRole('button', { name: 'Edit block 1', exact: true }).click();
    await page.getByLabel('Block 1 Markdown').fill('Newer saved text');
    await page.getByLabel('Block 1 Markdown').press('Control+Enter');
    await page.getByRole('button', { name: 'Save as Draft', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Saved on server');
    await second.getByRole('button', { name: 'Edit block 1', exact: true }).click();
    await second.getByLabel('Block 1 Markdown').fill('Older session attempted text');
    await second.getByRole('button', { name: 'Save block', exact: true }).click();
    await second.getByRole('button', { name: 'Save as Draft', exact: true }).click();
    await expect(second.getByRole('alert').filter({ hasText: 'newer' })).toBeVisible();
    await expect(second.getByText('Older session attempted text', { exact: true })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Open Motion', exact: true }).click();
    await expect(page.getByText('Newer saved text', { exact: true })).toBeVisible();
  } finally { await other.close(); await admin().auth.admin.deleteUser(account.id); }
});
