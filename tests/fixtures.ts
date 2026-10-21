import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { expect, type APIRequestContext, type Page } from '@playwright/test';

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing test configuration: ${name}`);
  return value;
}
export const apiURL = () => required('TEST_SUPABASE_URL');
export const publicKey = () => required('TEST_SUPABASE_PUBLIC_KEY');
export const admin = () => createClient(apiURL(), required('TEST_SUPABASE_ADMIN_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function provisionAccount() {
  const email = `learner-${randomUUID()}@example.test`;
  const { data, error } = await admin().auth.admin.createUser({ email, email_confirm: true });
  if (error || !data.user) throw new Error(`Could not provision synthetic account (${error?.status ?? 'no status'}/${error?.code ?? 'no code'}).`);
  return { email, id: data.user.id };
}

export async function latestCode(request: APIRequestContext, email: string, after?: string) {
  let messageID = '';
  await expect.poll(async () => {
    const response = await request.get(`${required('TEST_MAIL_URL')}/api/v1/messages`);
    const inbox = await response.json();
    const message = inbox.messages.find((item: { ID: string; To: { Address: string }[] }) =>
      item.ID !== after && item.To.some(recipient => recipient.Address === email));
    messageID = message?.ID ?? '';
    return Boolean(messageID);
  }, { message: 'Expected a local sign-in email', timeout: 10_000 }).toBe(true);
  const response = await request.get(`${required('TEST_MAIL_URL')}/api/v1/message/${messageID}`);
  const message = await response.json();
  const code = message.HTML.match(/<strong>(\d{6})<\/strong>/)?.[1];
  if (!code) throw new Error('Local sign-in email did not contain an OTP.');
  return { code, messageID };
}

export async function browserSignIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  const delivery = page.waitForResponse(response => response.url().endsWith('/api/auth/request'));
  await page.getByRole('button', { name: 'Send code', exact: true }).click();
  expect((await delivery).status()).toBe(200);
  const { code } = await latestCode(page.request, email);
  await page.getByLabel('Email code').fill(code);
  await page.getByRole('button', { name: 'Verify code', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
}
