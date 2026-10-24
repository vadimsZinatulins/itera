import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

test('credential mutation rejects an array without contacting OpenAI or changing saved settings', async ({ page, request }) => {
  const account = await provisionAccount();
  const endpoint = '/api/settings/openai';
  const control = process.env.TEST_AUTH_CONTROL_URL;
  const key = 'sk-synthetic-mutation-private-key';
  const model = 'gpt-5.5-2026-04-23';

  try {
    expect((await request.post(`${control}/control/openai/reset`)).ok()).toBe(true);
    await browserSignIn(page, account.email);
    const headers = { origin: new URL(page.url()).origin };
    const saved = await page.request.put(endpoint, { headers, data: { key, model } });
    expect(saved.status()).toBe(200);
    expect(await (await page.request.get(endpoint)).json()).toEqual({ hasKey: true, model });
    const before = await (await request.get(`${control}/control/openai/calls`)).json();

    const rejected = await page.request.put(endpoint, { headers, data: [] });

    expect(rejected.status()).toBe(400);
    expect(rejected.headers()['cache-control']).toBe('no-store');
    const body = await rejected.text();
    expect(JSON.parse(body)).toEqual({ error: expect.any(String) });
    expect(body).not.toContain(key);
    expect(body).not.toContain('unsafe');
    expect(await (await page.request.get(endpoint)).json()).toEqual({ hasKey: true, model });
    expect(await (await request.get(`${control}/control/openai/calls`)).json()).toEqual(before);
  } finally {
    await request.post(`${control}/control/openai/reset`);
    await admin().auth.admin.deleteUser(account.id);
  }
});

test('key correction is local and accessible before a write-only replacement is submitted', async ({ page, request }) => {
  const account = await provisionAccount();
  const control = process.env.TEST_AUTH_CONTROL_URL;
  try {
    expect((await request.post(`${control}/control/openai/reset`)).ok()).toBe(true);
    await browserSignIn(page, account.email);
    await page.getByRole('link', { name: 'AI settings', exact: true }).click();
    const key = page.getByLabel('OpenAI API key', { exact: true });
    const submissions: string[] = [];
    page.on('request', request => {
      if (request.url().endsWith('/api/settings/openai') && request.method() === 'PUT') {
        submissions.push(request.postData() ?? '');
      }
    });
    await key.fill('not-an-openai-key');
    await page.getByRole('button', { name: 'Save key', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Enter an OpenAI API key beginning with sk-.' })).toHaveText('Enter an OpenAI API key beginning with sk-.');
    await expect(key).toHaveAttribute('aria-invalid', 'true');
    await expect(key).toBeFocused();
    expect(submissions).toEqual([]);
    expect(await (await request.get(`${control}/control/openai/calls`)).json()).toEqual([]);
    await key.fill('sk-synthetic-corrected-key');
    await page.getByRole('button', { name: 'Save key', exact: true }).click();
    await expect(page.getByText('AI settings saved.', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Replace OpenAI API key')).toHaveValue('');
    expect(await (await page.request.get('/api/settings/openai')).json()).toEqual({ hasKey: true, model: null });
  } finally {
    await request.post(`${control}/control/openai/reset`);
    await admin().auth.admin.deleteUser(account.id);
  }
});

test('credential submissions clear the transient key while pending and after provider, persistence and network failures', async ({ page, request }) => {
  const account = await provisionAccount();
  const endpoint = '/api/settings/openai';
  const control = process.env.TEST_AUTH_CONTROL_URL;
  const model = 'gpt-5.4-mini-2026-03-17';
  let release = () => {};
  try {
    expect((await request.post(`${control}/control/openai/reset`)).ok()).toBe(true);
    await browserSignIn(page, account.email);
    const headers = { origin: new URL(page.url()).origin };
    expect((await page.request.put(endpoint, { headers, data: { key: 'sk-synthetic-original-key', model } })).ok()).toBe(true);
    await page.goto('/settings');
    const key = page.getByLabel('Replace OpenAI API key');
    const hold = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/settings/openai', async route => {
      if (route.request().method() === 'PUT') {
        await hold;
      }
      await route.continue();
    });
    await key.fill('sk-synthetic-invalid-key');
    await page.getByRole('button', { name: 'Replace key', exact: true }).click();
    await expect(key).toHaveValue('');
    await expect(key).toBeDisabled();
    await expect(page.getByText('Updating AI settings…', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove key', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Refresh available models', exact: true })).toBeDisabled();
    release();
    await expect(page.getByText('OpenAI rejected the key. Replace it with a valid API key.', { exact: true })).toBeVisible();
    await expect(key).toBeEnabled();
    await expect(key).toHaveValue('');
    await page.unroute('**/api/settings/openai');
    expect(await (await page.request.get(endpoint)).json()).toEqual({ hasKey: true, model });

    expect((await request.delete(`${control}/control/settings-read-reports`)).ok()).toBe(true);
    expect((await request.post(`${control}/control/settings-read/unavailable`)).ok()).toBe(true);
    await key.fill('sk-synthetic-persistence-private-key');
    await page.getByRole('button', { name: 'Replace key', exact: true }).click();
    await expect(page.getByText('Could not read AI settings. Try again.', { exact: true })).toBeVisible();
    await expect(key).toHaveValue('');
    await expect(key).toBeEnabled();
    await expect.poll(async () => (await (await request.get(`${control}/control/settings-read-reports`)).json())).toEqual([
      "AI credential mutation failed. { stage: 'persistence', kind: 'integration-failure' }",
    ]);
    expect((await request.post(`${control}/control/settings-read/valid`)).ok()).toBe(true);
    expect(await (await page.request.get(endpoint)).json()).toEqual({ hasKey: true, model });

    await page.route('**/api/settings/openai', async route => {
      if (route.request().method() === 'PUT') {
        await route.abort('failed');
        return;
      }
      await route.continue();
    });
    await key.fill('sk-synthetic-network-private-key');
    await page.getByRole('button', { name: 'Replace key', exact: true }).click();
    await expect(page.getByText('Could not reach settings. Check your connection and reload to verify saved state.', { exact: true })).toBeVisible();
    await expect(key).toHaveValue('');
    await expect(key).toBeEnabled();
    await page.unroute('**/api/settings/openai');
    expect(await (await page.request.get(endpoint)).json()).toEqual({ hasKey: true, model });
    expect(await page.content()).not.toContain('sk-synthetic-');
    expect(await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }))).not.toContain('sk-synthetic-');

    await key.fill('sk-synthetic-limited-key');
    await page.getByRole('button', { name: 'Replace key', exact: true }).click();
    await expect(page.getByText('AI settings saved.', { exact: true })).toBeVisible();
    await expect(key).toHaveValue('');
    expect(await (await page.request.get(endpoint)).json()).toEqual({ hasKey: true, model });
    expect(await page.getByLabel('Supported OpenAI model').locator('option').allTextContents()).toHaveLength(2);
  } finally {
    release();
    await request.post(`${control}/control/settings-read/valid`);
    await request.post(`${control}/control/openai/reset`);
    await admin().auth.admin.deleteUser(account.id);
  }
});

test('removal failures retain credentials and explicit retry clears pending key entry without deleting saved work', async ({ page, request }) => {
  const account = await provisionAccount();
  const endpoint = '/api/settings/openai';
  const control = process.env.TEST_AUTH_CONTROL_URL;
  const model = 'gpt-5.5-2026-04-23';
  let release = () => {};
  try {
    expect((await request.post(`${control}/control/openai/reset`)).ok()).toBe(true);
    await browserSignIn(page, account.email);
    const headers = { origin: new URL(page.url()).origin };
    const subjectResponse = await page.request.post('/api/subjects', { headers, data: { name: 'Credential removal retained work' } });
    expect(subjectResponse.ok()).toBe(true);
    const subject = await subjectResponse.json();
    const document = await page.request.post('/api/documents', { headers, data: {
      subjectId: subject.id,
      id: crypto.randomUUID(),
      revision: 0,
      title: 'Retained credential-independent Draft',
      description: '',
      blocks: [{ id: crypto.randomUUID(), markdown: 'Saved learning material survives credential removal.' }],
    } });
    expect(document.ok()).toBe(true);
    expect((await page.request.put(endpoint, { headers, data: { key: 'sk-synthetic-removal-key', model } })).ok()).toBe(true);
    await page.goto('/settings');
    const key = page.getByLabel('Replace OpenAI API key');
    expect((await request.post(`${control}/control/data/off`)).ok()).toBe(true);
    await key.fill('sk-synthetic-unsaved-removal-key');
    const failedRemoval = page.waitForResponse(response => response.url().endsWith(endpoint) && response.request().method() === 'DELETE');
    await page.getByRole('button', { name: 'Remove key', exact: true }).click();
    const failed = await failedRemoval;
    expect(failed.status()).toBe(503);
    expect(await failed.json()).toEqual({ error: 'AI settings are temporarily unavailable. Try again.' });
    await expect(page.getByText('AI settings are temporarily unavailable. Try again.', { exact: true })).toBeVisible();
    await expect(key).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Remove key', exact: true })).toBeEnabled();
    expect((await request.post(`${control}/control/data/on`)).ok()).toBe(true);
    expect(await (await page.request.get(endpoint)).json()).toEqual({ hasKey: true, model });

    const hold = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/settings/openai', async route => {
      if (route.request().method() === 'DELETE') {
        await hold;
      }
      await route.continue();
    });
    const before = await (await request.get(`${control}/control/openai/calls`)).json();
    await key.fill('sk-synthetic-not-submitted-key');
    await page.getByRole('button', { name: 'Remove key', exact: true }).click();
    await expect(key).toHaveValue('');
    await expect(key).toBeDisabled();
    await expect(page.getByText('Updating AI settings…', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove key', exact: true })).toBeDisabled();
    release();
    await expect(page.getByText('Key removed. Saved work is unchanged.', { exact: true })).toBeVisible();
    await page.unroute('**/api/settings/openai');
    await expect(page.getByLabel('OpenAI API key', { exact: true })).toHaveValue('');
    expect(await (await page.request.get(endpoint)).json()).toEqual({ hasKey: false, model: null });
    expect((await page.request.post(`${endpoint}/check`, { headers })).status()).toBe(422);
    expect(await (await request.get(`${control}/control/openai/calls`)).json()).toEqual(before);
    await page.getByRole('link', { name: 'Back to learning', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Credential removal retained work', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Open Retained credential-independent Draft', exact: true }).click();
    await expect(page.getByText('Saved learning material survives credential removal.', { exact: true })).toBeVisible();
  } finally {
    release();
    await request.post(`${control}/control/data/on`);
    await request.post(`${control}/control/openai/reset`);
    await admin().auth.admin.deleteUser(account.id);
  }
});

test('credential transport failures never render private diagnostics or trust malformed success and allow saved-state verification', async ({ page }) => {
  const account = await provisionAccount();
  try {
    await browserSignIn(page, account.email);
    await page.goto('/settings');
    const key = page.getByLabel('OpenAI API key', { exact: true });
    for (const response of [
      { status: 200, body: 'null' },
      { status: 200, body: JSON.stringify({ hasKey: 'unsafe', model: null, models: [] }) },
      { status: 200, body: JSON.stringify({ hasKey: false, model: null, models: [] }) },
      { status: 503, body: JSON.stringify({ error: 'unsafe sk-synthetic-private-diagnostic' }) },
    ]) {
      await page.route('**/api/settings/openai', route => route.fulfill({ ...response, contentType: 'application/json' }));
      await key.fill('sk-synthetic-transport-private-key');
      await page.getByRole('button', { name: 'Save key', exact: true }).click();
      await expect(page.getByText('Could not update AI settings.', { exact: true })).toBeVisible();
      await expect(key).toHaveValue('');
      await expect(key).toBeEnabled();
      expect(await page.content()).not.toContain('unsafe');
      expect(await page.content()).not.toContain('sk-synthetic-');
      await page.unroute('**/api/settings/openai');
      expect(await (await page.request.get('/api/settings/openai')).json()).toEqual({ hasKey: false, model: null });
    }
    await page.reload();
    await expect(page.getByRole('status').first()).toContainText('No OpenAI key saved.');
  } finally {
    await admin().auth.admin.deleteUser(account.id);
  }
});

test('credential request policies retain format, ownership and exact UTF-8 byte limits', async ({ page, request }) => {
  const account = await provisionAccount();
  const endpoint = '/api/settings/openai';
  const control = process.env.TEST_AUTH_CONTROL_URL;
  try {
    expect((await request.post(`${control}/control/openai/reset`)).ok()).toBe(true);
    await browserSignIn(page, account.email);
    const headers = { origin: new URL(page.url()).origin };
    expect((await page.request.put(endpoint, { headers, data: { key: 'sk-12345678' } })).status()).toBe(200);
    const before = await (await request.get(`${control}/control/openai/calls`)).json();
    for (const data of [null, [{}], true, 42, { key: null }, { key: [] }, { key: 'sk-1234567' }, { key: ' sk-12345678' }, { key: `sk-${'a'.repeat(501)}` }, { key: 'sk-synthetic-forged-key', account_id: account.id }]) {
      const response = await page.request.put(endpoint, { headers, data: JSON.stringify(data) });
      expect(response.status()).toBe(400);
      expect(await response.text()).not.toMatch(/sk-(?:synthetic|123|a{8})/);
    }
    expect(await (await request.get(`${control}/control/openai/calls`)).json()).toEqual(before);
    const body = JSON.stringify({ key: `sk-${'a'.repeat(500)}` });
    expect((await page.request.put(endpoint, { headers, data: body.padEnd(2048, ' ') })).status()).toBe(200);
    const atLimit = await (await request.get(`${control}/control/openai/calls`)).json();
    const oversized = await page.request.put(endpoint, { headers, data: body.padEnd(2049, ' ') });
    expect(oversized.status()).toBe(413);
    expect(await oversized.json()).toEqual({ error: 'Request too large.' });
    // A multibyte body is counted in bytes, not JavaScript string length.
    const unicode = JSON.stringify({ key: `sk-${'🧠'.repeat(510)}` });
    expect(unicode.length).toBeLessThan(2048);
    expect((await page.request.put(endpoint, { headers, data: unicode })).status()).toBe(413);
    expect(await (await request.get(`${control}/control/openai/calls`)).json()).toEqual(atLimit);
    expect(await (await page.request.get(endpoint)).json()).toEqual({ hasKey: true, model: null });
  } finally {
    await request.post(`${control}/control/openai/reset`);
    await admin().auth.admin.deleteUser(account.id);
  }
});

test('credential writes reject malformed persistence responses with only safe operational metadata', async ({ page, request }) => {
  const account = await provisionAccount();
  const endpoint = '/api/settings/openai';
  const control = process.env.TEST_AUTH_CONTROL_URL;
  const model = 'gpt-5.5-2026-04-23';
  const malformed = ['null', 'object', 'null-row', 'missing-key', 'missing-model', 'duplicate', 'malformed-model'];
  try {
    expect((await request.post(`${control}/control/openai/reset`)).ok()).toBe(true);
    await browserSignIn(page, account.email);
    const headers = { origin: new URL(page.url()).origin };
    expect((await page.request.put(endpoint, { headers, data: { key: 'sk-synthetic-persisted-key', model } })).ok()).toBe(true);
    const before = await (await request.get(`${control}/control/openai/calls`)).json();
    expect((await request.delete(`${control}/control/settings-read-reports`)).ok()).toBe(true);
    for (const mode of malformed) {
      expect((await request.post(`${control}/control/settings-read/${mode}`)).ok()).toBe(true);
      const response = await page.request.put(endpoint, { headers, data: { key: 'sk-synthetic-replacement-private-key' } });
      expect(response.status(), mode).toBe(503);
      expect(await response.json()).toEqual({ error: 'Could not read AI settings. Try again.' });
    }
    await expect.poll(async () => (await (await request.get(`${control}/control/settings-read-reports`)).json())).toEqual(
      malformed.map(() => "AI credential mutation failed. { stage: 'persistence', kind: 'invalid-response' }"),
    );
    expect(await (await request.get(`${control}/control/openai/calls`)).json()).toEqual(before);
    expect((await request.post(`${control}/control/settings-read/valid`)).ok()).toBe(true);
    expect(await (await page.request.get(endpoint)).json()).toEqual({ hasKey: true, model });
    const saved = await page.request.put(endpoint, { headers, data: { key: 'sk-synthetic-replacement-private-key' } });
    expect(saved.ok()).toBe(true);
    expect(await saved.text()).not.toContain('sk-synthetic-');
  } finally {
    await request.post(`${control}/control/settings-read/valid`);
    await request.post(`${control}/control/openai/reset`);
    await admin().auth.admin.deleteUser(account.id);
  }
});

test('credential replacement reauthenticates at the server and clears submitted key after session loss', async ({ page, request }) => {
  const account = await provisionAccount();
  const endpoint = '/api/settings/openai';
  const control = process.env.TEST_AUTH_CONTROL_URL;
  try {
    expect((await request.post(`${control}/control/openai/reset`)).ok()).toBe(true);
    await browserSignIn(page, account.email);
    const headers = { origin: new URL(page.url()).origin };
    expect((await page.request.put(endpoint, { headers, data: { key: 'sk-synthetic-session-original-key' } })).ok()).toBe(true);
    await page.goto('/settings');
    const key = page.getByLabel('Replace OpenAI API key');
    await key.fill('sk-synthetic-session-private-key');
    const cookies = await page.context().cookies();
    await page.context().clearCookies();
    const before = await (await request.get(`${control}/control/openai/calls`)).json();
    const failedSubmission = page.waitForResponse(response => response.url().endsWith(endpoint) && response.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Replace key', exact: true }).click();
    expect((await failedSubmission).status()).toBe(401);
    await expect(page.getByText('Sign in to manage AI settings.', { exact: true })).toBeVisible();
    await expect(key).toHaveValue('');
    await expect(key).toBeEnabled();
    expect(await (await request.get(`${control}/control/openai/calls`)).json()).toEqual(before);
    // Restore this real session, avoiding an unrelated OTP resend cooldown.
    await page.context().addCookies(cookies);
    expect(await (await page.request.get(endpoint)).json()).toEqual({ hasKey: true, model: null });
  } finally {
    await request.post(`${control}/control/openai/reset`);
    await admin().auth.admin.deleteUser(account.id);
  }
});
