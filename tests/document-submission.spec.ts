import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

test('Draft title correction retains local blocks and accepts 300 Unicode codepoints without approval', async ({ page }) => {
  const account = await provisionAccount();
  const origin = process.env.TEST_BASE_URL!;
  try {
    await browserSignIn(page, account.email);
    const createdSubject = await page.request.post('/api/subjects', {
      headers: { origin }, data: { name: 'Draft submission correction' },
    });
    expect(createdSubject.status()).toBe(201);
    const subject = await createdSubject.json();
    await page.goto(`/?subject=${subject.id}`);
    await page.getByRole('button', { name: 'New Learning Document', exact: true }).click();
    const title = page.getByLabel('Document title', { exact: true });
    await title.fill('🧠'.repeat(301));
    await page.getByLabel('Document description', { exact: true }).fill('Keep this description during correction.');
    await page.getByRole('button', { name: 'Add Markdown block', exact: true }).click();
    await page.getByLabel('Block 1 Markdown').fill('## Retained idea\n\nLocally saved is not server saved.');
    await page.getByRole('button', { name: 'Save block', exact: true }).click();

    const submissions: string[] = [];
    page.on('request', request => {
      if (request.url().endsWith('/api/documents') && request.method() === 'POST') {
        submissions.push(request.postData() ?? '');
      }
    });
    await page.getByRole('button', { name: 'Save as Draft', exact: true }).click();
    const editor = page.getByRole('region', { name: 'Document editor', exact: true });
    await expect(editor.getByRole('alert')).toContainText('300');
    await expect(title).toHaveAttribute('aria-invalid', 'true');
    await expect(title).toBeFocused();
    expect(submissions).toEqual([]);
    await expect(title).toHaveValue('🧠'.repeat(301));
    await expect(page.getByLabel('Document description', { exact: true })).toHaveValue('Keep this description during correction.');
    await expect(page.getByRole('article', { name: 'Block 1', exact: true })).toContainText('Locally saved is not server saved.');
    const beforeCorrection = await page.request.get(`/api/documents?subject=${subject.id}`);
    expect(beforeCorrection.status()).toBe(200);
    expect(await beforeCorrection.json()).toEqual([]);

    await title.fill('🧠'.repeat(300));
    const saving = page.waitForResponse(response => response.url().endsWith('/api/documents') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Save as Draft', exact: true }).click();
    expect((await saving).status()).toBe(200);
    await expect(editor.getByRole('status')).toContainText('Saved on server');
    expect(submissions).toHaveLength(1);
    const persisted = await page.request.get(`/api/documents?subject=${subject.id}`);
    expect(persisted.status()).toBe(200);
    expect(await persisted.json()).toEqual([{
      id: expect.any(String), subject_id: subject.id, revision: 1,
      title: '🧠'.repeat(300), description: 'Keep this description during correction.',
      blocks: [{ id: expect.any(String), markdown: '## Retained idea\n\nLocally saved is not server saved.' }],
      practice_version: null,
    }]);
    await page.reload();
    await page.getByRole('button', { name: `Open ${'🧠'.repeat(300)}`, exact: true }).click();
    await expect(title).toHaveValue('🧠'.repeat(300));
    await expect(page.getByRole('heading', { name: 'Retained idea', exact: true })).toBeVisible();
  } finally {
    await admin().auth.admin.deleteUser(account.id);
  }
});
