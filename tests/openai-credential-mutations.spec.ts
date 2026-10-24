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
