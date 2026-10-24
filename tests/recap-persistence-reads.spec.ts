import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

const headers = () => ({ origin: process.env.TEST_BASE_URL! });

test('recap API rejects malformed opaque persistence JSON with safe diagnostics and preserves full reviewed rows on recovery', async ({ page, request }) => {
  const owner = await provisionAccount();
  const control = process.env.TEST_AUTH_CONTROL_URL;
  try {
    await request.post(`${control}/control/openai/reset`);
    await browserSignIn(page, owner.email);
    const subject = (await (await page.request.post('/api/subjects', { headers: headers(), data: { name: 'Persisted recap contracts' } })).json()).id;
    const document = randomUUID();
    expect((await page.request.post('/api/documents', { headers: headers(), data: { id: document, subjectId: subject, revision: 0, title: 'Motion', description: '', blocks: [{ id: 'b', markdown: 'Velocity is displacement over time.' }] } })).ok()).toBe(true);
    expect((await page.request.post('/api/documents/approve', { headers: headers(), data: { id: document, subjectId: subject, revision: 1 } })).ok()).toBe(true);
    await page.request.put('/api/settings/openai', { headers: headers(), data: { key: 'sk-synthetic-recap-persistence-key', model: 'gpt-5.4-mini-2026-03-17' } });
    const conversation = randomUUID();
    const sent = await page.request.post('/api/conversations', { headers: headers(), data: { subject, conversation, operation: randomUUID(), text: 'Practise motion with a hint.', practice: true } });
    expect(await sent.text()).toContain('"status":"complete"');
    const operation = randomUUID();
    expect((await page.request.post('/api/recaps', { headers: headers(), data: { subject, conversation, operation, action: 'generate' } })).ok()).toBe(true);
    expect((await page.request.post('/api/recaps', { headers: headers(), data: { subject, operation, action: 'accepted' } })).ok()).toBe(true);
    const url = `/api/recaps?subject=${subject}&conversation=${conversation}`;
    const before = await (await page.request.get(url)).json();
    expect(before.recaps[0]).toEqual({
      id: operation, account_id: owner.id, subject_id: subject, conversation_id: conversation,
      revision: 0, coverage_from: 1, coverage_to: 1, sources: [{ id: document, title: 'Motion', revision: 1 }],
      proposal: { text: 'TENTATIVE_SYNTHETIC_OBSERVATION: reasoning remains provisional.', difficulty: 'Hard requested; not a calibrated ability measure.', assistance: 'Hint requested; not independent performance.', uncertainty: 'One answer is insufficient to infer mastery.' },
      status: 'accepted', created_at: expect.any(String),
    });
    expect(before.observations[0]).toEqual({
      id: operation, account_id: owner.id, subject_id: subject, conversation_id: conversation, origin_conversation_id: conversation,
      coverage_from: 1, coverage_to: 1, sources: [{ id: document, title: 'Motion', revision: 1, deleted: false }],
      observation: before.recaps[0].proposal, review: 'accepted', created_at: expect.any(String),
    });
    expect(before.through).toBe(1);
    await request.delete(`${control}/control/settings-read-reports`);
    for (const mode of ['malformed-proposal', 'malformed-observation', 'malformed-sources', 'unavailable']) {
      await request.post(`${control}/control/recaps-read/${mode}`);
      const unavailable = await page.request.get(url);
      expect(unavailable.status()).toBe(503);
      expect(unavailable.headers()['cache-control']).toBe('no-store');
      expect(await unavailable.json()).toEqual({ error: 'Could not load reviewed understanding.' });
    }
    await expect.poll(async () => (await request.get(`${control}/control/settings-read-reports`)).json()).toEqual([
      "Practice recaps read failed. { stage: 'persistence', kind: 'invalid-response' }",
      "Practice recaps read failed. { stage: 'persistence', kind: 'invalid-response' }",
      "Practice recaps read failed. { stage: 'persistence', kind: 'invalid-response' }",
      "Practice recaps read failed. { stage: 'persistence', kind: 'integration-failure' }",
    ]);
    await request.post(`${control}/control/recaps-read/valid`);
    const recovered = await page.request.get(url);
    expect(recovered.status()).toBe(200);
    expect(await recovered.json()).toEqual(before);

    // Reviewed understanding remains Subject-wide, independent of the current conversation's coverage.
    const remainingConversation = randomUUID();
    const next = await page.request.post('/api/conversations', { headers: headers(), data: { subject, conversation: remainingConversation, operation: randomUUID(), text: 'Keep exploring motion.' } });
    expect(await next.text()).toContain('"status":"complete"');
    const retainedURL = `/api/recaps?subject=${subject}&conversation=${remainingConversation}`;
    const retained = await page.request.get(retainedURL);
    expect(retained.status()).toBe(200);
    expect(await retained.json()).toEqual({
      recaps: [], through: 0,
      observations: before.observations,
    });
    // Real deletion fixture is unavailable: service_role cannot DELETE these tables.
    // Exercise the nullable/deleted browser representation at the approved transport seam instead.
    await page.route(`**${retainedURL}`, async route => {
      const response = await route.fetch();
      const state = await response.json();
      await route.fulfill({ response, json: {
        ...state,
        observations: [{ ...state.observations[0], conversation_id: null, sources: [{ id: document, title: 'Motion', revision: 1, deleted: true }] }],
      } });
    });
    await page.goto(`/?subject=${subject}&conversation=${remainingConversation}`);
    await page.getByText('Reviewed observations · 1', { exact: true }).click();
    await expect(page.getByText('Source conversation deleted', { exact: false })).toBeVisible();
    await expect(page.getByText('Motion · Practice version 1 · Source deleted', { exact: true })).toBeVisible();
    await expect(page.getByText('Observation: TENTATIVE_SYNTHETIC_OBSERVATION: reasoning remains provisional.', { exact: true })).toBeVisible();
    expect((await page.request.get(url)).status()).toBe(200);
  } finally {
    await request.post(`${control}/control/recaps-read/valid`);
    await admin().auth.admin.deleteUser(owner.id);
  }
});

test('recap GET preserves authenticated scope and outage HTTP contracts without leaking foreign understanding', async ({ page, browser, request }) => {
  const owner = await provisionAccount();
  const foreign = await provisionAccount();
  const context = await browser.newContext();
  const control = process.env.TEST_AUTH_CONTROL_URL;
  try {
    const anonymous = await request.get(`/api/recaps?subject=${randomUUID()}&conversation=${randomUUID()}`);
    expect(anonymous.status()).toBe(401);
    expect(await anonymous.json()).toEqual({ error: 'Sign in required.' });
    await request.post(`${control}/control/openai/reset`);
    await browserSignIn(page, owner.email);
    const other = await context.newPage();
    await browserSignIn(other, foreign.email);
    const subject = (await (await page.request.post('/api/subjects', { headers: headers(), data: { name: 'Private recap reads' } })).json()).id;
    const separateSubject = (await (await page.request.post('/api/subjects', { headers: headers(), data: { name: 'Separate understanding' } })).json()).id;
    await page.request.put('/api/settings/openai', { headers: headers(), data: { key: 'sk-synthetic-recap-privacy-key', model: 'gpt-5.4-mini-2026-03-17' } });
    const conversation = randomUUID();
    expect(await (await page.request.post('/api/conversations', { headers: headers(), data: { subject, conversation, operation: randomUUID(), text: 'Discuss motion.' } })).text()).toContain('"status":"complete"');
    const url = `/api/recaps?subject=${subject}&conversation=${conversation}`;
    for (const invalid of [`/api/recaps?subject=invalid&conversation=${conversation}`, `/api/recaps?subject=${subject}`, `/api/recaps?subject=${subject}&conversation=invalid`]) {
      const response = await page.request.get(invalid);
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ error: 'Invalid recap scope.' });
    }
    for (const response of [await other.request.get(url), await page.request.get(`/api/recaps?subject=${separateSubject}&conversation=${conversation}`)]) {
      expect(response.status()).toBe(404);
      expect(await response.json()).toEqual({ error: 'Conversation unavailable.' });
    }
    for (const service of ['auth', 'data']) {
      await request.post(`${control}/control/${service}/off`);
      const failed = await page.request.get(url);
      expect(failed.status()).toBe(503);
      expect(failed.headers()['cache-control']).toBe('no-store');
      expect(await failed.json()).toEqual({ error: 'Could not load reviewed understanding.' });
      await request.post(`${control}/control/${service}/on`);
      expect(await (await page.request.get(url)).json()).toEqual({ recaps: [], observations: [], through: 0 });
    }
  } finally {
    await request.post(`${control}/control/auth/on`);
    await request.post(`${control}/control/data/on`);
    await context.close();
    await admin().auth.admin.deleteUser(owner.id);
    await admin().auth.admin.deleteUser(foreign.id);
  }
});
