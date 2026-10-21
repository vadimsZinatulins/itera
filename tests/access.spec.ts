import { expect, test } from '@playwright/test';

test('anonymous callers cannot access the application or account endpoint', async ({ request }) => {
  const shell = await request.get('/', { maxRedirects: 0 });
  expect(shell.status()).toBe(307);
  expect(new URL(shell.headers().location, shell.url()).pathname).toBe('/login');
  const account = await request.get('/api/account');
  expect(account.status()).toBe(401);
  expect(await account.json()).toEqual({ error: 'Sign in to continue.' });
});
