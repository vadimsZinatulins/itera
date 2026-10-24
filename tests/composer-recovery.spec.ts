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

test('oversized UTF-8 input stays editable and device-recoverable without starting a send', async ({ page, request }) => {
  const owner = await provisionAccount();
  const control = process.env.TEST_AUTH_CONTROL_URL!;
  try {
    await request.post(`${control}/control/openai/reset`);
    await browserSignIn(page, owner.email);
    const created = await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Composer byte validation' } });
    expect(created.status()).toBe(201);
    const subject = await created.json();
    await page.request.put('/api/settings/openai', {
      headers: origin(),
      data: { key: 'sk-synthetic-composer-bytes', model: 'gpt-5.4-mini-2026-03-17' },
    });
    await page.goto(`/?subject=${subject.id}`);
    let submissions = 0;
    page.on('request', outgoing => {
      if (outgoing.method() === 'POST' && new URL(outgoing.url()).pathname === '/api/conversations') {
        submissions += 1;
      }
    });
    const composer = page.getByLabel('Your message', { exact: true });
    await composer.fill('é'.repeat(4001));
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(page.getByLabel('Conversation status')).toContainText('Message too large');
    await expect(composer).toBeEditable();
    await expect(composer).toHaveValue('é'.repeat(4001));
    expect(submissions).toBe(0);
    await page.reload();
    await expect(composer).toHaveValue('é'.repeat(4001));
    await expect(page.getByText(/Unsent · Saved on this device/)).toBeVisible();
    await composer.fill('é'.repeat(4000));
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(page.getByLabel('Conversation status')).toContainText('Message and complete reply saved');
    expect(submissions).toBe(1);
    const conversation = new URL(page.url()).searchParams.get('conversation');
    const history = await page.request.get(`/api/conversations?subject=${subject.id}&conversation=${conversation}`);
    expect(await history.json()).toEqual([expect.objectContaining({ user_text: 'é'.repeat(4000), status: 'complete' })]);
  } finally {
    await request.post(`${control}/control/openai/reset`);
    await admin().auth.admin.deleteUser(owner.id);
  }
});

test('public submission preserves strict fields, UUID/revision policy and exact envelope bytes before persistence', async ({ page, request }) => {
  const owner = await provisionAccount();
  const control = process.env.TEST_AUTH_CONTROL_URL!;
  try {
    await request.post(`${control}/control/openai/reset`);
    await browserSignIn(page, owner.email);
    const subject = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Submission boundary' } })).json();
    await page.request.put('/api/settings/openai', { headers: origin(), data: { key: 'sk-synthetic-submission', model: 'gpt-5.4-mini-2026-03-17' } });
    const valid = { subject: subject.id, conversation: randomUUID(), operation: '00000000-0000-0000-0000-000000000000', text: '  Keep my spacing.  ' };
    for (const data of [null, [], 'message', {}, { ...valid, text: ' \n ' }, { ...valid, text: 1 },
      { ...valid, operation: 'not-a-uuid' }, { ...valid, conversation: null }, { ...valid, subject: 'bad' },
      { ...valid, account_id: owner.id }, { ...valid, extra: true }]) {
      const response = await page.request.post('/api/conversations', { headers: origin(), data: JSON.stringify(data) });
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ error: 'Invalid message.' });
    }
    const malformed = await page.request.post('/api/conversations', { headers: origin(), data: '{' });
    expect(malformed.status()).toBe(400);
    for (const practice of [null, 0, 'false', [], {}]) {
      const response = await page.request.post('/api/conversations', { headers: origin(), data: { ...valid, practice } });
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ error: 'Invalid practice selection.' });
    }
    for (const assessmentRevision of [null, -1, 0.5, Number.MAX_SAFE_INTEGER + 1, '0', []]) {
      const response = await page.request.post('/api/conversations', { headers: origin(), data: { ...valid, assessmentRevision } });
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ error: 'Invalid assessment revision.' });
    }
    const tooMuchText = await page.request.post('/api/conversations', { headers: origin(), data: { ...valid, text: 'é'.repeat(4001) } });
    expect(tooMuchText.status()).toBe(413);
    const body = JSON.stringify(valid);
    const envelope = body + ' '.repeat(12000 - new TextEncoder().encode(body).length);
    const tooMuchEnvelope = await page.request.post('/api/conversations', { headers: origin(), data: envelope + ' ' });
    expect(tooMuchEnvelope.status()).toBe(413);
    expect(await (await page.request.get(`/api/conversations?subject=${subject.id}`)).json()).toEqual([]);
    const before = await (await request.get(`${control}/control/openai/calls`)).json();
    expect(before.filter((call: { path: string }) => call.path === '/openai/responses')).toHaveLength(0);
    const accepted = await page.request.post('/api/conversations', { headers: origin(), data: envelope });
    expect(accepted.status()).toBe(200);
    expect(await accepted.text()).toContain('"status":"complete"');
    const history = await page.request.get(`/api/conversations?subject=${subject.id}&conversation=${valid.conversation}`);
    expect(await history.json()).toEqual([expect.objectContaining({ id: valid.operation, user_text: valid.text, practice: false })]);
  } finally {
    await request.post(`${control}/control/openai/reset`);
    await admin().auth.admin.deleteUser(owner.id);
  }
});

test('corrupt recovery shapes and mismatched pending relationships never become retryable sends', async ({ page, request }) => {
  const owner = await provisionAccount();
  const control = process.env.TEST_AUTH_CONTROL_URL!;
  try {
    await request.post(`${control}/control/openai/reset`);
    await browserSignIn(page, owner.email);
    const subject = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Recovery relationships' } })).json();
    await page.goto(`/?subject=${subject.id}`);
    const operation = { subject: subject.id, conversation: randomUUID(), operation: randomUUID(), text: 'Unconfirmed text', practice: false };
    const recovery = { text: operation.text, practice: false, operation };
    const corrupt = [null, [], false, { text: 3, practice: false }, { text: 'text', practice: 'false' },
      { ...recovery, operation: false }, { ...recovery, text: 'Changed text' }, { ...recovery, practice: true },
      { ...recovery, text: '   ', operation: { ...operation, text: '   ' } },
      { ...recovery, text: 'é'.repeat(4001), operation: { ...operation, text: 'é'.repeat(4001) } },
      { ...recovery, operation: { ...operation, subject: randomUUID() } },
      { ...recovery, operation: { ...operation, conversation: 'not-a-uuid' } },
      { ...recovery, operation: { ...operation, assessmentRevision: -1 } },
      { ...recovery, operation: { ...operation, assessmentRevision: 0.5 } },
      { ...recovery, operation: { ...operation, assessmentRevision: Number.MAX_SAFE_INTEGER + 1 } }];
    for (const stored of ['{', ...corrupt.map(value => JSON.stringify(value))]) {
      await page.evaluate(({ account, subject, stored }) => {
        localStorage.setItem(`learning-companion:chat:v1:${account}:${subject}:new`, stored);
      }, { account: owner.id, subject: subject.id, stored });
      await page.getByRole('button', { name: 'A new thread', exact: true }).click();
      await expect(page.getByLabel('Conversation status')).toContainText('Device recovery could not be read');
      await expect(page.getByLabel('Your message', { exact: true })).toBeEditable();
      await expect(page.getByRole('button', { name: 'Retry same send', exact: true })).toHaveCount(0);
    }
    expect(await (await page.request.get(`/api/conversations?subject=${subject.id}`)).json()).toEqual([]);
    const calls = await (await request.get(`${control}/control/openai/calls`)).json();
    expect(calls.filter((call: { path: string }) => call.path === '/openai/responses')).toHaveLength(0);
  } finally {
    await request.post(`${control}/control/openai/reset`);
    await admin().auth.admin.deleteUser(owner.id);
  }
});

test('unavailable browser storage preserves the live composer and permits only an explicit send', async ({ page, request }) => {
  const owner = await provisionAccount();
  const control = process.env.TEST_AUTH_CONTROL_URL!;
  try {
    await request.post(`${control}/control/openai/reset`);
    await browserSignIn(page, owner.email);
    const subject = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Storage interrupted' } })).json();
    await page.request.put('/api/settings/openai', { headers: origin(), data: { key: 'sk-synthetic-storage-unavailable', model: 'gpt-5.4-mini-2026-03-17' } });
    await page.goto(`/?subject=${subject.id}`);
    await page.evaluate(() => {
      const read = Storage.prototype.getItem;
      const write = Storage.prototype.setItem;
      const remove = Storage.prototype.removeItem;
      Storage.prototype.getItem = function (key) {
        if (key.startsWith('learning-companion:chat:v1:')) {
          throw new DOMException('Synthetic blocked storage', 'SecurityError');
        }
        return read.call(this, key);
      };
      Storage.prototype.setItem = function (key, value) {
        if (key.startsWith('learning-companion:chat:v1:')) {
          throw new DOMException('Synthetic full storage', 'QuotaExceededError');
        }
        write.call(this, key, value);
      };
      Storage.prototype.removeItem = function (key) {
        if (key.startsWith('learning-companion:chat:v1:')) {
          throw new DOMException('Synthetic blocked storage', 'SecurityError');
        }
        remove.call(this, key);
      };
    });
    await page.getByRole('button', { name: 'A new thread', exact: true }).click();
    await expect(page.getByLabel('Conversation status')).toContainText('Device recovery unavailable');
    const composer = page.getByLabel('Your message', { exact: true });
    await composer.fill('My text stays in the live composer.');
    await expect(page.getByText(/Unsent · Device recovery unavailable/)).toBeVisible();
    await expect(composer).toHaveValue('My text stays in the live composer.');
    await expect(composer).toBeEditable();
    const before = await (await request.get(`${control}/control/openai/calls`)).json();
    expect(before.filter((call: { path: string }) => call.path === '/openai/responses')).toHaveLength(0);
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(page.getByLabel('Conversation status')).toContainText('Message and complete reply saved');
    await expect(composer).toHaveValue('');
    const conversation = new URL(page.url()).searchParams.get('conversation');
    expect(await (await page.request.get(`/api/conversations?subject=${subject.id}&conversation=${conversation}`)).json()).toEqual([
      expect.objectContaining({ user_text: 'My text stays in the live composer.', status: 'complete' }),
    ]);
    const after = await (await request.get(`${control}/control/openai/calls`)).json();
    expect(after.filter((call: { path: string }) => call.path === '/openai/responses')).toHaveLength(1);
  } finally {
    await request.post(`${control}/control/openai/reset`);
    await admin().auth.admin.deleteUser(owner.id);
  }
});

test('recovery keeps account and Subject slots separate and preserves source mode and identity on explicit retry', async ({ page, request }) => {
  const owner = await provisionAccount();
  const foreign = await provisionAccount();
  const control = process.env.TEST_AUTH_CONTROL_URL!;
  try {
    await request.post(`${control}/control/openai/reset`);
    await browserSignIn(page, owner.email);
    const a = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Scoped recovery A' } })).json();
    const b = await (await page.request.post('/api/subjects', { headers: origin(), data: { name: 'Scoped recovery B' } })).json();
    const pending = { subject: a.id, conversation: randomUUID(), operation: randomUUID(), text: 'Practise from my approved material.', practice: true };
    await page.goto(`/?subject=${a.id}`);
    await page.evaluate(({ account, foreign, a, b, pending }) => {
      localStorage.setItem(`learning-companion:chat:v1:${foreign}:${a}:new`, JSON.stringify({ text: 'Foreign device text', practice: false, operation: null }));
      localStorage.setItem(`learning-companion:chat:v1:${account}:${a}:new`, JSON.stringify({ text: pending.text, practice: true, operation: pending }));
      localStorage.setItem(`learning-companion:chat:v1:${account}:${b}:new`, JSON.stringify({ text: 'Independent Subject draft', practice: false, operation: null }));
    }, { account: owner.id, foreign: foreign.id, a: a.id, b: b.id, pending });
    await page.goto(`/?subject=${b.id}`);
    const composer = page.getByLabel('Your message', { exact: true });
    const mode = page.getByRole('checkbox', { name: /Use approved sources/ });
    await expect(composer).toHaveValue('Independent Subject draft');
    await expect(mode).not.toBeChecked();
    await expect(composer).toBeEditable();
    await page.goto(`/?subject=${a.id}`);
    await expect(composer).toHaveValue(pending.text);
    await expect(mode).toBeChecked();
    await expect(mode).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Retry same send', exact: true })).toBeVisible();
    expect(await (await page.request.get(`/api/conversations?subject=${a.id}`)).json()).toEqual([]);
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('may incur charges');
      await dialog.dismiss();
    });
    await page.getByRole('button', { name: 'Retry same send', exact: true }).click();
    await expect(composer).toHaveValue(pending.text);
    expect(await (await page.request.get(`/api/conversations?subject=${a.id}`)).json()).toEqual([]);
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('may incur charges');
      await dialog.accept();
    });
    await page.getByRole('button', { name: 'Retry same send', exact: true }).click();
    await expect(page.getByLabel('Conversation status')).toContainText('No approved sources');
    const history = await page.request.get(`/api/conversations?subject=${a.id}&conversation=${pending.conversation}`);
    expect(await history.json()).toEqual([expect.objectContaining({ id: pending.operation, user_text: pending.text, practice: true, status: 'incomplete' })]);
    await page.goto(`/?subject=${b.id}`);
    await expect(composer).toHaveValue('Independent Subject draft');
    const calls = await (await request.get(`${control}/control/openai/calls`)).json();
    expect(calls.filter((call: { path: string }) => call.path === '/openai/responses')).toHaveLength(0);
  } finally {
    await request.post(`${control}/control/openai/reset`);
    await admin().auth.admin.deleteUser(owner.id);
    await admin().auth.admin.deleteUser(foreign.id);
  }
});
