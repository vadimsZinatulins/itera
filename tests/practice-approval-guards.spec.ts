import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

test('failed saves and stale approval never publish unconfirmed edits and retain text for review', async ({ page }) => {
  const account = await provisionAccount();
  const headers = { origin: process.env.TEST_BASE_URL! };
  try {
    await browserSignIn(page, account.email);
    const subject = await (await page.request.post('/api/subjects', { headers, data: { name: 'Conflicts' } })).json();
    const input = { id: crypto.randomUUID(), subjectId: subject.id, revision: 0, title: 'Reviewed title', description: '', blocks: [{ id: 'one', markdown: 'Reviewed content' }] };
    await page.request.post('/api/documents', { headers, data: input });
    await page.goto(`/?subject=${subject.id}`);
    await page.getByRole('button', { name: 'Open Reviewed title', exact: true }).click();
    await page.getByLabel('Document title', { exact: true }).fill('Attempted title');
    await page.route('**/api/documents', route => route.fulfill({ status: 503, json: { error: 'Save failed.' } }));
    await page.getByRole('button', { name: 'Save as Draft', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Save failed' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ready to Practice', exact: true })).toBeDisabled();
    await expect(page.getByLabel('Document title', { exact: true })).toHaveValue('Attempted title');
    await page.unroute('**/api/documents');
    await page.getByRole('button', { name: 'Discard local edits', exact: true }).click();
    await page.route('**/api/documents/approve', route => route.fulfill({ status: 503, json: { error: 'Approval could not be confirmed.' } }));
    await page.getByRole('button', { name: 'Ready to Practice', exact: true }).click();
    await page.getByRole('button', { name: 'Approve saved version', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'could not be confirmed' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View practice version', exact: true })).toHaveCount(0);
    await page.unroute('**/api/documents/approve');
    await page.getByRole('button', { name: 'Ready to Practice', exact: true }).click();
    // A second session saves after this learner reviews the snapshot but before approval.
    expect((await page.request.post('/api/documents', { headers, data: { ...input, revision: 1, title: 'Newer title', blocks: [{ id: 'one', markdown: 'Newer content' }] } })).status()).toBe(200);
    await page.getByRole('button', { name: 'Approve saved version', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'newer saved document' })).toBeVisible();
    await expect(page.getByLabel('Document title', { exact: true })).toHaveValue('Reviewed title');
    await expect(page.getByRole('article').getByText('Reviewed content', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Refresh and review saved version', exact: true }).click();
    await expect(page.getByText('Newer content', { exact: true })).toBeVisible();
    await expect(page.getByRole('article').getByText('Reviewed content', { exact: true })).toBeVisible();
    const documents = await (await page.request.get(`/api/documents?subject=${subject.id}`)).json();
    expect(documents[0].practice_version).toBeNull();
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Discard attempted edits and use saved version', exact: true }).click();
    await page.getByRole('button', { name: 'Ready to Practice', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('Newer content');
    await page.getByRole('button', { name: 'Approve saved version', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Available for practice');
  } finally { await admin().auth.admin.deleteUser(account.id); }
});

test('approval requires saved substance and races coherently with saves and retries', async ({ page }) => {
  const account = await provisionAccount();
  const headers = { origin: process.env.TEST_BASE_URL! };
  try {
    await browserSignIn(page, account.email);
    const subject = await (await page.request.post('/api/subjects', { headers, data: { name: 'Race' } })).json();
    const input = { id: crypto.randomUUID(), subjectId: subject.id, revision: 0, title: '  ', description: '', blocks: [{ id: 'one', markdown: 'Content' }] };
    const approve = (revision: number) => page.request.post('/api/documents/approve', { headers, data: { id: input.id, subjectId: subject.id, revision, title: 'Forged title', blocks: [{ id: 'forged', markdown: 'Not saved' }] } });
    expect((await approve(0)).status()).toBe(400);
    await page.request.post('/api/documents', { headers, data: input });
    expect((await approve(1)).status()).toBe(400);
    await page.request.post('/api/documents', { headers, data: { ...input, revision: 1, title: 'Valid', blocks: [{ id: 'one', markdown: '  \n---\n# ** **' }] } });
    expect((await approve(2)).status()).toBe(400);
    await page.request.post('/api/documents', { headers, data: { ...input, revision: 2, title: 'Valid' } });
    const [approval, save] = await Promise.all([
      approve(3),
      page.request.post('/api/documents', { headers, data: { ...input, revision: 3, title: 'New title', blocks: [{ id: 'two', markdown: 'New content' }] } }),
    ]);
    expect(save.status()).toBe(200);
    expect([200, 409]).toContain(approval.status());
    const documents = await (await page.request.get(`/api/documents?subject=${subject.id}`)).json();
    expect(documents[0].title).toBe('New title');
    expect(documents[0].revision).toBe(4);
    expect(documents[0].practice_version).toEqual(approval.status() === 200 ? { revision: 3, title: 'Valid', description: '', blocks: [{ id: 'one', markdown: 'Content' }] } : null);
    const retries = await Promise.all([approve(4), approve(4), approve(4)]);
    for (const response of retries) {
      expect(response.status()).toBe(200);
      expect((await response.json()).practice_version).toEqual({ revision: 4, title: 'New title', description: '', blocks: [{ id: 'two', markdown: 'New content' }] });
    }
    expect((await approve(3)).status()).toBe(409);
    expect((await page.request.post('/api/documents/approve', { data: { id: input.id, subjectId: subject.id, revision: 4 } })).status()).toBe(403);
  } finally { await admin().auth.admin.deleteUser(account.id); }
});
