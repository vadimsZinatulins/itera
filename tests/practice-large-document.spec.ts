import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

test('a valid large approved document can still save a Draft revision without changing its Practice version', async ({ page }) => {
  const account = await provisionAccount();
  const headers = { origin: process.env.TEST_BASE_URL! };
  try {
    await browserSignIn(page, account.email);
    const subject = await (await page.request.post('/api/subjects', { headers, data: { name: 'Large documents' } })).json();
    // Valid under the 500 KB block limit, but duplicating the snapshot in a save
    // would exceed the 600 KB application request limit.
    const content = 'a'.repeat(310000);
    const input = { id: crypto.randomUUID(), subjectId: subject.id, revision: 0, title: 'Large document', description: 'Original description', blocks: [{ id: 'one', markdown: content }] };
    expect((await page.request.post('/api/documents', { headers, data: input })).status()).toBe(200);
    expect((await page.request.post('/api/documents/approve', { headers, data: { id: input.id, subjectId: subject.id, revision: 1 } })).status()).toBe(200);
    await page.goto(`/?subject=${subject.id}`);
    await page.getByRole('button', { name: 'Open Large document', exact: true }).click();
    await page.getByLabel('Document title', { exact: true }).fill('Revised large document');
    const saving = page.waitForResponse(response => response.url().endsWith('/api/documents') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Save as Draft', exact: true }).click();
    expect((await saving).status()).toBe(200);
    await expect(page.getByRole('status')).toContainText('Saved on server · Draft revision');
    await page.reload();
    await page.getByRole('button', { name: 'Open Revised large document', exact: true }).click();
    await expect(page.getByRole('article', { name: 'Block 1', exact: true })).toContainText(content);
    const documents = await (await page.request.get(`/api/documents?subject=${subject.id}`)).json();
    expect(documents[0].practice_version).toEqual({ revision: 1, title: 'Large document', description: 'Original description', blocks: [{ id: 'one', markdown: content }] });
  } finally { await admin().auth.admin.deleteUser(account.id); }
});
