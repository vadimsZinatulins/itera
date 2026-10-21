import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import { admin, apiURL, browserSignIn, latestCode, provisionAccount, publicKey } from './fixtures';

test('public document requests deny anonymous, foreign-account and mismatched Subject writes', async ({ page, request }) => {
  const owner = await provisionAccount();
  const foreign = await provisionAccount();
  const origin = process.env.TEST_BASE_URL!;
  try {
    expect((await request.get('/api/documents?subject=00000000-0000-4000-8000-000000000000')).status()).toBe(401);
    expect((await request.post('/api/documents', { headers: { origin }, data: {} })).status()).toBe(401);
    await browserSignIn(page, owner.email);
    const subject = await (await page.request.post('/api/subjects', { headers: { origin }, data: { name: 'Private' } })).json();
    const other = await (await page.request.post('/api/subjects', { headers: { origin }, data: { name: 'Separate' } })).json();
    const doc = { id: crypto.randomUUID(), subjectId: subject.id, revision: 0, title: 'Private title', description: '', blocks: [{ id: 'one', markdown: 'Secret body' }] };
    expect((await page.request.post('/api/documents', { headers: { origin }, data: doc })).status()).toBe(200);
    expect(await (await page.request.get(`/api/documents?subject=${other.id}`)).json()).toEqual([]);
    expect((await page.request.post('/api/documents', { headers: { origin }, data: { ...doc, subjectId: other.id, revision: 1 } })).status()).toBe(409);
    expect((await page.request.post('/api/documents', { data: doc })).status()).toBe(403);
    const client = createClient(apiURL(), publicKey(), { auth: { persistSession: false, autoRefreshToken: false } });
    await client.auth.signInWithOtp({ email: foreign.email, options: { shouldCreateUser: false } });
    const { code } = await latestCode(request, foreign.email);
    const verified = await client.auth.verifyOtp({ email: foreign.email, token: code, type: 'email' });
    if (!verified.data.session) throw new Error('Synthetic sign-in failed');
    const headers = { apikey: publicKey(), Authorization: `Bearer ${verified.data.session.access_token}` };
    const url = `${apiURL()}/rest/v1/learning_documents`;
    expect([401, 403]).toContain((await request.get(url, { headers: { apikey: publicKey() } })).status());
    expect(await (await request.get(`${url}?id=eq.${doc.id}`, { headers })).json()).toEqual([]);
    for (const method of ['post', 'patch', 'delete'] as const) {
      expect((await request[method](`${url}?id=eq.${doc.id}`, { headers, data: { title: 'Forged' } })).ok()).toBe(false);
    }
    const rpc = `${apiURL()}/rest/v1/rpc/save_learning_document`;
    const params = { p_id: doc.id, p_subject_id: subject.id, p_revision: 1, p_title: 'Forged', p_description: '', p_blocks: [] };
    expect([401, 403]).toContain((await request.post(rpc, { headers, data: params })).status());
    expect((await request.post(rpc, { headers: { apikey: publicKey() }, data: params })).ok()).toBe(false);
    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    await page.waitForTimeout(2100);
    await browserSignIn(page, foreign.email);
    expect((await page.request.get(`/api/documents?subject=${subject.id}`)).status()).toBe(404);
    expect((await page.request.post('/api/documents', { headers: { origin }, data: { ...doc, revision: 1 } })).status()).toBe(403);
    await page.goto(`/?subject=${subject.id}`);
    await expect(page.getByText('Secret body', { exact: true })).toHaveCount(0);
  } finally { await admin().auth.admin.deleteUser(owner.id); await admin().auth.admin.deleteUser(foreign.id); }
});
