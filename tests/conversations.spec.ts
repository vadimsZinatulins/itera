import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import { admin, apiURL, browserSignIn, latestCode, provisionAccount, publicKey } from './fixtures';

const origin = () => ({ origin: process.env.TEST_BASE_URL! });
const control = () => process.env.TEST_AUTH_CONTROL_URL!;
const operation = (subject: string, conversation = randomUUID(), text = 'Help me organise my study goals.') => ({ subject, conversation, operation: randomUUID(), text });

test('first message registers a durable thread; reload, separate session and logout preserve identity and ordered history', async ({ page, browser, request }) => {
  const owner = await provisionAccount();
  const context = await browser.newContext();
  try {
    await request.post(`${control()}/control/openai/reset`);
    await browserSignIn(page, owner.email);
    const subject = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Conversation continuity' } })).json();
    const secondSubject = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Separate Subject' } })).json();
    await page.request.put('/api/settings/openai', { headers: origin(), data: { key: 'sk-synthetic-conversation-key', model: 'gpt-5.4-mini-2026-03-17' } });
    // Prove documents are never automatically added to this ticket's context.
    await page.request.post('/api/documents', { headers: origin(), data: { id: randomUUID(), subjectId: subject.id, revision: 0, title: 'EXCLUDED_SYNTHETIC_CONTENT', description: '', blocks: [{ id: 'b', markdown: 'EXCLUDED_SYNTHETIC_CONTENT' }] } });
    await page.goto(`/?subject=${subject.id}`);
    await expect(page.getByText(/source-based practice needs approved/i).first()).toBeVisible();
    await page.getByLabel('Your message', { exact: true }).fill('Help me organise my study goals.');
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(page.getByText('Message and complete reply saved.', { exact: true })).toBeVisible();
    const threads = await (await page.request.get(`/api/conversations?subject=${subject.id}`)).json();
    expect(threads).toHaveLength(1);
    const id = threads[0].id;
    await page.reload();
    await expect(page.getByText('Let’s organise your study goals.', { exact: true })).toBeVisible();
    // Local GoTrue intentionally retains its two-second OTP resend window.
    await page.waitForTimeout(2100);
    const other = await context.newPage(); await browserSignIn(other, owner.email);
    await other.goto(`/?subject=${subject.id}&conversation=${id}`);
    await expect(other.getByText('Let’s organise your study goals.', { exact: true })).toBeVisible();
    await other.getByLabel('Your message', { exact: true }).fill('Make a weekly plan, but do not claim I demonstrated understanding.');
    await other.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(other.getByText('Message and complete reply saved.', { exact: true })).toBeVisible();
    const history = await (await page.request.get(`/api/conversations?subject=${subject.id}&conversation=${id}`)).json();
    expect(history.map((turn: { ordinal: number }) => turn.ordinal)).toEqual([1, 2]);
    expect(history.every((turn: { status: string }) => turn.status === 'complete')).toBe(true);
    const duplicate = await page.request.post('/api/conversations', { headers: origin(), data: { subject: subject.id, conversation: id, operation: history[0].id, text: history[0].user_text } });
    expect(await duplicate.json()).toMatchObject({ duplicate: true, saved: true });
    expect(await (await page.request.get(`/api/conversations?subject=${secondSubject.id}`)).json()).toEqual([]);
    expect((await page.request.get(`/api/conversations?subject=${secondSubject.id}&conversation=${id}`)).status()).toBe(404);
    await page.goto(`/?subject=${secondSubject.id}`);
    await expect(page.getByLabel('Conversation messages')).not.toContainText('Let’s organise');
    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page).toHaveURL(/login/);
    await page.waitForTimeout(2100);
    await browserSignIn(page, owner.email);
    await page.goto(`/?subject=${subject.id}&conversation=${id}`);
    await expect(page.getByText('Let’s organise your study goals.', { exact: true })).toHaveCount(2);
    const calls = await (await request.get(`${control()}/control/openai/calls`)).json();
    const generations = calls.filter((call: { path: string }) => call.path === '/openai/responses');
    expect(generations).toHaveLength(2);
    expect(generations[0]).toMatchObject({ stream: true, store: false, max_output_tokens: 2048, userMessages: 1, assistantMessages: 0, excludedContent: false, noSourcesInstruction: true, hasProviderConversation: false });
    expect(generations[1]).toMatchObject({ userMessages: 2, assistantMessages: 1, excludedContent: false });
    await page.setViewportSize({ width: 320, height: 740 });
    await page.getByRole('button', { name: 'Threads', exact: true }).click();
    await expect(page.getByLabel('Conversation threads')).toBeVisible();
    await page.getByRole('button', { name: 'Chat', exact: true }).click();
    await expect(page.getByLabel('Your message', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const label of ['Conversation threads', 'Conversation messages']) {
      expect(await page.getByLabel(label, { exact: true }).evaluate(element => getComputedStyle(element).overflowY)).toBe('auto');
    }
  } finally { await context.close(); await admin().auth.admin.deleteUser(owner.id); }
});

test('interrupted, incomplete, missing-key and provider failures save outcomes without automatic charged retries; limits reject safely', async ({ page, request }) => {
  const owner = await provisionAccount();
  try {
    await request.post(`${control()}/control/openai/reset`);
    await browserSignIn(page, owner.email);
    const subject = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Bounded failures' } })).json();
    const missing = operation(subject.id);
    const missingReply = await page.request.post('/api/conversations', { headers: origin(), data: missing });
    expect(await missingReply.text()).toContain('Save a key');
    await page.request.put('/api/settings/openai', { headers: origin(), data: { key: 'sk-synthetic-failure-key', model: 'gpt-5.4-mini-2026-03-17' } });
    for (const mode of ['incomplete', 'disconnect', 'outage', 'oversized']) {
      await request.post(`${control()}/control/openai/mode/${mode}`);
      const sent = operation(subject.id);
      const result = await page.request.post('/api/conversations', { headers: origin(), data: sent });
      const body = await result.text();
      expect(body).toContain('"status":"incomplete"'); expect(body).not.toContain('unsafe'); expect(body).not.toContain('sk-synthetic');
      const history = await (await page.request.get(`/api/conversations?subject=${subject.id}&conversation=${sent.conversation}`)).json();
      expect(history).toHaveLength(1); expect(history[0].status).toBe('incomplete');
      if (mode !== 'outage') expect(history[0].assistant_text).toContain('Let’s organise');
      expect(await (await page.request.post('/api/conversations', { headers: origin(), data: sent })).json()).toMatchObject({ duplicate: true });
      expect((await page.request.post('/api/conversations', { headers: origin(), data: { ...sent, text: 'Changed operation content' } })).status()).toBe(400);
    }
    expect((await page.request.post('/api/conversations', { headers: origin(), data: operation(subject.id, randomUUID(), 'é'.repeat(4001)) })).status()).toBe(413);
    expect((await page.request.post('/api/conversations', { headers: origin(), data: operation(subject.id, randomUUID(), 'x'.repeat(13000)) })).status()).toBe(413);
    const calls = await (await request.get(`${control()}/control/openai/calls`)).json();
    expect(calls.filter((call: { path: string }) => call.path === '/openai/responses')).toHaveLength(4);
    await page.goto(`/?subject=${subject.id}&conversation=${missing.conversation}`);
    await expect(page.getByText('Companion · incomplete', { exact: true })).toBeVisible();
    const composer = page.getByLabel('Your message', { exact: true });
    await composer.fill('x'.repeat(8001));
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(page.getByLabel('Conversation status')).toContainText('Message too large');
    await expect(composer).toBeEditable();
    await expect(composer).toHaveValue('x'.repeat(8001));
  } finally { await request.post(`${control()}/control/openai/reset`); await admin().auth.admin.deleteUser(owner.id); }
});

test('public application and data boundaries deny anonymous/foreign access and forged assistant outcomes', async ({ page, request, browser }) => {
  const owner = await provisionAccount(), foreign = await provisionAccount(), dataCaller = await provisionAccount();
  const context = await browser.newContext();
  try {
    expect((await request.get(`/api/conversations?subject=${randomUUID()}`)).status()).toBe(401);
    expect((await request.post('/api/conversations', { headers: origin(), data: operation(randomUUID()) })).status()).toBe(401);
    await browserSignIn(page, owner.email);
    const subject = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Private conversation' } })).json();
    const sent = operation(subject.id, randomUUID(), 'Private owner text.');
    await page.request.post('/api/conversations', { headers: origin(), data: sent });
    const other = await context.newPage(); await browserSignIn(other, foreign.email);
    expect((await other.request.get(`/api/conversations?subject=${subject.id}`)).status()).toBe(404);
    expect((await other.request.post('/api/conversations', { headers: origin(), data: operation(subject.id) })).status()).toBe(403);
    const foreignSubject = await (await other.request.post('/api/subjects', { headers: origin(), data: { name: 'Foreign Subject' } })).json();
    expect((await other.request.post('/api/conversations', { headers: origin(), data: operation(foreignSubject.id, sent.conversation) })).status()).toBe(403);
    expect((await page.request.post('/api/conversations', { headers: { origin: 'https://foreign.invalid' }, data: sent })).status()).toBe(403);
    expect((await page.request.post('/api/conversations', { headers: origin(), data: { ...sent, account_id: foreign.id } })).status()).toBe(400);
    const client = createClient(apiURL(), publicKey(), { auth: { persistSession: false, autoRefreshToken: false } });
    await client.auth.signInWithOtp({ email: dataCaller.email, options: { shouldCreateUser: false } });
    const { code } = await latestCode(request, dataCaller.email);
    const verified = await client.auth.verifyOtp({ email: dataCaller.email, token: code, type: 'email' });
    const publicHeaders: Record<string, string>[] = [{ apikey: publicKey() }, { apikey: publicKey(), Authorization: `Bearer ${verified.data.session!.access_token}` }];
    for (const headers of publicHeaders) {
      for (const table of ['conversations', 'conversation_turns']) {
        const read = await request.get(`${apiURL()}/rest/v1/${table}?select=*`, { headers });
        expect(await read.text()).not.toContain('Private owner');
        expect((await request.post(`${apiURL()}/rest/v1/${table}`, { headers, data: { id: randomUUID(), account_id: owner.id } })).ok()).toBe(false);
      }
      expect((await request.post(`${apiURL()}/rest/v1/rpc/server_practice_context`, { headers, data: { p_owner: owner.id, p_subject: subject.id, p_operation: sent.operation } })).ok()).toBe(false);
      expect((await request.post(`${apiURL()}/rest/v1/rpc/server_conversation_reply`, { headers, data: { p_owner: owner.id, p_subject: subject.id, p_conversation: sent.conversation, p_operation: sent.operation, p_text: 'Forged completion', p_complete: true, p_final: true } })).ok()).toBe(false);
      expect((await request.post(`${apiURL()}/rest/v1/rpc/send_conversation_message`, { headers, data: { p_subject: subject.id, p_conversation: sent.conversation, p_operation: randomUUID(), p_text: 'Foreign injection' } })).ok()).toBe(false);
    }
  } finally { await context.close(); await admin().auth.admin.deleteUser(owner.id); await admin().auth.admin.deleteUser(foreign.id); await admin().auth.admin.deleteUser(dataCaller.id); }
});
