import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { authConfig } from './config';
import { AccountServiceUnavailable, authIsUnavailable } from './availability';

export async function authClient() {
  await connection();
  const store = await cookies();
  const { url, key, cookieOptions } = authConfig();
  return createServerClient(url, key, {
    cookieOptions,
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        // Route handlers can write; rendering cannot. Proxy refreshes before render.
        try {
          values.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch { /* Read-only Server Component. */ }
      },
    },
  });
}

// Always call at the data boundary, not only from a shared layout or Proxy.
export async function currentAccount() {
  const client = await authClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (authIsUnavailable(error)) throw new AccountServiceUnavailable();
  if (error || !user) return null;
  // RLS also checks the live auth.sessions row, so revoked JWTs cannot read data.
  const { data: account, error: accountError } = await client
    .from('learner_accounts').select('id').eq('id', user.id).maybeSingle();
  if (accountError) throw new AccountServiceUnavailable();
  if (!account) return null;
  return { id: user.id, email: user.email };
}
