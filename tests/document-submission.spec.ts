import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import { admin, apiURL, browserSignIn, latestCode, provisionAccount, publicKey } from './fixtures';

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

test('an invalid save response retains proposed text and the last confirmed saved snapshot for review', async ({ page }) => {
  const account = await provisionAccount();
  const headers = { origin: process.env.TEST_BASE_URL! };
  try {
    await browserSignIn(page, account.email);
    const subject = await (await page.request.post('/api/subjects', {
      headers, data: { name: 'Unconfirmed Draft save' },
    })).json();
    const input = {
      id: crypto.randomUUID(), subjectId: subject.id, revision: 0,
      title: 'Confirmed title', description: 'Confirmed description',
      blocks: [{ id: 'first.block', markdown: 'Confirmed block' }],
    };
    expect((await page.request.post('/api/documents', { headers, data: input })).status()).toBe(200);
    await page.goto(`/?subject=${subject.id}`);
    await page.getByRole('button', { name: 'Open Confirmed title', exact: true }).click();
    await page.getByLabel('Document title', { exact: true }).fill('Proposed title');
    await page.getByRole('article', { name: 'Block 1', exact: true }).hover();
    await page.getByRole('button', { name: 'Edit block 1', exact: true }).click();
    await page.getByLabel('Block 1 Markdown').fill('Proposed block');
    await page.getByRole('button', { name: 'Save block', exact: true }).click();
    // Persist through real auth/RLS, corrupt only the transport response.
    await page.route('**/api/documents', async route => {
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      const saved = await response.json();
      await route.fulfill({ response, json: { ...saved, revision: '2' } });
    });
    await page.getByRole('button', { name: 'Save as Draft', exact: true }).click();
    const editor = page.getByRole('region', { name: 'Document editor', exact: true });
    await expect(editor.getByRole('alert')).toContainText('Save');
    await expect(editor.getByRole('status')).toContainText('unsaved local edits retained');
    await expect(page.getByLabel('Document title', { exact: true })).toHaveValue('Proposed title');
    await expect(page.getByRole('article', { name: 'Block 1', exact: true })).toContainText('Proposed block');
    await expect(page.getByRole('button', { name: 'Ready to Practice', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Final Markdown', exact: true }).click();
    await expect(page.getByRole('dialog').locator('pre')).toHaveText('# Confirmed title\n\nConfirmed description\n\nConfirmed block\n');
    await page.keyboard.press('Escape');
    await page.unroute('**/api/documents');
    await page.getByRole('button', { name: 'Refresh and review saved version', exact: true }).click();
    await expect(page.getByText('Latest saved version · your attempted edits remain above', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Document title', { exact: true })).toHaveValue('Proposed title');
    const persisted = await page.request.get(`/api/documents?subject=${subject.id}`);
    expect(persisted.status()).toBe(200);
    expect(await persisted.json()).toEqual([{
      id: input.id, subject_id: subject.id, revision: 2, title: 'Proposed title',
      description: 'Confirmed description', blocks: [{ id: 'first.block', markdown: 'Proposed block' }],
      practice_version: null,
    }]);
  } finally {
    await admin().auth.admin.deleteUser(account.id);
  }
});

test('Draft POST preserves nested field policy, malformed-input rejection and exact Unicode and JSONB limits', async ({ page }) => {
  const account = await provisionAccount();
  const headers = { origin: process.env.TEST_BASE_URL! };
  try {
    await browserSignIn(page, account.email);
    const subject = await (await page.request.post('/api/subjects', {
      headers, data: { name: 'Draft boundaries' },
    })).json();
    const input = {
      id: crypto.randomUUID(), subjectId: subject.id, revision: 0,
      title: '', description: '', blocks: [{ id: 'manual.block id', markdown: '' }],
    };
    for (const value of [null, [], {}, { ...input, revision: -1 }, { ...input, revision: 0.5 },
      { ...input, blocks: [null] }, { ...input, blocks: [{ id: 'one', markdown: 42 }] },
      { ...input, blocks: [{ id: '', markdown: '' }] },
      { ...input, blocks: [{ id: 'x'.repeat(81), markdown: '' }] },
      { ...input, blocks: [{ id: 'same', markdown: 'First' }, { id: 'same', markdown: 'Second' }] },
      { ...input, blocks: Array.from({ length: 201 }, (_, index) => ({ id: String(index), markdown: '' })) },
      { ...input, title: '🧠'.repeat(301) }, { ...input, description: '🧠'.repeat(5001) },
    ]) {
      const rejected = await page.request.post('/api/documents', { headers, data: JSON.stringify(value) });
      expect(rejected.status()).toBe(400);
      expect(rejected.headers()['cache-control']).toBe('no-store');
    }
    expect((await page.request.post('/api/documents', { headers, data: '{' })).status()).toBe(400);
    const acceptedBlocks = [{ id: '🧠'.repeat(80), markdown: '', extra: { retained: true } }];
    const accepted = await page.request.post('/api/documents', {
      headers, data: { ...input, id: input.id.toUpperCase(), subjectId: subject.id.toUpperCase(), title: '🧠'.repeat(300), description: '🧠'.repeat(5000), blocks: acceptedBlocks, account_id: crypto.randomUUID(), ignored: true },
    });
    expect(accepted.status()).toBe(200);
    expect(await accepted.json()).toMatchObject({ id: input.id, subject_id: subject.id, account_id: account.id, revision: 1, blocks: acceptedBlocks, practice_version: null });
    const emptyTitle = await page.request.post('/api/documents', { headers, data: { ...input, id: crypto.randomUUID() } });
    expect(emptyTitle.status()).toBe(200);
    expect(await emptyTitle.json()).toMatchObject({ title: '', blocks: input.blocks });
    const twoHundred = await page.request.post('/api/documents', {
      headers, data: { ...input, id: crypto.randomUUID(), blocks: Array.from({ length: 200 }, (_, index) => ({ id: String(index), markdown: '' })) },
    });
    expect(twoHundred.status()).toBe(200);
    // PostgreSQL JSONB text adds exactly 31 ASCII bytes around this block's Markdown.
    // 124992 four-byte characters + one ASCII byte + 31 = 500000 bytes.
    const markdown = `${'🧠'.repeat(124992)}a`;
    const large = { ...input, id: crypto.randomUUID(), blocks: [{ id: 'one', markdown }] };
    expect((await page.request.post('/api/documents', { headers, data: large })).status()).toBe(200);
    const oversized = await page.request.post('/api/documents', {
      headers, data: { ...large, revision: 1, blocks: [{ id: 'one', markdown: `${markdown}a` }] },
    });
    expect(oversized.status()).toBe(400);
    const persisted = await page.request.get(`/api/documents?subject=${subject.id}`);
    expect(persisted.status()).toBe(200);
    expect((await persisted.json()).find((document: { id: string }) => document.id === large.id)).toMatchObject({ revision: 1, blocks: large.blocks });
  } finally {
    await admin().auth.admin.deleteUser(account.id);
  }
});

test('Draft request limit counts 600000 UTF-16 units while ignoring extra envelope fields', async ({ page }) => {
  const account = await provisionAccount();
  const headers = { origin: process.env.TEST_BASE_URL!, 'Content-Type': 'application/json' };
  try {
    await browserSignIn(page, account.email);
    const subject = await (await page.request.post('/api/subjects', { headers, data: { name: 'Draft request units' } })).json();
    const input = { id: crypto.randomUUID(), subjectId: subject.id, revision: 0, title: '', description: '', blocks: [], padding: '' };
    const overhead = JSON.stringify(input).length;
    const exact = JSON.stringify({ ...input, padding: 'é'.repeat(600000 - overhead) });
    expect(exact.length).toBe(600000);
    expect(Buffer.byteLength(exact, 'utf8')).toBeGreaterThan(600000);
    const saved = await page.request.post('/api/documents', { headers, data: exact });
    expect(saved.status()).toBe(200);
    expect(await saved.json()).toMatchObject({ id: input.id, revision: 1, blocks: [] });
    const rejected = await page.request.post('/api/documents', { headers, data: `${exact} ` });
    expect(rejected.status()).toBe(413);
    expect(await rejected.json()).toEqual({ error: 'Draft too large.' });
  } finally {
    await admin().auth.admin.deleteUser(account.id);
  }
});

test('Draft save failures stay safe and retain fields through real service outages and explicit recovery', async ({ page, request }) => {
  const account = await provisionAccount();
  const headers = { origin: process.env.TEST_BASE_URL! };
  const control = process.env.TEST_AUTH_CONTROL_URL;
  try {
    await browserSignIn(page, account.email);
    const subject = await (await page.request.post('/api/subjects', { headers, data: { name: 'Draft save outage' } })).json();
    await page.goto(`/?subject=${subject.id}`);
    await page.getByRole('button', { name: 'New Learning Document', exact: true }).click();
    await page.getByLabel('Document title', { exact: true }).fill('Keep my Draft');
    await page.getByLabel('Document description', { exact: true }).fill('Private proposed description');
    await page.getByRole('button', { name: 'Add Markdown block', exact: true }).click();
    await page.getByLabel('Block 1 Markdown').fill('Private proposed block');
    await page.getByRole('button', { name: 'Save block', exact: true }).click();
    const editor = page.getByRole('region', { name: 'Document editor', exact: true });
    for (const service of ['data', 'auth']) {
      expect((await request.post(`${control}/control/${service}/off`)).status()).toBe(204);
      const saving = page.waitForResponse(response => response.url().endsWith('/api/documents') && response.request().method() === 'POST');
      await page.getByRole('button', { name: 'Save as Draft', exact: true }).click();
      const failure = await saving;
      expect(failure.status()).toBe(503);
      expect(failure.headers()['cache-control']).toBe('no-store');
      expect(await failure.json()).toEqual({ error: 'Save failed. Check your connection; your edits remain here.' });
      await expect(editor.getByRole('status')).toContainText('unsaved local edits retained');
      await expect(page.getByLabel('Document title', { exact: true })).toHaveValue('Keep my Draft');
      await expect(page.getByLabel('Document description', { exact: true })).toHaveValue('Private proposed description');
      await expect(page.getByRole('article', { name: 'Block 1', exact: true })).toContainText('Private proposed block');
      expect((await request.post(`${control}/control/${service}/on`)).status()).toBe(204);
    }
    for (const body of ['{"error":"unsafe synthetic private diagnostic"}', 'null', '{']) {
      await page.route('**/api/documents', route => route.fulfill({ status: 503, contentType: 'application/json', body }));
      await page.getByRole('button', { name: 'Save as Draft', exact: true }).click();
      await expect(editor.getByRole('alert')).toContainText('Save failed.');
      await expect(editor).not.toContainText('unsafe synthetic private diagnostic');
      await expect(page.getByLabel('Document title', { exact: true })).toHaveValue('Keep my Draft');
      await page.unroute('**/api/documents');
    }
    const beforeRetry = await page.request.get(`/api/documents?subject=${subject.id}`);
    expect(beforeRetry.status()).toBe(200);
    expect(await beforeRetry.json()).toEqual([]);
    await page.getByRole('button', { name: 'Save as Draft', exact: true }).click();
    await expect(editor.getByRole('status')).toContainText('Saved on server');
    const saved = await page.request.get(`/api/documents?subject=${subject.id}`);
    expect(saved.status()).toBe(200);
    expect(await saved.json()).toEqual([{
      id: expect.any(String), subject_id: subject.id, revision: 1, title: 'Keep my Draft',
      description: 'Private proposed description', blocks: [{ id: expect.any(String), markdown: 'Private proposed block' }],
      practice_version: null,
    }]);
  } finally {
    await request.post(`${control}/control/data/on`);
    await request.post(`${control}/control/auth/on`);
    await admin().auth.admin.deleteUser(account.id);
  }
});

test('direct authenticated Draft RPC still independently rejects malformed and duplicate blocks', async ({ page, request }) => {
  const account = await provisionAccount();
  const origin = process.env.TEST_BASE_URL!;
  try {
    await browserSignIn(page, account.email);
    const subject = await (await page.request.post('/api/subjects', { headers: { origin }, data: { name: 'Independent SQL validation' } })).json();
    await page.waitForTimeout(2100);
    const client = createClient(apiURL(), publicKey(), { auth: { persistSession: false, autoRefreshToken: false } });
    const requested = await client.auth.signInWithOtp({ email: account.email, options: { shouldCreateUser: false } });
    expect(requested.error).toBeNull();
    const { code } = await latestCode(request, account.email);
    const verified = await client.auth.verifyOtp({ email: account.email, token: code, type: 'email' });
    expect(verified.error).toBeNull();
    if (!verified.data.session) {
      throw new Error('Synthetic sign-in failed');
    }
    const headers = { apikey: publicKey(), Authorization: `Bearer ${verified.data.session.access_token}` };
    const rpc = `${apiURL()}/rest/v1/rpc/save_learning_document`;
    const params = {
      p_id: crypto.randomUUID(), p_subject_id: subject.id, p_revision: 0,
      p_title: '', p_description: '', p_blocks: [{ id: 'manual.block', markdown: 'Independent saved block' }],
    };
    expect((await request.post(rpc, { headers, data: params })).status()).toBe(200);
    for (const blocks of [[null], [{ id: 'one', markdown: 42 }], [{ id: 'same', markdown: 'First' }, { id: 'same', markdown: 'Second' }]]) {
      const rejected = await request.post(rpc, { headers, data: { ...params, p_revision: 1, p_blocks: blocks } });
      expect(rejected.status()).toBe(400);
      expect(await rejected.json()).toMatchObject({ code: '22023' });
    }
    const persisted = await page.request.get(`/api/documents?subject=${subject.id}`);
    expect(persisted.status()).toBe(200);
    expect(await persisted.json()).toEqual([{
      id: params.p_id, subject_id: subject.id, revision: 1, title: '', description: '', blocks: params.p_blocks, practice_version: null,
    }]);
  } finally {
    await admin().auth.admin.deleteUser(account.id);
  }
});
