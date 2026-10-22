import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

const origin = () => ({ origin: process.env.TEST_BASE_URL! });
const control = () => process.env.TEST_AUTH_CONTROL_URL!;

test('simultaneous persistence retries generate once; context limits never truncate or charge a rejected send', async ({ page, request }) => {
  const owner = await provisionAccount();
  try {
    await request.post(`${control()}/control/openai/reset`);
    await browserSignIn(page, owner.email);
    const subject = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Identity and limits' } })).json();
    await page.request.put('/api/settings/openai', { headers: origin(), data: { key: 'sk-synthetic-bounds-key', model: 'gpt-5.4-mini-2026-03-17' } });
    const first = { subject: subject.id, conversation: randomUUID(), operation: randomUUID(), text: 'Plan my study week.' };
    const results = await Promise.all([1, 2].map(() => page.request.post('/api/conversations', { headers: origin(), data: first })));
    const bodies = await Promise.all(results.map(result => result.text()));
    expect(bodies.filter(body => body.includes('"duplicate":true'))).toHaveLength(1);
    expect(bodies.filter(body => body.includes('"status":"complete"'))).toHaveLength(1);
    const history = await (await page.request.get(`/api/conversations?subject=${subject.id}&conversation=${first.conversation}`)).json();
    expect(history).toHaveLength(1); expect(history[0].id).toBe(first.operation);
    const conversation = randomUUID();
    for (let index = 0; index < 3; index++) {
      const response = await page.request.post('/api/conversations', { headers: origin(), data: { subject: subject.id, conversation, operation: randomUUID(), text: `${index}: ${'x'.repeat(7800)}` } });
      expect(await response.text()).toContain('"status":"complete"');
    }
    const rejected = await page.request.post('/api/conversations', { headers: origin(), data: { subject: subject.id, conversation, operation: randomUUID(), text: 'x'.repeat(7800) } });
    expect(rejected.status()).toBe(400);
    expect(await rejected.text()).toContain('context limit');
    expect(await (await page.request.get(`/api/conversations?subject=${subject.id}&conversation=${conversation}`)).json()).toHaveLength(3);
    const calls = await (await request.get(`${control()}/control/openai/calls`)).json();
    const generations = calls.filter((call: { path: string }) => call.path === '/openai/responses');
    expect(generations).toHaveLength(4);
    expect(generations.map((call: { userMessages: number }) => call.userMessages)).toEqual([1, 1, 2, 3]);
  } finally { await request.post(`${control()}/control/openai/reset`); await admin().auth.admin.deleteUser(owner.id); }
});
