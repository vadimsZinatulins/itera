import 'server-only';
import type { AuthError } from '@supabase/supabase-js';

export class AccountServiceUnavailable extends Error {
  constructor() { super('Account service is temporarily unavailable. Try again.'); }
}

export function authIsUnavailable(error: AuthError | null) {
  return Boolean(error && (!error.status || error.status >= 500 || error.status === 429));
}
