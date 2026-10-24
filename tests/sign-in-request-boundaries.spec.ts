import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { admin, latestCode, provisionAccount } from './fixtures';

test('code requests preserve normalized delivery, ignored extras and the UTF-16 request boundary', async ({ request }) => {
  const learner = await provisionAccount();
  const origin = process.env.TEST_BASE_URL!;
  try {
    const input = {
      email: `\ufeff\u00a0\t${learner.email.toUpperCase()}\n\u00a0`,
      shouldCreateUser: true,
      code: 'not-a-verification',
      padding: '',
    };
    const base = JSON.stringify(input);
    const exact = JSON.stringify({ ...input, padding: 'é'.repeat(2048 - base.length) });
    expect(exact.length).toBe(2048);
    expect(Buffer.byteLength(exact, 'utf8')).toBeGreaterThan(2048);
    const response = await request.post('/api/auth/request', {
      headers: { origin, 'Content-Type': 'application/json' }, data: exact,
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(await response.json()).toEqual({ ok: true });
    const { code } = await latestCode(request, learner.email);
    const verified = await request.post('/api/auth/verify', { headers: { origin }, data: { email: learner.email, code } });
    expect(verified.status()).toBe(200);
    expect(await (await request.get('/api/account')).json()).toEqual({ id: learner.id });

    const tooLarge = await request.post('/api/auth/request', {
      headers: { origin, 'Content-Type': 'application/json' }, data: `${exact} `,
    });
    expect(tooLarge.status()).toBe(413);
    expect(await tooLarge.json()).toEqual({ error: 'Request too large.' });
  } finally {
    await admin().auth.admin.deleteUser(learner.id);
  }
});

test('code requests reject malformed public input without exposing it or requiring browser validation', async ({ request }) => {
  const origin = process.env.TEST_BASE_URL!;
  const invalid = [
    'null', '[]', '["email@example.test"]', '42', 'true', '"email@example.test"',
    '{}', '{"email":null}', '{"email":42}', '{"email":[]}', '{"email":{}}',
    '{"email":""}', '{"email":"missing-at"}', '{"email":"a@b"}', '{"email":"a b@example.test"}',
    JSON.stringify({ email: `${'a'.repeat(242)}@example.test` }),
  ];
  for (const data of invalid) {
    const response = await request.post('/api/auth/request', { headers: { origin, 'Content-Type': 'application/json' }, data });
    expect(response.status()).toBe(400);
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(await response.json()).toEqual({ error: 'Enter a valid email address.' });
  }
  const malformed = await request.post('/api/auth/request', { headers: { origin, 'Content-Type': 'application/json' }, data: Buffer.from('{', 'utf8') });
  expect(malformed.status()).toBe(400);
  expect(await malformed.json()).toEqual({ error: 'Enter a valid request.' });
});

test('code requests keep the normalized 254-character email limit and enumeration-safe acknowledgement', async ({ request }) => {
  const origin = process.env.TEST_BASE_URL!;
  const email = `${randomUUID()}${'a'.repeat(28)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(56)}.test`;
  expect(email.length).toBe(254);
  const response = await request.post('/api/auth/request', { headers: { origin }, data: { email: `  ${email.toUpperCase()}  `, shouldCreateUser: true } });
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  const rejected = await request.post('/api/auth/request', { headers: { origin }, data: { email: `x${email}` } });
  expect(rejected.status()).toBe(400);
  expect(await rejected.json()).toEqual({ error: 'Enter a valid email address.' });
});
