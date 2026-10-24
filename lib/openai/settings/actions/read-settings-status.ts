import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { unstable_rethrow } from 'next/navigation';
import { currentAccount } from '@/lib/auth/server';
import { AccountServiceUnavailable } from '@/lib/auth/availability';
import type { Result } from '@/lib/types/result';
import { reportSettingsReadFailure } from '../helpers/failures';
import { settingsReadConfigSchema, settingsStatusSchema } from '../helpers/validation';
import type { SettingsReadError, SettingsStatus } from '../types';

export async function readSettingsStatus(): Promise<Result<SettingsStatus, SettingsReadError>> {
  let account;
  try {
    account = await currentAccount();
  } catch (error) {
    unstable_rethrow(error);
    if (!(error instanceof AccountServiceUnavailable)) {
      reportSettingsReadFailure('authentication', 'unexpected');
    }
    return [{ code: 'retry', message: 'AI settings are temporarily unavailable. Try again.' }, null];
  }

  if (!account) {
    return [{ code: 'reauthenticate', message: 'Sign in to manage AI settings.' }, null];
  }

  const config = settingsReadConfigSchema.safeParse({
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!config.success) {
    reportSettingsReadFailure('configuration', 'invalid-configuration');
    return [{ code: 'retry', message: 'AI settings are temporarily unavailable. Try again.' }, null];
  }

  try {
    // Isolated service-role access: never export this client or its native result.
    const client = createClient(config.data.url, config.data.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.rpc('server_openai_read', { owner_id: account.id });
    if (error) {
      reportSettingsReadFailure('persistence', 'integration-failure');
      return [{ code: 'retry', message: 'Could not read AI settings. Try again.' }, null];
    }

    const status = settingsStatusSchema.safeParse(data);
    if (!status.success) {
      reportSettingsReadFailure('persistence', 'invalid-response');
      return [{ code: 'retry', message: 'Could not read AI settings. Try again.' }, null];
    }

    // Page loads never call OpenAI, including during provider outages.
    return [null, status.data];
  } catch (error) {
    unstable_rethrow(error);
    reportSettingsReadFailure('persistence', 'unexpected');
    return [{ code: 'retry', message: 'AI settings are temporarily unavailable. Try again.' }, null];
  }
}
