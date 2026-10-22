import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import { admin, apiURL, browserSignIn, latestCode, provisionAccount, publicKey } from './fixtures';

const endpoint = '/api/settings/openai';
const models = ['gpt-5.5-2026-04-23', 'gpt-5.4-mini-2026-03-17'];
const control = () => process.env.TEST_AUTH_CONTROL_URL!;
const origin = () => ({ origin: process.env.TEST_BASE_URL! });

test('write-only settings persist, filter access, explicitly test models, replace and remove without losing work', async ({ page, request }) => {
  const account = await provisionAccount();
  const key = 'sk-synthetic-owner-key';
  try {
    await request.post(`${control()}/control/openai/reset`);
    await browserSignIn(page, account.email);
    const subject = await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Retained work' } });
    expect(subject.ok()).toBe(true);
    await page.getByRole('link', { name: 'AI settings', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'OpenAI settings' })).toBeVisible();
    await expect(page.getByText(/temporarily stored as plaintext/)).toBeVisible();
    await page.getByLabel('OpenAI API key', { exact: true }).fill(key);
    await page.getByRole('button', { name: 'Save key', exact: true }).click();
    await expect(page.getByText('AI settings saved.', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Replace OpenAI API key')).toHaveValue('');
    const status = await page.request.get(endpoint);
    expect(status.headers()['cache-control']).toBe('no-store');
    expect(await status.json()).toEqual({ hasKey: true, model: null });
    const choices = page.getByLabel('Supported OpenAI model');
    expect(await choices.locator('option').allTextContents()).toHaveLength(3);
    expect(await choices.textContent()).not.toContain('unsupported-model');
    for (const model of models) {
      await choices.selectOption(model);
      const saving = page.waitForResponse(response => response.url().endsWith(endpoint) && response.request().method() === 'PUT');
      await page.getByRole('button', { name: 'Save model', exact: true }).click();
      expect((await saving).ok()).toBe(true);
      await page.getByRole('button', { name: 'Test selected model (may incur charge)', exact: true }).click();
      await expect(page.getByText('Selected model completed a text request. OpenAI API charges may apply.', { exact: true })).toBeVisible();
    }
    await page.reload();
    await expect(page.getByRole('status').first()).toContainText(models[1]);
    expect(await page.content()).not.toContain(key);
    expect(await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }))).not.toContain(key);
    const calls = await (await request.get(`${control()}/control/openai/calls`)).json();
    expect(calls.filter((call: { path: string }) => call.path === '/openai/responses')).toEqual(models.map(model => ({ path: '/openai/responses', model, store: false, stream: false, max_output_tokens: 2048 })));
    await page.getByLabel('Replace OpenAI API key').fill('sk-synthetic-limited-key');
    await page.getByRole('button', { name: 'Replace key', exact: true }).click();
    await expect(page.getByText('AI settings saved.', { exact: true })).toBeVisible();
    expect(await choices.locator('option').allTextContents()).toHaveLength(2);
    expect((await page.request.put(endpoint, { headers: origin(), data: { model: models[0] } })).status()).toBe(422);
    expect(await (await page.request.get(endpoint)).json()).toEqual({ hasKey: true, model: models[1] });
    await page.getByRole('button', { name: 'Remove key', exact: true }).click();
    await expect(page.getByText('Key removed. Saved work is unchanged.', { exact: true })).toBeVisible();
    await page.reload();
    expect(await (await page.request.get(endpoint)).json()).toEqual({ hasKey: false, model: null });
    const before = await (await request.get(`${control()}/control/openai/calls`)).json();
    expect((await page.request.post(`${endpoint}/check`, { headers: origin() })).status()).toBe(422);
    expect(await (await request.get(`${control()}/control/openai/calls`)).json()).toEqual(before);
    await page.getByRole('link', { name: 'Back to learning' }).click();
    await expect(page.getByRole('heading', { name: 'Retained work', exact: true })).toBeVisible();
  } finally { await admin().auth.admin.deleteUser(account.id); }
});

test('anonymous, foreign-account and direct public data access cannot read or mutate credentials', async ({ page, request, browser }) => {
  const owner = await provisionAccount();
  const foreign = await provisionAccount();
  const otherBrowserAccount = await provisionAccount();
  const key = 'sk-synthetic-private-key';
  const context = await browser.newContext();
  try {
    for (const method of ['get', 'post', 'put', 'delete'] as const) {
      expect((await request[method](endpoint, { headers: origin(), data: { key } })).status()).toBe(401);
    }
    expect((await request.post(`${endpoint}/check`, { headers: origin() })).status()).toBe(401);
    await browserSignIn(page, owner.email);
    expect((await page.request.put(endpoint, { headers: origin(), data: { key } })).ok()).toBe(true);
    for (const method of ['post', 'put', 'delete'] as const) {
      expect((await page.request[method](endpoint, { headers: { origin: 'https://foreign.invalid' }, data: { key } })).status()).toBe(403);
    }
    expect((await page.request.post(`${endpoint}/check`)).status()).toBe(403);
    const client = createClient(apiURL(), publicKey(), { auth: { persistSession: false, autoRefreshToken: false } });
    await client.auth.signInWithOtp({ email: foreign.email, options: { shouldCreateUser: false } });
    const { code } = await latestCode(request, foreign.email);
    const verified = await client.auth.verifyOtp({ email: foreign.email, token: code, type: 'email' });
    const token = verified.data.session!.access_token;
    const publicHeaders: Record<string, string>[] = [{ apikey: publicKey() }, { apikey: publicKey(), Authorization: `Bearer ${token}` }];
    for (const headers of publicHeaders) {
      for (const table of ['openai_settings', 'learner_accounts']) {
        const response = await request.get(`${apiURL()}/rest/v1/${table}?select=*`, { headers });
        expect(await response.text()).not.toContain(key);
      }
      const privateRead = await request.get(`${apiURL()}/rest/v1/openai_settings?select=*`, { headers: { ...headers, 'Accept-Profile': 'private' } });
      expect(privateRead.ok()).toBe(false);
      for (const [rpc, data] of [
        ['server_openai_read', { owner_id: owner.id }],
        ['server_openai_write', { owner_id: owner.id, secret: 'sk-synthetic-forged-key', selected_model: null }],
        ['server_openai_remove', { owner_id: owner.id }],
      ] as const) {
        const response = await request.post(`${apiURL()}/rest/v1/rpc/${rpc}`, { headers, data });
        expect(response.ok()).toBe(false);
        expect(await response.text()).not.toContain(key);
      }
    }
    const other = await context.newPage();
    await browserSignIn(other, otherBrowserAccount.email);
    expect(await (await other.request.get(`${endpoint}?account_id=${owner.id}`)).json()).toEqual({ hasKey: false, model: null });
    expect((await other.request.put(endpoint, { headers: origin(), data: { key, account_id: owner.id } })).status()).toBe(400);
    await other.request.delete(endpoint, { headers: origin() });
    expect(await (await page.request.get(endpoint)).json()).toEqual({ hasKey: true, model: null });
    const content = await page.request.get('/api/account');
    expect(await content.text()).not.toContain(key);
  } finally {
    await context.close();
    await admin().auth.admin.deleteUser(owner.id);
    await admin().auth.admin.deleteUser(foreign.id);
    await admin().auth.admin.deleteUser(otherBrowserAccount.id);
  }
});

test('provider failures are actionable, sanitised and never silently replace model or saved key', async ({ page, request }) => {
  const account = await provisionAccount();
  const key = 'sk-synthetic-valid-key';
  try {
    await request.post(`${control()}/control/openai/reset`);
    await browserSignIn(page, account.email);
    expect((await page.request.put(endpoint, { headers: origin(), data: { key, model: models[0] } })).ok()).toBe(true);
    for (const [suffix, status, message] of [['invalid', 422, 'rejected'], ['forbidden', 422, 'denied'], ['quota', 429, 'quota']] as const) {
      const rejectedKey = `sk-synthetic-${suffix}-key`;
      const response = await page.request.put(endpoint, { headers: origin(), data: { key: rejectedKey } });
      expect(response.status()).toBe(status);
      const body = await response.text();
      expect(body).toContain(message);
      expect(body).not.toContain(rejectedKey);
      expect(body).not.toContain('unsafe');
      expect(await (await page.request.get(endpoint)).json()).toEqual({ hasKey: true, model: models[0] });
    }
    expect((await page.request.put(endpoint, { headers: origin(), data: { key: 'sk-synthetic-empty-key' } })).status()).toBe(422); // no fallback
    expect((await page.request.put(endpoint, { headers: origin(), data: { model: 'gpt-5.5' } })).status()).toBe(422); // alias not interchangeable
    expect((await page.request.put(endpoint, { headers: origin(), data: { key: 'x'.repeat(3000) } })).status()).toBe(413);
    expect((await page.request.put(endpoint, { headers: origin(), data: 'not json' })).status()).toBe(400);
    for (const [mode, status, message] of [['unavailable', 422, 'unavailable'], ['outage', 502, 'could not complete'], ['incomplete', 422, 'did not complete']] as const) {
      await request.post(`${control()}/control/openai/mode/${mode}`);
      const before = await (await request.get(`${control()}/control/openai/calls`)).json();
      const result = await page.request.post(`${endpoint}/check`, { headers: origin() });
      expect(result.status()).toBe(status);
      const body = await result.text();
      expect(body).toContain(message); expect(body).not.toContain(key); expect(body).not.toContain('unsafe');
      const after = await (await request.get(`${control()}/control/openai/calls`)).json();
      expect(after.length).toBe(before.length + 1); // exactly one attempt, same model
      expect(after.at(-1).model).toBe(models[0]);
    }
    await request.post(`${control()}/control/data/off`);
    expect((await page.request.get(endpoint)).status()).toBe(503);
    await request.post(`${control()}/control/data/on`);
    expect(await (await page.request.get(endpoint)).json()).toEqual({ hasKey: true, model: models[0] });
    await page.request.delete(endpoint, { headers: origin() });
    const empty = await page.request.put(endpoint, { headers: origin(), data: { key: 'sk-synthetic-empty-key' } });
    expect(await empty.json()).toEqual({ hasKey: true, model: null, models: [] });
  } finally {
    await request.post(`${control()}/control/data/on`);
    await request.post(`${control()}/control/openai/reset`);
    await admin().auth.admin.deleteUser(account.id);
  }
});
