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

test('malformed refresh retains attempted Draft and block buffers until a valid saved version can be reviewed', async ({ page }) => {
  const account = await provisionAccount();
  const origin = process.env.TEST_BASE_URL!;
  try {
    await browserSignIn(page, account.email);
    const subject = await (await page.request.post('/api/subjects', {
      headers: { origin }, data: { name: 'Document refresh recovery' },
    })).json();
    expect((await page.request.post('/api/documents', {
      headers: { origin },
      data: {
        subjectId: subject.id, id: crypto.randomUUID(), revision: 0,
        title: 'Saved motion', description: '',
        blocks: [{ id: 'first', markdown: 'Saved velocity' }],
      },
    })).status()).toBe(200);
    await page.goto(`/?subject=${subject.id}`);
    await page.getByRole('button', { name: 'Open Saved motion', exact: true }).click();
    await page.getByLabel('Document title', { exact: true }).fill('Attempted motion');
    await page.route('**/api/documents', route => route.fulfill({ status: 409, json: { error: 'A newer saved document may exist.' } }));
    await page.getByRole('button', { name: 'Save as Draft', exact: true }).click();
    const editor = page.getByRole('region', { name: 'Document editor', exact: true });
    await expect(editor.getByRole('alert')).toContainText('newer');
    await page.getByRole('article', { name: 'Block 1', exact: true }).hover();
    await page.getByRole('button', { name: 'Edit block 1', exact: true }).click();
    await page.getByLabel('Block 1 Markdown').fill('Uncommitted block buffer');
    await page.route('**/api/documents?subject=*', async route => {
      const response = await route.fetch();
      const documents = await response.json();
      await route.fulfill({ response, json: documents.map((document: Record<string, unknown>) => ({ ...document, revision: '1' })) });
    });
    await page.getByRole('button', { name: 'Refresh and review saved version', exact: true }).click();
    await expect(editor.getByRole('alert')).toHaveText('Could not refresh. Your attempted text remains here. Try again.');
    await expect(page.getByText('Latest saved version · your attempted edits remain above', { exact: true })).toHaveCount(0);
    await expect(page.getByLabel('Document title', { exact: true })).toHaveValue('Attempted motion');
    await expect(page.getByLabel('Block 1 Markdown')).toHaveValue('Uncommitted block buffer');
    await page.unroute('**/api/documents?subject=*');
    await page.getByRole('button', { name: 'Refresh and review saved version', exact: true }).click();
    await expect(page.getByText('Latest saved version · your attempted edits remain above', { exact: true })).toBeVisible();
    await expect(page.getByText('Saved velocity', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Document title', { exact: true })).toHaveValue('Attempted motion');
    await expect(page.getByLabel('Block 1 Markdown')).toHaveValue('Uncommitted block buffer');
  } finally {
    await admin().auth.admin.deleteUser(account.id);
  }
});

test('document API rejects malformed persistence reads without exposing private content and recovers', async ({ page, request }) => {
  const account = await provisionAccount();
  const origin = process.env.TEST_BASE_URL!;
  try {
    await browserSignIn(page, account.email);
    const subject = await (await page.request.post('/api/subjects', {
      headers: { origin }, data: { name: 'Persisted document recovery' },
    })).json();
    const documentId = crypto.randomUUID();
    const blocks = [{ id: 'first', markdown: 'Private velocity notes' }];
    expect((await page.request.post('/api/documents', {
      headers: { origin },
      data: { subjectId: subject.id, id: documentId, revision: 0, title: 'Motion', description: '', blocks },
    })).status()).toBe(200);
    // The existing harness captures actual stderr; no production diagnostic endpoint.
    await request.delete(`${process.env.TEST_AUTH_CONTROL_URL}/control/settings-read-reports`);
    // Corrupt only the upstream response after real local authentication, RLS and persistence.
    for (const mode of ['malformed-blocks', 'malformed-practice']) {
      expect((await request.post(`${process.env.TEST_AUTH_CONTROL_URL}/control/documents-read/${mode}`)).status()).toBe(204);
      const response = await page.request.get(`/api/documents?subject=${subject.id}`);
      expect(response.status()).toBe(503);
      expect(response.headers()['cache-control']).toBe('no-store');
      expect(await response.json()).toEqual({ error: 'Could not load documents.' });
    }
    await expect.poll(async () => (await request.get(`${process.env.TEST_AUTH_CONTROL_URL}/control/settings-read-reports`)).json()).toEqual([
      "Learning Documents read failed. { stage: 'persistence', kind: 'invalid-response' }",
      "Learning Documents read failed. { stage: 'persistence', kind: 'invalid-response' }",
    ]);
    await request.post(`${process.env.TEST_AUTH_CONTROL_URL}/control/documents-read/valid`);
    const recovered = await page.request.get(`/api/documents?subject=${subject.id}`);
    expect(recovered.status()).toBe(200);
    expect(await recovered.json()).toEqual([{
      id: documentId, subject_id: subject.id, revision: 1, title: 'Motion', description: '', blocks, practice_version: null,
    }]);
  } finally {
    await request.post(`${process.env.TEST_AUTH_CONTROL_URL}/control/documents-read/valid`);
    await admin().auth.admin.deleteUser(account.id);
  }
});

test('invalid JSON, wrong-shaped document lists and failed reads never masquerade as an empty collection', async ({ page }) => {
  const account = await provisionAccount();
  const origin = process.env.TEST_BASE_URL!;
  try {
    await browserSignIn(page, account.email);
    const subject = await (await page.request.post('/api/subjects', {
      headers: { origin }, data: { name: 'Unavailable document collection' },
    })).json();
    for (const body of ['null', '{}', '[null]', '{invalid', '{"error":"unsafe synthetic diagnostic"}']) {
      await page.route('**/api/documents?subject=*', route => route.fulfill({
        status: body.includes('diagnostic') ? 503 : 200,
        contentType: 'application/json', body,
      }));
      await page.goto(`/?subject=${subject.id}`);
      const workspace = page.getByRole('region', { name: 'Learning Documents', exact: true });
      await expect(workspace.getByRole('alert')).toHaveText('Could not load documents. Reload to try again.');
      await expect(workspace.getByText('No Learning Documents yet.', { exact: false })).toHaveCount(0);
      await expect(page.getByText('unsafe synthetic diagnostic', { exact: false })).toHaveCount(0);
      await page.unroute('**/api/documents?subject=*');
    }
    // Opening and discarding a local Draft must not turn an unavailable list into a successful empty read.
    await page.getByRole('button', { name: 'New Learning Document', exact: true }).click();
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'All Learning Documents', exact: true }).click();
    const workspace = page.getByRole('region', { name: 'Learning Documents', exact: true });
    await expect(workspace.getByRole('alert')).toHaveText('Could not load documents. Reload to try again.');
    await expect(workspace.getByText('No Learning Documents yet.', { exact: false })).toHaveCount(0);
    await page.reload();
    await expect(page.getByText('No Learning Documents yet.', { exact: false })).toBeVisible();
  } finally {
    await admin().auth.admin.deleteUser(account.id);
  }
});

test('document reads preserve safe HTTP contracts through Auth and Data outages and recover explicitly', async ({ page, request }) => {
  const account = await provisionAccount();
  const origin = process.env.TEST_BASE_URL!;
  const control = process.env.TEST_AUTH_CONTROL_URL;
  try {
    await browserSignIn(page, account.email);
    const subject = await (await page.request.post('/api/subjects', {
      headers: { origin }, data: { name: 'Document service outage' },
    })).json();
    const invalid = await page.request.get('/api/documents?subject=not-a-uuid');
    expect(invalid.status()).toBe(400);
    expect(await invalid.json()).toEqual({ error: 'Subject unavailable.' });
    for (const service of ['data', 'auth']) {
      await request.post(`${control}/control/${service}/off`);
      const unavailable = await page.request.get(`/api/documents?subject=${subject.id}`);
      expect(unavailable.status()).toBe(503);
      expect(unavailable.headers()['cache-control']).toBe('no-store');
      expect(await unavailable.json()).toEqual({ error: 'Could not load documents. Try again.' });
      await request.post(`${control}/control/${service}/on`);
      const recovered = await page.request.get(`/api/documents?subject=${subject.id}`);
      expect(recovered.status()).toBe(200);
      expect(await recovered.json()).toEqual([]);
    }
  } finally {
    await request.post(`${control}/control/data/on`);
    await request.post(`${control}/control/auth/on`);
    await admin().auth.admin.deleteUser(account.id);
  }
});
