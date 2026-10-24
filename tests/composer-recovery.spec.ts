import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

const origin = () => ({ origin: process.env.TEST_BASE_URL! });

test('a corrupt pending operation cannot lock device recovery into an invalid same-send retry', async ({ page, request }) => {
  const owner = await provisionAccount();
  const control = process.env.TEST_AUTH_CONTROL_URL!;
  try {
    await request.post(`${control}/control/openai/reset`);
    await browserSignIn(page, owner.email);
    const created = await page.request.post('/api/subjects', {
      headers: origin(),
      data: { name: 'Corrupt composer recovery' },
    });
    expect(created.status()).toBe(201);
    const subject = await created.json();
    const configured = await page.request.put('/api/settings/openai', {
      headers: origin(),
      data: { key: 'sk-synthetic-composer-recovery', model: 'gpt-5.4-mini-2026-03-17' },
    });
    expect(configured.ok()).toBe(true);
    await page.goto(`/?subject=${subject.id}`);
    const composer = page.getByLabel('Your message', { exact: true });
    await composer.fill('My device-only study question');
    await expect(page.getByText(/Unsent · Saved on this device/)).toBeVisible();

    // Corrupt only the browser-storage boundary: the pending UUID cannot be a server-saved operation.
    await page.evaluate(({ account, subject, conversation }) => {
      localStorage.setItem(`learning-companion:chat:v1:${account}:${subject}:new`, JSON.stringify({
        text: 'My device-only study question',
        practice: false,
        operation: {
          subject,
          conversation,
          operation: 'not-a-uuid',
          text: 'My device-only study question',
          practice: false,
        },
      }));
    }, { account: owner.id, subject: subject.id, conversation: randomUUID() });

    let submissions = 0;
    page.on('request', outgoing => {
      if (outgoing.method() === 'POST' && new URL(outgoing.url()).pathname === '/api/conversations') {
        submissions += 1;
      }
    });
    await page.reload();
    // Explicit restoration avoids asserting against the pre-hydration empty composer.
    await page.getByRole('button', { name: 'A new thread', exact: true }).click();
    await expect(composer).toBeEditable();
    await expect(page.getByRole('button', { name: 'Retry same send', exact: true })).toHaveCount(0);
    expect(submissions).toBe(0);
    expect(await (await page.request.get(`/api/conversations?subject=${subject.id}`)).json()).toEqual([]);
    const before = await (await request.get(`${control}/control/openai/calls`)).json();
    expect(before.filter((call: { path: string }) => call.path === '/openai/responses')).toHaveLength(0);

    await composer.fill('Help me organise my study goals.');
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(page.getByLabel('Conversation status')).toContainText('Message and complete reply saved');
    expect(submissions).toBe(1);
    const conversation = new URL(page.url()).searchParams.get('conversation');
    expect(conversation).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const history = await page.request.get(`/api/conversations?subject=${subject.id}&conversation=${conversation}`);
    expect(history.status()).toBe(200);
    expect(await history.json()).toEqual([expect.objectContaining({
      id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
      user_text: 'Help me organise my study goals.',
      status: 'complete',
      practice: false,
    })]);
    await expect(composer).toHaveValue('');
    const after = await (await request.get(`${control}/control/openai/calls`)).json();
    expect(after.filter((call: { path: string }) => call.path === '/openai/responses')).toHaveLength(1);
  } finally {
    await request.post(`${control}/control/openai/reset`);
    await admin().auth.admin.deleteUser(owner.id);
  }
});
