import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

test('malformed document reads are unavailable rather than empty and recover on reload', async ({ page }) => {
  const account = await provisionAccount();
  const origin = process.env.TEST_BASE_URL!;
  try {
    await browserSignIn(page, account.email);
    const subject = await (await page.request.post('/api/subjects', {
      headers: { origin }, data: { name: 'Document read recovery' },
    })).json();
    const saved = await page.request.post('/api/documents', {
      headers: { origin },
      data: {
        subjectId: subject.id, id: crypto.randomUUID(), revision: 0,
        title: 'Motion', description: 'Study notes',
        blocks: [{ id: crypto.randomUUID(), markdown: '## Velocity\n\nDistance over time.' }],
      },
    });
    expect(saved.status()).toBe(200);
    await page.route('**/api/documents?subject=*', async route => {
      const response = await route.fetch();
      const documents = await response.json();
      await route.fulfill({ response, json: documents.map((document: Record<string, unknown>) => ({ ...document, revision: '1' })) });
    });
    await page.goto(`/?subject=${subject.id}`);
    const workspace = page.getByRole('region', { name: 'Learning Documents', exact: true });
    await expect(workspace.getByRole('alert')).toHaveText('Could not load documents. Reload to try again.');
    await expect(workspace.getByRole('button', { name: 'Open Motion', exact: true })).toHaveCount(0);
    await expect(workspace.getByText('No Learning Documents yet.', { exact: false })).toHaveCount(0);
    await page.unroute('**/api/documents?subject=*');
    await page.reload();
    await page.getByRole('button', { name: 'Open Motion', exact: true }).click();
    await page.getByRole('button', { name: 'Document preview', exact: true }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Velocity', exact: true })).toBeVisible();
  } finally {
    await admin().auth.admin.deleteUser(account.id);
  }
});
