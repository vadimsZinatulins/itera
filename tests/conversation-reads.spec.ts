import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

const origin = () => ({ origin: process.env.TEST_BASE_URL! });
const control = () => process.env.TEST_AUTH_CONTROL_URL!;

test('malformed saved history is unavailable rather than an invitation to start over, preserves unsent text and recovers', async ({ page }) => {
  const owner = await provisionAccount();
  try {
    await browserSignIn(page, owner.email);
    const subject = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'History read recovery' } })).json();
    const conversation = randomUUID();
    expect((await page.request.post('/api/conversations', {
      headers: origin(), data: { subject: subject.id, conversation, operation: randomUUID(), text: 'A durable question' },
    })).ok()).toBe(true);
    await page.goto(`/?subject=${subject.id}&conversation=${conversation}`);
    await expect(page.getByText('Companion · incomplete', { exact: true })).toBeVisible();
    await page.getByLabel('Your message', { exact: true }).fill('Retain this unsent follow-up');
    await page.route('**/api/conversations?*', async route => {
      const response = await route.fetch();
      if (!new URL(route.request().url()).searchParams.has('conversation')) {
        await route.fulfill({ response });
        return;
      }
      const turns = await response.json();
      await route.fulfill({ response, json: turns.map((turn: Record<string, unknown>) => ({ ...turn, status: 'invented' })) });
    });
    await page.reload();
    await expect(page.getByLabel('Conversation status')).toContainText('Conversation unavailable. Choose another thread or reload.');
    await expect(page.getByLabel('Conversation messages')).not.toContainText('Send a message to begin.');
    await expect(page.getByLabel('Conversation messages')).not.toContainText('Companion · incomplete');
    await expect(page.getByLabel('Your message', { exact: true })).toHaveValue('Retain this unsent follow-up');
    await page.unroute('**/api/conversations?*');
    await page.reload();
    await expect(page.getByText('Companion · incomplete', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Your message', { exact: true })).toHaveValue('Retain this unsent follow-up');
  } finally {
    await admin().auth.admin.deleteUser(owner.id);
  }
});

test('conversation API rejects malformed persistence responses safely, reports only closed metadata and recovers full history', async ({ page, request }) => {
  const owner = await provisionAccount();
  try {
    await browserSignIn(page, owner.email);
    const subject = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Persisted conversation contracts' } })).json();
    const conversation = randomUUID(), operation = randomUUID();
    expect((await page.request.post('/api/conversations', {
      headers: origin(), data: { subject: subject.id, conversation, operation, text: 'Private saved question' },
    })).ok()).toBe(true);
    const trailURL = `/api/conversations?subject=${subject.id}`;
    const historyURL = `${trailURL}&conversation=${conversation}`;
    const originalTrail = await (await page.request.get(trailURL)).json();
    const originalHistory = await (await page.request.get(historyURL)).json();
    expect(originalTrail[0]).toMatchObject({ id: conversation, title: 'Private saved question', created_at: expect.any(String) });
    expect(originalHistory[0]).toMatchObject({ id: operation, ordinal: 1, practice: false, sources: [], assessment: null, status: 'incomplete', pending_until: expect.any(String) });
    await request.delete(`${control()}/control/settings-read-reports`);
    for (const [mode, url, message] of [
      ['malformed-trail', trailURL, 'Could not load trail.'],
      ['malformed-sources', historyURL, 'Could not load conversation.'],
      ['malformed-assessment', historyURL, 'Could not load conversation.'],
    ]) {
      expect((await request.post(`${control()}/control/conversations-read/${mode}`)).status()).toBe(204);
      const response = await page.request.get(url);
      expect(response.status()).toBe(503);
      expect(response.headers()['cache-control']).toBe('no-store');
      expect(await response.json()).toEqual({ error: message });
    }
    await expect.poll(async () => (await request.get(`${control()}/control/settings-read-reports`)).json()).toEqual([
      "Conversations read failed. { stage: 'persistence', kind: 'invalid-response' }",
      "Conversations read failed. { stage: 'persistence', kind: 'invalid-response' }",
      "Conversations read failed. { stage: 'persistence', kind: 'invalid-response' }",
    ]);
    await request.post(`${control()}/control/conversations-read/valid`);
    expect(await (await page.request.get(trailURL)).json()).toEqual(originalTrail);
    expect(await (await page.request.get(historyURL)).json()).toEqual(originalHistory);
  } finally {
    await request.post(`${control()}/control/conversations-read/valid`);
    await admin().auth.admin.deleteUser(owner.id);
  }
});

for (const failedRead of ['history', 'trail']) {
  test(`checking a saved send with malformed ${failedRead} preserves save identity and never retries generation`, async ({ page, request }) => {
    const owner = await provisionAccount();
    try {
      await request.post(`${control()}/control/openai/reset`);
      await browserSignIn(page, owner.email);
      const subject = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: `Duplicate ${failedRead} recovery` } })).json();
      expect((await page.request.put('/api/settings/openai', { headers: origin(), data: { key: 'sk-synthetic-read-recovery', model: 'gpt-5.4-mini-2026-03-17' } })).ok()).toBe(true);
      await page.goto(`/?subject=${subject.id}`);
      let identity: { conversation: string; operation: string } | undefined;
      await page.route('**/api/conversations', async route => {
        identity = route.request().postDataJSON();
        await route.fetch();
        await route.abort('failed');
      });
      await page.getByLabel('Your message', { exact: true }).fill('Save once; check explicitly');
      await page.getByRole('button', { name: 'Send message', exact: true }).click();
      await expect(page.getByLabel('Conversation status')).toContainText('Send failed or unconfirmed');
      await page.unroute('**/api/conversations');
      await page.reload();
      await expect(page.getByRole('button', { name: 'Retry same send', exact: true })).toBeVisible();
      await page.route('**/api/conversations?*', async route => {
        const isHistory = new URL(route.request().url()).searchParams.has('conversation');
        if (isHistory === (failedRead === 'history')) {
          await route.fulfill({ json: [null] });
          return;
        }
        await route.continue();
      });
      page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Retry same send', exact: true }).click();
      if (failedRead === 'history') {
        await expect(page.getByLabel('Conversation messages')).toContainText('Conversation unavailable. Choose another thread or reload.');
        await expect(page.getByLabel('Conversation messages')).not.toContainText('Send a message to begin.');
      } else {
        await expect(page.getByLabel('Conversation threads')).toContainText('Could not load your trail. Try reloading.');
        await expect(page.getByText('Companion · complete', { exact: true })).toBeVisible();
      }
      await expect(page.getByLabel('Conversation status')).not.toContainText('Message already saved. No generation was retried.');
      await page.unroute('**/api/conversations?*');
      await page.reload();
      await expect(page.getByText('Companion · complete', { exact: true })).toBeVisible();
      const history = await (await page.request.get(`/api/conversations?subject=${subject.id}&conversation=${identity!.conversation}`)).json();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe(identity!.operation);
      const calls = await (await request.get(`${control()}/control/openai/calls`)).json();
      expect(calls.filter((call: { path: string }) => call.path === '/openai/responses')).toHaveLength(1);
    } finally {
      await request.post(`${control()}/control/openai/reset`);
      await admin().auth.admin.deleteUser(owner.id);
    }
  });
}

test('invalid JSON, wrong-shaped lists and HTTP read failures never display successful empty trail or history', async ({ page }) => {
  const owner = await provisionAccount();
  try {
    await browserSignIn(page, owner.email);
    const subject = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Unavailable read shapes' } })).json();
    const conversation = randomUUID();
    for (const target of ['trail', 'history']) {
      for (const body of ['null', '{}', '[null]', '{invalid', '{"error":"unsafe private diagnostic"}']) {
        await page.route('**/api/conversations?*', async route => {
          const isHistory = new URL(route.request().url()).searchParams.has('conversation');
          if (isHistory !== (target === 'history')) {
            await route.continue();
            return;
          }
          await route.fulfill({ status: body.includes('diagnostic') ? 503 : 200, contentType: 'application/json', body });
        });
        await page.goto(`/?subject=${subject.id}${target === 'history' ? `&conversation=${conversation}` : ''}`);
        const region = page.getByLabel(target === 'history' ? 'Conversation messages' : 'Conversation threads', { exact: true });
        await expect(region).toContainText(target === 'history' ? 'Conversation unavailable. Choose another thread or reload.' : 'Could not load your trail. Try reloading.');
        await expect(region).not.toContainText(target === 'history' ? 'Send a message to begin.' : 'Your first saved message');
        await expect(page.getByText('unsafe private diagnostic', { exact: false })).toHaveCount(0);
        await page.unroute('**/api/conversations?*');
      }
    }
  } finally {
    await admin().auth.admin.deleteUser(owner.id);
  }
});

test('conversation reads preserve safe HTTP contracts through Auth and Data outages and recover explicitly', async ({ page, request }) => {
  const owner = await provisionAccount();
  try {
    await browserSignIn(page, owner.email);
    const subject = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Conversation outages' } })).json();
    for (const query of ['subject=not-a-uuid', `subject=${subject.id}&conversation=not-a-uuid`, `subject=${subject.id}&conversation=`]) {
      const invalid = await page.request.get(`/api/conversations?${query}`);
      expect(invalid.status()).toBe(400);
      expect(invalid.headers()['cache-control']).toBe('no-store');
      expect(await invalid.json()).toEqual({ error: 'Invalid conversation scope.' });
    }
    for (const service of ['data', 'auth']) {
      await request.post(`${control()}/control/${service}/off`);
      const response = await page.request.get(`/api/conversations?subject=${subject.id}`);
      expect(response.status()).toBe(503);
      expect(response.headers()['cache-control']).toBe('no-store');
      expect(await response.json()).toEqual({ error: 'Could not load conversations. Try again.' });
      await request.post(`${control()}/control/${service}/on`);
      expect(await (await page.request.get(`/api/conversations?subject=${subject.id}`)).json()).toEqual([]);
    }
  } finally {
    await request.post(`${control()}/control/data/on`);
    await request.post(`${control()}/control/auth/on`);
    await admin().auth.admin.deleteUser(owner.id);
  }
});

test('saved assessment history retains complete source and assessment snapshots beyond rendered fields', async ({ page, request }) => {
  const owner = await provisionAccount();
  try {
    await request.post(`${control()}/control/openai/reset`);
    await browserSignIn(page, owner.email);
    const subject = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Full assessment history' } })).json();
    const document = randomUUID(), conversation = randomUUID(), operation = randomUUID();
    expect((await page.request.post('/api/documents', {
      headers: origin(), data: { id: document, subjectId: subject.id, revision: 0, title: 'Motion', description: '', blocks: [{ id: 'first', markdown: 'Velocity is displacement over time.' }] },
    })).ok()).toBe(true);
    expect((await page.request.post('/api/documents/approve', { headers: origin(), data: { id: document, subjectId: subject.id, revision: 1 } })).ok()).toBe(true);
    expect((await page.request.put('/api/settings/openai', { headers: origin(), data: { key: 'sk-synthetic-full-history', model: 'gpt-5.4-mini-2026-03-17' } })).ok()).toBe(true);
    const sent = await page.request.post('/api/conversations', {
      headers: origin(), data: { subject: subject.id, conversation, operation, text: 'Assess me on motion with hard questions.', practice: true },
    });
    expect(await sent.text()).toContain('"status":"complete"');
    const history = await page.request.get(`/api/conversations?subject=${subject.id}&conversation=${conversation}`);
    expect(history.headers()['cache-control']).toBe('no-store');
    const turns = await history.json();
    expect(turns).toHaveLength(1);
    expect(turns[0].sources).toEqual([{ id: document, title: 'Motion', revision: 1 }]);
    expect(turns[0].assessment).toEqual({
      conversation_id: conversation, account_id: owner.id, subject_id: subject.id,
      revision: 1, topic: 'Motion', requested_difficulty: 'hard',
      opened: 1, answered: 0, skipped: 0, budget: null,
      current_question: {
        id: operation, conversation_id: conversation, account_id: owner.id,
        number: 1, question: 'Synthetic question 1: apply the approved idea to a new example?',
        difficulty: 'hard', status: 'open', assistance: [],
      },
    });
    await page.goto(`/?subject=${subject.id}&conversation=${conversation}`);
    await expect(page.getByLabel('Assessment progress')).toContainText('Current question 1 · hard');
    await expect(page.getByText('Approved sources selected · 1', { exact: true })).toBeVisible();
  } finally {
    await request.post(`${control()}/control/openai/reset`);
    await admin().auth.admin.deleteUser(owner.id);
  }
});
