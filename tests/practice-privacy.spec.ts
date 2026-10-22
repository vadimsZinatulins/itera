import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import { admin, apiURL, browserSignIn, latestCode, provisionAccount, publicKey } from './fixtures';

test('approval and snapshots deny anonymous, foreign-account, mismatched Subject and direct-write requests', async ({ page, request }) => {
  const owner = await provisionAccount();
  const foreign = await provisionAccount();
  const headers = { origin: process.env.TEST_BASE_URL! };
  try {
    expect((await request.post('/api/documents/approve', { headers, data: {} })).status()).toBe(401);
    await browserSignIn(page, owner.email);
    const subject = await (await page.request.post('/api/subjects', { headers, data: { name: 'Private' } })).json();
    const separate = await (await page.request.post('/api/subjects', { headers, data: { name: 'Separate' } })).json();
    const input = { id: crypto.randomUUID(), subjectId: subject.id, revision: 0, title: 'Private title', description: 'Private description', blocks: [{ id: 'one', markdown: 'Private content' }] };
    await page.request.post('/api/documents', { headers, data: input });
    const approval = { id: input.id, subjectId: subject.id, revision: 1 };
    expect((await page.request.post('/api/documents/approve', { headers, data: { ...approval, subjectId: separate.id } })).status()).toBe(403);
    expect((await page.request.post('/api/documents/approve', { headers, data: approval })).status()).toBe(200);
    // Exercise the exposed data boundary, not just application-route checks.
    const client = createClient(apiURL(), publicKey(), { auth: { persistSession: false, autoRefreshToken: false } });
    const rpc = `${apiURL()}/rest/v1/rpc/approve_learning_document`;
    const params = { p_id: input.id, p_subject_id: subject.id, p_revision: 1 };
    expect((await request.post(rpc, { headers: { apikey: publicKey() }, data: params })).ok()).toBe(false);
    await page.waitForTimeout(2100);
    for (const account of [owner, foreign]) {
      await client.auth.signInWithOtp({ email: account.email, options: { shouldCreateUser: false } });
      const { code } = await latestCode(request, account.email);
      const verified = await client.auth.verifyOtp({ email: account.email, token: code, type: 'email' });
      if (!verified.data.session) throw new Error('Synthetic sign-in failed');
      const tokenHeaders = { apikey: publicKey(), Authorization: `Bearer ${verified.data.session.access_token}` };
      const url = `${apiURL()}/rest/v1/learning_documents?id=eq.${input.id}`;
      expect((await request.patch(url, { headers: tokenHeaders, data: { practice_version: { title: 'Forged' } } })).ok()).toBe(false);
      if (account === foreign) {
        expect(await (await request.get(url, { headers: tokenHeaders })).json()).toEqual([]);
        expect([401, 403]).toContain((await request.post(rpc, { headers: tokenHeaders, data: params })).status());
      } else {
        // An authenticated owner can use the RPC, but cannot approve an unsaved payload.
        const result = await request.post(rpc, { headers: tokenHeaders, data: params });
        expect(result.status()).toBe(200);
        expect((await result.json()).practice_version.title).toBe('Private title');
      }
    }
    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    await page.waitForTimeout(2100);
    await browserSignIn(page, foreign.email);
    expect((await page.request.post('/api/documents/approve', { headers, data: approval })).status()).toBe(403);
    const foreignSubject = await (await page.request.post('/api/subjects', { headers, data: { name: 'Foreign' } })).json();
    expect((await page.request.post('/api/documents/approve', { headers, data: { ...approval, subjectId: foreignSubject.id } })).status()).toBe(403);
    expect((await page.request.get(`/api/documents?subject=${subject.id}`)).status()).toBe(404);
    expect(await (await page.request.get(`/api/documents?subject=${foreignSubject.id}`)).json()).toEqual([]);
  } finally { await admin().auth.admin.deleteUser(owner.id); await admin().auth.admin.deleteUser(foreign.id); }
});
