import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import { admin, apiURL, browserSignIn, latestCode, provisionAccount, publicKey } from './fixtures';

test('public application and data boundaries enforce Subject ownership and name constraints', async ({ page, request }) => {
  const first = await provisionAccount();
  const second = await provisionAccount();
  const origin = process.env.TEST_BASE_URL!;
  try {
    expect((await request.post('/api/subjects', { headers: { origin }, data: { name: 'Anonymous' } })).status()).toBe(401);
    await browserSignIn(page, first.email);
    expect((await page.request.post('/api/subjects', { data: { name: 'Bad origin' } })).status()).toBe(403);
    for (const name of ['', '  ', '\t\n', 'x'.repeat(81)]) {
      expect((await page.request.post('/api/subjects', { headers: { origin }, data: { name } })).status()).toBe(400);
    }
    const created = await page.request.post('/api/subjects', { headers: { origin }, data: { name: '  Biology  ', account_id: second.id } });
    expect(created.status()).toBe(201);
    const own = await created.json();
    expect(own.name).toBe('Biology');
    const duplicates = await Promise.all([1, 2].map(() => page.request.post('/api/subjects', { headers: { origin }, data: { name: 'BIOLOGY' } })));
    expect(duplicates.map(response => response.status())).toEqual([409, 409]);

    const client = createClient(apiURL(), publicKey(), { auth: { persistSession: false, autoRefreshToken: false } });
    expect((await client.auth.signInWithOtp({ email: second.email, options: { shouldCreateUser: false } })).error).toBeNull();
    const { code } = await latestCode(request, second.email);
    const verified = await client.auth.verifyOtp({ email: second.email, token: code, type: 'email' });
    if (!verified.data.session) throw new Error('Synthetic sign-in failed.');
    const headers = { apikey: publicKey(), Authorization: `Bearer ${verified.data.session.access_token}` };
    const url = `${apiURL()}/rest/v1/subjects`;
    const anonymous = await request.get(`${url}?select=id`, { headers: { apikey: publicKey() } });
    expect([401, 403]).toContain(anonymous.status());
    expect(await (await request.get(`${url}?id=eq.${own.id}&select=id,name`, { headers })).json()).toEqual([]);
    const forged = await request.post(url, { headers, data: { name: 'Stolen', account_id: first.id } });
    expect([401, 403]).toContain(forged.status());
    const collision = await request.post(url, { headers, data: { id: own.id, name: 'Stolen' } });
    expect(collision.ok()).toBe(false);
    for (const method of ['patch', 'delete'] as const) {
      const response = await request[method](`${url}?id=eq.${own.id}`, { headers, data: { name: 'Stolen', account_id: second.id } });
      expect([401, 403]).toContain(response.status());
    }
    for (const name of [' ', '\t\n', 'x'.repeat(81), '\tBiology\t', '\nBIOLOGY\n', '\u00a0Biology\u00a0', '\ufeffBiology\ufeff']) {
      expect((await request.post(url, { headers, data: { name } })).ok()).toBe(false);
    }
    const independent = await request.post(url, { headers, data: { name: 'Biology' } });
    expect(independent.status()).toBe(201); // No global uniqueness.
    await page.goto(`/?subject=${own.id}`);
    await expect(page.getByRole('heading', { name: 'Biology', exact: true })).toBeVisible();
    const foreignRead = await request.get(`${url}?select=id`, { headers });
    const [foreign] = await foreignRead.json();
    await page.goto(`/?subject=${foreign.id}`);
    await expect(page.getByRole('heading', { name: 'Subject unavailable' })).toBeVisible();
    await page.goto(`/?subject=${own.id}`);
    await expect(page.getByRole('heading', { name: 'Biology', exact: true })).toBeVisible();
    expect((await client.auth.signOut({ scope: 'local' })).error).toBeNull();
    expect(await (await request.get(`${url}?select=id`, { headers })).json()).toEqual([]);
    expect((await request.post(url, { headers, data: { name: 'After logout' } })).ok()).toBe(false);
  } finally {
    await admin().auth.admin.deleteUser(first.id);
    await admin().auth.admin.deleteUser(second.id);
  }
});
