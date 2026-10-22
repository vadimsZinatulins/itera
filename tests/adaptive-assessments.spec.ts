import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { expect, test, type Page, type APIRequestContext } from '@playwright/test';
import { admin, apiURL, browserSignIn, latestCode, provisionAccount, publicKey } from './fixtures';

const headers = () => ({ origin: process.env.TEST_BASE_URL! });
const control = () => process.env.TEST_AUTH_CONTROL_URL!;
async function setup(page: Page, request: APIRequestContext) {
  await request.post(`${control()}/control/openai/reset`);
  const owner = await provisionAccount(); await browserSignIn(page, owner.email);
  const subject = (await (await page.request.post('/api/subjects', { headers: headers(), data: { name: 'Assessment' } })).json()).id;
  const id = randomUUID();
  await page.request.post('/api/documents', { headers: headers(), data: { id, subjectId: subject, revision: 0, title: 'Motion', description: '', blocks: [{ id: 'b', markdown: 'Velocity is displacement over time.' }] } });
  await page.request.post('/api/documents/approve', { headers: headers(), data: { id, subjectId: subject, revision: 1 } });
  await page.request.put('/api/settings/openai', { headers: headers(), data: { key: 'sk-synthetic-assessment-key', model: 'gpt-5.4-mini-2026-03-17' } });
  return { owner, subject, document: id };
}
async function history(page: Page, subject: string, conversation: string) {
  return (await page.request.get(`/api/conversations?subject=${subject}&conversation=${conversation}`)).json();
}
async function send(page: Page, subject: string, conversation: string, text: string, revision?: number) {
  const operation = { subject, conversation, operation: randomUUID(), text, practice: true, ...(revision !== undefined ? { assessmentRevision: revision } : {}) };
  const response = await page.request.post('/api/conversations', { headers: headers(), data: operation });
  expect(response.ok()).toBe(true);
  const output = await response.text(); expect(output).toContain('"status":"complete"');
  const turns = await history(page, subject, conversation);
  return { state: turns.filter((t: { assessment: unknown }) => t.assessment).at(-1).assessment, operation, output };
}

test('quick and ordinary-language assessment share durable adaptive questions, assistance, skip and reviewed recap', async ({ page, browser, request }) => {
  const { owner, subject } = await setup(page, request);
  const second = await browser.newContext();
  try {
    await page.goto(`/?subject=${subject}`);
    await page.getByRole('button', { name: 'Quick assessment', exact: true }).click();
    await expect(page.getByRole('checkbox', { name: /Use approved sources/ })).toBeChecked();
    await page.getByLabel('Your message', { exact: true }).fill('Assess me on motion with hard questions, one at a time.');
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(page.getByText('Message and complete reply saved.', { exact: true })).toBeVisible();
    const conversation = new URL(page.url()).searchParams.get('conversation')!;
    const turns = await history(page, subject, conversation);
    let state = turns.at(-1).assessment;
    expect(state).toMatchObject({ opened: 1, answered: 0, skipped: 0, requested_difficulty: 'hard', current_question: { difficulty: 'hard', status: 'open' } });
    const question = state.current_question.id;
    await page.getByRole('button', { name: 'Hint', exact: true }).click();
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(page.getByText('Message and complete reply saved.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Explain question', exact: true }).click();
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(page.getByText('Message and complete reply saved.', { exact: true })).toBeVisible();
    state = (await history(page, subject, conversation)).at(-1).assessment;
    expect(state.current_question.id).toBe(question);
    expect(state.current_question.assistance).toEqual(['hint','explanation']);
    expect(state.answered).toBe(0);
    await page.getByLabel('Your message', { exact: true }).fill('My answer is still unsent.');
    await page.reload();
    await expect(page.getByLabel('Your message', { exact: true })).toHaveValue('My answer is still unsent.');
    await page.waitForTimeout(2100);
    const resumed = await second.newPage(); await browserSignIn(resumed, owner.email);
    await resumed.goto(`/?subject=${subject}&conversation=${conversation}`);
    await expect(resumed.getByLabel('Assessment progress')).toContainText('Current question 1 · hard');
    await resumed.getByRole('button', { name: 'Resume assessment', exact: true }).click();
    await resumed.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(resumed.getByText('Message and complete reply saved.', { exact: true })).toBeVisible();
    state = (await history(resumed, subject, conversation)).at(-1).assessment;
    expect(state.opened).toBe(1); expect(state.current_question.id).toBe(question);
    const stale = await page.request.post('/api/conversations', { headers: headers(), data: { subject, conversation, operation: randomUUID(), text: 'My answer from an old tab.', practice: true, assessmentRevision: state.revision - 1 } });
    expect(stale.status()).toBe(409);
    await expect(page.getByLabel('Your message', { exact: true })).toHaveValue('My answer is still unsent.');
    let result = await send(resumed, subject, conversation, 'My answer uses displacement rather than distance.', state.revision);
    expect(result.state).toMatchObject({ opened: 2, answered: 1, skipped: 0, current_question: { difficulty: 'hard' } });
    result = await send(resumed, subject, conversation, 'Skip the current assessment question; it is not assessed.', result.state.revision);
    expect(result.state).toMatchObject({ opened: 3, answered: 1, skipped: 1 });
    expect(result.output).toContain('not assessed, not failed');
    result = await send(resumed, subject, conversation, 'My answer applies the idea to another example.', result.state.revision);
    expect(result.state.opened).toBe(4); // No hard three-question sequence.
    result = await send(resumed, subject, conversation, 'My answer reaches a checkpoint now; offer a recap.', result.state.revision);
    expect(result.output).toContain('[recap-checkpoint]');
    expect(result.state).toMatchObject({ opened: 4, answered: 3, skipped: 1, current_question: null });
    await resumed.reload();
    await resumed.getByRole('button', { name: 'Request Practice recap', exact: true }).click();
    await expect(resumed.getByText('Provisional recap saved. Review it or keep talking.', { exact: true })).toBeVisible();
    await expect(resumed.getByLabel('Recap assistance')).toHaveValue(/Hint requested/);
    await expect(resumed.getByLabel('Recap uncertainty')).toHaveValue(/insufficient.*mastery/);
    await resumed.getByRole('button', { name: 'Accept recap', exact: true }).click();
    await expect(resumed.getByText('Reviewed observation saved. Newer discussion remains tentative.', { exact: true })).toBeVisible();
    result = await send(resumed, subject, conversation, 'Continue my assessment with easy questions instead.', result.state.revision);
    expect(result.state.current_question.difficulty).toBe('easy');
    const before = (await history(resumed, subject, conversation)).length;
    expect((await resumed.request.post('/api/conversations', { headers: headers(), data: result.operation })).ok()).toBe(true);
    expect((await history(resumed, subject, conversation)).length).toBe(before);
    await resumed.getByRole('button', { name: 'Log out', exact: true }).click();
    await page.waitForTimeout(2100);
    await browserSignIn(resumed, owner.email);
    await resumed.goto(`/?subject=${subject}&conversation=${conversation}`);
    await expect(resumed.getByLabel('Assessment progress')).toContainText('Current question 5 · easy');
  } finally { await second.close(); await admin().auth.admin.deleteUser(owner.id); }
});

test('assessment boundary rejects unsupported sources, foreign progress and wrong-difficulty/incomplete provider output', async ({ page, browser, request }) => {
  const { owner, subject, document } = await setup(page, request);
  const foreign = await provisionAccount(), otherContext = await browser.newContext();
  try {
    const other = await otherContext.newPage(); await browserSignIn(other, foreign.email);
    const conversation = randomUUID();
    const first = await send(page, subject, conversation, 'Quiz me on motion with hard questions.');
    const forged = { ...first.operation, operation: randomUUID(), assessment: { opened: 100, mastered: true } };
    expect((await page.request.post('/api/conversations', { headers: headers(), data: forged })).status()).toBe(400);
    expect((await other.request.post('/api/conversations', { headers: headers(), data: { ...first.operation, operation: randomUUID() } })).status()).toBe(403);
    expect((await other.request.get(`/api/conversations?subject=${subject}&conversation=${conversation}`)).status()).toBe(404);
    await request.post(`${control()}/control/openai/mode/wrong-difficulty`);
    const bad = await page.request.post('/api/conversations', { headers: headers(), data: { subject, conversation, operation: randomUUID(), text: 'My answer should lead to another hard question.', practice: true } });
    expect(await bad.text()).toContain('did not respect the requested difficulty');
    let turns = await history(page, subject, conversation);
    expect(turns.at(-1).status).toBe('incomplete'); expect(turns.at(-1).assessment).toBeNull();
    await request.post(`${control()}/control/openai/mode/disconnect`);
    const interrupted = await page.request.post('/api/conversations', { headers: headers(), data: { subject, conversation, operation: randomUUID(), text: 'My answer retry is explicit.', practice: true } });
    expect(await interrupted.text()).toContain('"status":"incomplete"');
    await request.post(`${control()}/control/openai/mode/completed`);
    const next = await send(page, subject, conversation, 'My answer now succeeds.');
    expect(next.state).toMatchObject({ opened: 2, answered: 1 });
    // Excluded Draft content cannot become assessment material.
    await page.request.post('/api/documents', { headers: headers(), data: { id: document, subjectId: subject, revision: 1, title: 'EXCLUDED_SYNTHETIC_CONTENT', description: '', blocks: [{ id: 'b', markdown: 'EXCLUDED_SYNTHETIC_CONTENT' }] } });
    await send(page, subject, conversation, 'My answer uses only current approved sources.');
    const calls = await (await request.get(`${control()}/control/openai/calls`)).json();
    for (const call of calls.filter((c: { assessment: boolean }) => c.assessment)) expect(call).toMatchObject({ excludedContent: false, assessmentHard: true, store: false, hasProviderConversation: false, practiceSources: [{ id: document, revision: 1, title: 'Motion' }] });
    const empty = (await (await page.request.post('/api/subjects', { headers: headers(), data: { name: 'Unapproved' } })).json()).id;
    const emptyResponse = await page.request.post('/api/conversations', { headers: headers(), data: { subject: empty, conversation: randomUUID(), operation: randomUUID(), text: 'Assess me with hard questions.', practice: true } });
    expect(await emptyResponse.text()).toContain('No approved sources');
    const direct = createClient(apiURL(), publicKey(), { auth: { persistSession: false, autoRefreshToken: false } });
    await page.waitForTimeout(2100);
    for (const account of [owner, foreign]) {
      await direct.auth.signInWithOtp({ email: account.email, options: { shouldCreateUser: false } });
      const { code } = await latestCode(request, account.email);
      const verified = await direct.auth.verifyOtp({ email: account.email, token: code, type: 'email' });
      const tokenHeaders = { apikey: publicKey(), Authorization: `Bearer ${verified.data.session!.access_token}` };
      for (const table of ['chat_assessments','assessment_questions']) {
        const url = `${apiURL()}/rest/v1/${table}?conversation_id=eq.${conversation}`;
        const rows = await (await request.get(url, { headers: tokenHeaders })).json();
        expect(rows.length > 0).toBe(account === owner);
        expect((await request.patch(url, { headers: tokenHeaders, data: { account_id: foreign.id } })).ok()).toBe(false);
      }
      const rpc = await request.post(`${apiURL()}/rest/v1/rpc/server_assessment_reply`, { headers: tokenHeaders, data: { p_owner: owner.id, p_subject: subject, p_conversation: conversation, p_operation: first.operation.operation, p_text: 'Forged', p_topic: 'Motion', p_requested_difficulty: 'hard', p_action: 'answer', p_question: null, p_difficulty: null } });
      expect(rpc.ok()).toBe(false);
    }
    turns = await history(page, subject, conversation); expect(turns.filter((t: { assessment: unknown }) => t.assessment).at(-1).assessment.answered).toBe(2);
  } finally { await otherContext.close(); await admin().auth.admin.deleteUser(owner.id); await admin().auth.admin.deleteUser(foreign.id); }
});
