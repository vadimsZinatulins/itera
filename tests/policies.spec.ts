import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import { admin, apiURL, latestCode, provisionAccount, publicKey } from './fixtures';

test('public signup is disabled at the provider and login cannot create an account', async ({ request }) => {
  const email = `unknown-${randomUUID()}@example.test`;
  const client = createClient(apiURL(), publicKey(), { auth: { persistSession: false } });
  const signup = await client.auth.signUp({ email, password: randomUUID() });
  expect(signup.error?.code).toBe('signup_disabled');
  const otp = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  expect(otp.error).not.toBeNull();
  const origin = process.env.TEST_BASE_URL!;
  const response = await request.post('/api/auth/request', { headers: { origin }, data: { email, shouldCreateUser: true } });
  expect(response.status()).toBe(200);
  const verify = await request.post('/api/auth/verify', { headers: { origin }, data: { email, code: '000000' } });
  expect(verify.status()).toBe(401);
  // Public request fields cannot turn on delivery controls or demo authentication.
  expect((await request.get('/api/test/mail')).status()).toBe(404);
  expect((await request.get('/?demo=true&email=owner@example.test', { maxRedirects: 0 })).status()).toBe(307);
});

test('direct data requests are account-private and revoked tokens lose access immediately', async ({ request }) => {
  const first = await provisionAccount();
  const second = await provisionAccount();
  try {
    const anonymous = await request.get(`${apiURL()}/rest/v1/learner_accounts?select=id`, { headers: { apikey: publicKey() } });
    expect([401, 403]).toContain(anonymous.status());
    const client = createClient(apiURL(), publicKey(), { auth: { persistSession: false, autoRefreshToken: false } });
    const sent = await client.auth.signInWithOtp({ email: first.email, options: { shouldCreateUser: false } });
    expect(sent.error).toBeNull();
    const { code } = await latestCode(request, first.email);
    const verified = await client.auth.verifyOtp({ email: first.email, token: code, type: 'email' });
    if (!verified.data.session) throw new Error('Synthetic sign-in failed.');
    const headers = { apikey: publicKey(), Authorization: `Bearer ${verified.data.session.access_token}` };
    const own = await request.get(`${apiURL()}/rest/v1/learner_accounts?select=id`, { headers });
    expect(await own.json()).toEqual([{ id: first.id }]);
    const other = await request.get(`${apiURL()}/rest/v1/learner_accounts?id=eq.${second.id}&select=id`, { headers });
    expect(await other.json()).toEqual([]);
    const change = await request.patch(`${apiURL()}/rest/v1/learner_accounts?id=eq.${second.id}`, { headers, data: { id: first.id } });
    expect([401, 403]).toContain(change.status());
    const insert = await request.post(`${apiURL()}/rest/v1/learner_accounts`, { headers, data: { id: second.id } });
    expect([401, 403]).toContain(insert.status());
    expect((await client.auth.signOut({ scope: 'local' })).error).toBeNull();
    const revoked = await request.get(`${apiURL()}/rest/v1/learner_accounts?select=id`, { headers });
    expect(await revoked.json()).toEqual([]);
  } finally {
    await admin().auth.admin.deleteUser(first.id);
    await admin().auth.admin.deleteUser(second.id);
  }
});

test('auth mutations reject cross-origin and missing-origin requests', async ({ request }) => {
  for (const operation of ['request', 'verify', 'logout']) {
    expect((await request.post(`/api/auth/${operation}`, { data: {} })).status()).toBe(403);
    expect((await request.post(`/api/auth/${operation}`, { headers: { origin: 'https://attacker.example' }, data: {} })).status()).toBe(403);
  }
});
