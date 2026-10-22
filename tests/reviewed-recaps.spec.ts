import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import { admin, apiURL, browserSignIn, latestCode, provisionAccount, publicKey } from './fixtures';

const headers = () => ({ origin: process.env.TEST_BASE_URL! });
test('inline recap correction, acceptance, dismissal, incremental coverage and reviewed-only practice context', async ({ page, browser, request }) => {
  const owner = await provisionAccount(), foreign = await provisionAccount();
  const otherContext = await browser.newContext();
  try {
    await request.post(`${process.env.TEST_AUTH_CONTROL_URL}/control/openai/reset`);
    expect((await request.post('/api/recaps', { headers: headers(), data: {} })).status()).toBe(401);
    await browserSignIn(page, owner.email);
    const other = await otherContext.newPage(); await browserSignIn(other, foreign.email);
    const subject = (await (await page.request.post('/api/subjects', { headers: headers(), data: { name: 'Recaps' } })).json()).id;
    const document = randomUUID();
    await page.request.post('/api/documents', { headers: headers(), data: { id: document, subjectId: subject, revision: 0, title: 'Motion', description: '', blocks: [{ id: 'b', markdown: 'Velocity is displacement over time.' }] } });
    await page.request.post('/api/documents/approve', { headers: headers(), data: { id: document, subjectId: subject, revision: 1 } });
    await page.request.put('/api/settings/openai', { headers: headers(), data: { key: 'sk-synthetic-recap-key', model: 'gpt-5.4-mini-2026-03-17' } });
    const conversation = randomUUID();
    const send = async (thread = conversation) => {
      const response = await page.request.post('/api/conversations', { headers: headers(), data: { subject, conversation: thread, operation: randomUUID(), text: 'Hard question please, with a hint.', practice: true } });
      expect(await response.text()).toContain('"status":"complete"');
    };
    const generate = async () => {
      const operation = randomUUID();
      const response = await page.request.post('/api/recaps', { headers: headers(), data: { subject, conversation, operation, action: 'generate' } });
      expect(response.ok()).toBe(true); return operation;
    };
    const review = (operation: string, action: string, observation?: unknown) => page.request.post('/api/recaps', { headers: headers(), data: { subject, operation, action, ...(observation ? { observation } : {}) } });
    const state = async () => (await (await page.request.get(`/api/recaps?subject=${subject}&conversation=${conversation}`)).json());
    await request.post(`${process.env.TEST_AUTH_CONTROL_URL}/control/openai/mode/checkpoint`);
    await send();
    await request.post(`${process.env.TEST_AUTH_CONTROL_URL}/control/openai/mode/completed`);
    await page.goto(`/?subject=${subject}&conversation=${conversation}`);
    await expect(page.getByText('A meaningful activity checkpoint was reached. You can review a recap or keep talking.', { exact: true })).toBeVisible();
    // Offering is free; generation still requires an explicit learner request.
    const offeredCalls = await (await request.get(`${process.env.TEST_AUTH_CONTROL_URL}/control/openai/calls`)).json();
    expect(offeredCalls.filter((c: { path: string }) => c.path === '/openai/responses')).toHaveLength(1);
    const dismissed = await generate();
    expect((await other.request.post('/api/recaps', { headers: headers(), data: { subject, conversation, operation: randomUUID(), action: 'generate' } })).status()).toBe(403);
    expect((await other.request.post('/api/recaps', { headers: headers(), data: { subject, operation: dismissed, action: 'accepted' } })).status()).toBe(403);
    expect((await other.request.get(`/api/recaps?subject=${subject}&conversation=${conversation}`)).status()).toBe(404);
    expect((await review(dismissed, 'dismissed')).ok()).toBe(true);
    expect((await state()).observations).toHaveLength(0);
    const first = await generate(); const stale = await generate();
    await send(randomUUID()); // Tentative proposals must not leave as understanding.
    let calls = await (await request.get(`${process.env.TEST_AUTH_CONTROL_URL}/control/openai/calls`)).json();
    expect(calls.filter((c: { stream: boolean }) => c.stream).at(-1)).toMatchObject({ unreviewedContext: false, reviewedContext: false });
    await page.goto(`/?subject=${subject}&conversation=${conversation}`);
    const card = page.getByRole('article', { name: 'Recap activity 1–1' }).filter({ has: page.getByRole('button', { name: 'Accept recap', exact: true }) }).first();
    await card.getByLabel('Recap text').fill('REVIEWED_SYNTHETIC_OBSERVATION: learner corrected reasoning; still provisional.');
    await card.getByRole('button', { name: 'Save corrected recap' }).click();
    await expect(page.getByText('Reviewed observation saved. Newer discussion remains tentative.', { exact: true })).toBeVisible();
    const saved = await state(); expect(saved.observations).toHaveLength(1); expect(saved.through).toBe(1);
    const staleCard = page.getByRole('article', { name: 'Recap activity 1–1' }).filter({ has: page.getByRole('button', { name: 'Accept recap', exact: true }) });
    await staleCard.getByLabel('Recap text').fill('My stale correction must remain editable.');
    await staleCard.getByRole('button', { name: 'Save corrected recap' }).click();
    await expect(page.getByText(/Understanding changed. Your proposed text is preserved/)).toBeVisible();
    await expect(staleCard.getByLabel('Recap text')).toHaveValue('My stale correction must remain editable.');
    const corrected = saved.observations[0].observation;
    expect((await review(first, 'corrected', corrected)).ok()).toBe(true);
    expect((await state()).observations).toHaveLength(1);
    expect((await review(stale, 'accepted')).status()).toBe(409);
    expect((await state()).recaps.find((r: { id: string }) => r.id === stale).proposal.text).toContain('TENTATIVE_SYNTHETIC');
    await page.reload();
    await page.getByText('Reviewed observations · 1', { exact: true }).click();
    await expect(page.getByText(`Observation: ${corrected.text}`, { exact: true })).toBeVisible();
    await send();
    const next = await generate();
    expect((await state()).recaps.find((r: { id: string }) => r.id === next)).toMatchObject({ coverage_from: 2, coverage_to: 2 });
    expect((await review(next, 'accepted')).ok()).toBe(true);
    expect((await review(next, 'accepted')).ok()).toBe(true);
    expect((await state()).observations).toHaveLength(2);
    await send(); // Conversation is still continuable; new discussion is tentative.
    expect((await state()).through).toBe(2);
    calls = await (await request.get(`${process.env.TEST_AUTH_CONTROL_URL}/control/openai/calls`)).json();
    expect(calls.filter((c: { stream: boolean }) => c.stream).at(-1)).toMatchObject({ reviewedContext: true });
    // Replaying generation does not incur a second AI request.
    const count = calls.length;
    expect((await page.request.post('/api/recaps', { headers: headers(), data: { subject, conversation, operation: next, action: 'generate' } })).ok()).toBe(true);
    expect((await (await request.get(`${process.env.TEST_AUTH_CONTROL_URL}/control/openai/calls`)).json()).length).toBe(count);
    await page.waitForTimeout(2100);
    const client = createClient(apiURL(), publicKey(), { auth: { persistSession: false, autoRefreshToken: false } });
    for (const account of [owner, foreign]) {
      await client.auth.signInWithOtp({ email: account.email, options: { shouldCreateUser: false } });
      const { code } = await latestCode(request, account.email);
      const verified = await client.auth.verifyOtp({ email: account.email, token: code, type: 'email' });
      const tokenHeaders = { apikey: publicKey(), Authorization: `Bearer ${verified.data.session!.access_token}` };
      for (const table of ['practice_recaps', 'reviewed_observations', 'subject_understanding']) {
        const url = `${apiURL()}/rest/v1/${table}?subject_id=eq.${subject}`;
        const rows = await (await request.get(url, { headers: tokenHeaders })).json();
        expect(Array.isArray(rows)).toBe(true);
        expect(rows.length > 0).toBe(account === owner);
        expect((await request.patch(url, { headers: tokenHeaders, data: { account_id: foreign.id } })).ok()).toBe(false);
      }
      expect((await request.post(`${apiURL()}/rest/v1/rpc/server_complete_recap`, { headers: tokenHeaders, data: { p_owner: owner.id, p_operation: stale, p_proposal: corrected } })).ok()).toBe(false);
      if (account === foreign) expect((await request.post(`${apiURL()}/rest/v1/rpc/review_practice_recap`, { headers: tokenHeaders, data: { p_subject: subject, p_operation: stale, p_action: 'accepted' } })).ok()).toBe(false);
    }
  } finally { await otherContext.close(); await admin().auth.admin.deleteUser(owner.id); await admin().auth.admin.deleteUser(foreign.id); }
});
