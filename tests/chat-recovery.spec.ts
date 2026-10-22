import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { admin, browserSignIn, provisionAccount } from './fixtures';

const origin = () => ({ origin: process.env.TEST_BASE_URL! });

test('device-only drafts survive reload and Subject/thread switches; logout clears recovery', async ({ page }) => {
  const owner = await provisionAccount();
  try {
    await browserSignIn(page, owner.email);
    const create = async (name: string) => (await page.request.post('/api/subjects', { headers: origin(), data: { name } })).json();
    const a = await create('Recovery A'), b = await create('Recovery B');
    const conversation = randomUUID();
    await page.request.post('/api/conversations', { headers: origin(), data: { subject: a.id, conversation, operation: randomUUID(), text: 'Saved history without a configured key' } });
    await page.goto(`/?subject=${a.id}`);
    const composer = page.getByLabel('Your message', { exact: true });
    await composer.fill('Unsent new thread A');
    await expect(page.getByText(/Unsent · Saved on this device/)).toBeVisible();
    await page.reload(); await expect(composer).toHaveValue('Unsent new thread A');
    await page.getByRole('button', { name: 'Saved history without a configured key', exact: true }).click();
    await expect(composer).toHaveValue('');
    await composer.fill('Unsent existing thread');
    await page.getByRole('button', { name: 'A new thread', exact: true }).click();
    await expect(composer).toHaveValue('Unsent new thread A');
    await page.goto(`/?subject=${b.id}`); await expect(composer).toHaveValue('');
    await composer.fill('Unsent B');
    await page.goto(`/?subject=${a.id}&conversation=${conversation}`);
    await expect(composer).toHaveValue('Unsent existing thread');
    await expect(page.getByText('Companion · incomplete', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page).toHaveURL(/login/);
    await page.waitForTimeout(2100); await browserSignIn(page, owner.email);
    await page.goto(`/?subject=${a.id}&conversation=${conversation}`);
    await expect(composer).toHaveValue('');
    await expect(page.getByText('You · saved', { exact: true })).toBeVisible();
    await page.goto(`/?subject=${b.id}`); await expect(composer).toHaveValue('');
  } finally { await admin().auth.admin.deleteUser(owner.id); }
});

test('interrupted output stays incomplete across reload and a separate session; another generation is explicit', async ({ page, browser, request }) => {
  const owner = await provisionAccount();
  const context = await browser.newContext();
  const control = process.env.TEST_AUTH_CONTROL_URL!;
  try {
    await request.post(`${control}/control/openai/reset`);
    await request.post(`${control}/control/openai/mode/disconnect`);
    await browserSignIn(page, owner.email);
    const subject = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Interrupted stream' } })).json();
    await page.request.put('/api/settings/openai', { headers: origin(), data: { key: 'sk-synthetic-interruption', model: 'gpt-5.4-mini-2026-03-17' } });
    await page.goto(`/?subject=${subject.id}`);
    await page.getByLabel('Your message', { exact: true }).fill('Help me organise my study goals.');
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(page.getByLabel('Conversation status')).toContainText('Reply incomplete');
    await page.reload();
    await expect(page.getByText('Companion · incomplete', { exact: true })).toBeVisible();
    await expect(page.getByText('Let’s organise your study goals.', { exact: true })).toBeVisible();
    await page.waitForTimeout(2100);
    const other = await context.newPage(); await browserSignIn(other, owner.email);
    await other.goto(page.url());
    await expect(other.getByText('Companion · incomplete', { exact: true })).toBeVisible();
    await expect(other.getByText('Let’s organise your study goals.', { exact: true })).toBeVisible();
    await expect(other.getByLabel('Your message', { exact: true })).toHaveValue('');
    page.once('dialog', async dialog => { expect(dialog.message()).toContain('may already have incurred charges'); await dialog.accept(); });
    await page.getByRole('button', { name: 'Request another reply', exact: true }).click();
    await expect(page.getByLabel('Conversation status')).toContainText('New request prepared');
    let calls = await (await request.get(`${control}/control/openai/calls`)).json();
    expect(calls.filter((call: { path: string }) => call.path === '/openai/responses')).toHaveLength(1);
    await request.post(`${control}/control/openai/mode/completed`);
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(page.getByLabel('Conversation status')).toContainText('Message and complete reply saved');
    calls = await (await request.get(`${control}/control/openai/calls`)).json();
    expect(calls.filter((call: { path: string }) => call.path === '/openai/responses')).toHaveLength(2);
  } finally { await context.close(); await request.post(`${control}/control/openai/reset`); await admin().auth.admin.deleteUser(owner.id); }
});

test('navigation during a slow reply preserves saved history independently of another Subject draft', async ({ page, request }) => {
  const owner = await provisionAccount();
  const control = process.env.TEST_AUTH_CONTROL_URL!;
  try {
    await request.post(`${control}/control/openai/reset`);
    await request.post(`${control}/control/openai/mode/slow`);
    await browserSignIn(page, owner.email);
    const create = async (name: string) => (await page.request.post('/api/subjects', { headers: origin(), data: { name } })).json();
    const a = await create('Slow reply'), b = await create('Other Subject');
    await page.request.put('/api/settings/openai', { headers: origin(), data: { key: 'sk-synthetic-slow', model: 'gpt-5.4-mini-2026-03-17' } });
    await page.goto(`/?subject=${a.id}`);
    await page.getByLabel('Your message', { exact: true }).fill('A slow saved message');
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(page.getByLabel('Conversation status')).toContainText('Reply streaming');
    await expect(page.getByText('Let’s organise', { exact: true })).toBeVisible();
    const conversation = new URL(page.url()).searchParams.get('conversation');
    await page.goto(`/?subject=${b.id}`);
    await page.getByLabel('Your message', { exact: true }).fill('Independent unsent text');
    await page.goto(`/?subject=${a.id}&conversation=${conversation}`);
    await expect(page.getByLabel('Your message', { exact: true })).toHaveValue('');
    await expect(page.getByText('You · saved', { exact: true })).toBeVisible();
    await expect(page.getByText('Companion · incomplete', { exact: true })).toBeVisible();
    const history = await (await page.request.get(`/api/conversations?subject=${a.id}&conversation=${conversation}`)).json();
    expect(history).toHaveLength(1); expect(history[0].assistant_text).toContain('Let’s organise');
    await page.goto(`/?subject=${b.id}`);
    await expect(page.getByLabel('Your message', { exact: true })).toHaveValue('Independent unsent text');
    const calls = await (await request.get(`${control}/control/openai/calls`)).json();
    expect(calls.filter((call: { path: string }) => call.path === '/openai/responses')).toHaveLength(1);
  } finally { await request.post(`${control}/control/openai/reset`); await admin().auth.admin.deleteUser(owner.id); }
});

for (const afterSave of [false, true]) {
  test(`uncertain send ${afterSave ? 'after' : 'before'} save acknowledgement recovers exact identity without automatic replay`, async ({ page, request }) => {
    const owner = await provisionAccount();
    const control = process.env.TEST_AUTH_CONTROL_URL!;
    try {
      await request.post(`${control}/control/openai/reset`);
      await browserSignIn(page, owner.email);
      const subject = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Uncertain recovery' } })).json();
      await page.request.put('/api/settings/openai', { headers: origin(), data: { key: 'sk-synthetic-recovery', model: 'gpt-5.4-mini-2026-03-17' } });
      await page.goto(`/?subject=${subject.id}`);
      let identity: { operation: string; conversation: string } | undefined;
      await page.route('**/api/conversations', async route => {
        if (route.request().method() !== 'POST') return route.continue();
        identity = route.request().postDataJSON();
        if (afterSave) await route.fetch();
        await route.abort('failed');
      });
      await page.getByLabel('Your message', { exact: true }).fill('Recover this exact message');
      await page.getByRole('button', { name: 'Send message', exact: true }).click();
      await expect(page.getByLabel('Conversation status')).toContainText('Send failed or unconfirmed');
      await page.unroute('**/api/conversations');
      await page.reload();
      await expect(page.getByLabel('Your message', { exact: true })).toHaveValue('Recover this exact message');
      await expect(page.getByText(/Unconfirmed send · Saved on this device/)).toBeVisible();
      const callsBefore = await (await request.get(`${control}/control/openai/calls`)).json();
      expect(callsBefore.filter((call: { path: string }) => call.path === '/openai/responses')).toHaveLength(afterSave ? 1 : 0);
      page.once('dialog', async dialog => { expect(dialog.message()).toContain('may incur charges'); await dialog.accept(); });
      await page.getByRole('button', { name: 'Retry same send', exact: true }).click();
      await expect(page.getByLabel('Conversation status')).toContainText(afterSave ? 'Message already saved' : 'Message and complete reply saved');
      const turns = await (await page.request.get(`/api/conversations?subject=${subject.id}&conversation=${identity!.conversation}`)).json();
      expect(turns).toHaveLength(1); expect(turns[0].id).toBe(identity!.operation);
      expect(turns[0].status).toBe('complete');
      const calls = await (await request.get(`${control}/control/openai/calls`)).json();
      expect(calls.filter((call: { path: string }) => call.path === '/openai/responses')).toHaveLength(1);
      await expect(page.getByLabel('Your message', { exact: true })).toHaveValue('');
    } finally { await request.post(`${control}/control/openai/reset`); await admin().auth.admin.deleteUser(owner.id); }
  });
}
