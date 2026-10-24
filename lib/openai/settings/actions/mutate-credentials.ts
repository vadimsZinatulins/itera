import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { unstable_rethrow } from 'next/navigation';
import { currentAccount } from '@/lib/auth/server';
import { AccountServiceUnavailable } from '@/lib/auth/availability';
import { credentialModels } from '@/lib/openai/server';
import type { Result } from '@/lib/types/result';
import { settingsReadConfigSchema } from '../helpers/validation';
import { credentialSubmissionSchema, storedCredentialSchema } from '../helpers/credential-validation';
import { reportCredentialMutationFailure } from '../helpers/credential-failures';
import type { CredentialMutation, CredentialMutationError, CredentialMutationResponse } from '../types/credentials';

async function mutateCredentials(operation: CredentialMutation): Promise<Result<CredentialMutationResponse, CredentialMutationError>> {
  let account;
  try {
    account = await currentAccount();
  } catch (error) {
    unstable_rethrow(error);
    if (!(error instanceof AccountServiceUnavailable)) {
      reportCredentialMutationFailure('authentication', 'unexpected');
    }
    return [{ code: 'retry', status: 503, message: 'AI settings are temporarily unavailable. Try again.' }, null];
  }
  if (!account) {
    return [{ code: 'reauthenticate', status: 401, message: 'Sign in to manage AI settings.' }, null];
  }

  const submission = operation.method === 'save' ? credentialSubmissionSchema.safeParse(operation.input) : null;
  if (submission !== null && !submission.success) {
    const issues = submission.error.issues;
    if (issues.some(issue => issue.code === 'unrecognized_keys')) {
      return [{ code: 'correction', status: 400, message: 'Unsupported settings field.' }, null];
    }
    if (issues.some(issue => issue.path[0] === 'key')) {
      return [{ code: 'correction', status: 400, message: 'Enter an OpenAI API key beginning with sk-.' }, null];
    }
    return [{ code: 'correction', status: 400, message: 'Enter a key or select a model.' }, null];
  }

  const config = settingsReadConfigSchema.safeParse({
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!config.success) {
    reportCredentialMutationFailure('configuration', 'invalid-configuration');
    return [{ code: 'retry', status: 503, message: 'AI settings are temporarily unavailable. Try again later.' }, null];
  }

  try {
    // The service-role client and full credential remain inside this server operation.
    const client = createClient(config.data.url, config.data.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    if (submission === null) {
      const { error } = await client.rpc('server_openai_remove', { owner_id: account.id });
      if (error) {
        reportCredentialMutationFailure('persistence', 'integration-failure');
        return [{ code: 'retry', status: 503, message: 'Could not remove the key. Try again.' }, null];
      }
      return [null, { hasKey: false, model: null, models: [] }];
    }
    const { data, error: readError } = await client.rpc('server_openai_read', { owner_id: account.id });
    if (readError) {
      reportCredentialMutationFailure('persistence', 'integration-failure');
      return [{ code: 'retry', status: 503, message: 'Could not read AI settings. Try again.' }, null];
    }
    const credentials = storedCredentialSchema.safeParse(data);
    if (!credentials.success) {
      reportCredentialMutationFailure('persistence', 'invalid-response');
      return [{ code: 'retry', status: 503, message: 'Could not read AI settings. Try again.' }, null];
    }

    const saved = credentials.data[0];
    const values = submission.data;
    const key = values.key ?? saved?.api_key;
    if (!key) {
      return [{ code: 'correction', status: 422, message: 'Save an OpenAI key first.' }, null];
    }
    const [providerError, models] = await credentialModels(key);
    if (providerError !== null) {
      return [providerError, null];
    }
    // Preserve model-selection behavior; its migration is a separate slice.
    const model = 'model' in values ? values.model : saved?.model ?? null;
    if (model !== null && (typeof model !== 'string' || !models.some(item => item.id === model))) {
      return [{ code: 'correction', status: 422, message: 'That model is not supported or is unavailable to this key. Refresh models and choose explicitly.' }, null];
    }

    const { error: writeError } = await client.rpc('server_openai_write', { owner_id: account.id, secret: key, selected_model: model });
    if (writeError) {
      reportCredentialMutationFailure('persistence', 'integration-failure');
      return [{ code: 'retry', status: 503, message: 'Could not save AI settings. Try again.' }, null];
    }
    return [null, { hasKey: true, model, models }];
  } catch (error) {
    unstable_rethrow(error);
    reportCredentialMutationFailure('persistence', 'unexpected');
    return [{ code: 'retry', status: 503, message: 'AI settings are temporarily unavailable. Try again.' }, null];
  }
}

export function saveCredentials(input: unknown) {
  return mutateCredentials({ method: 'save', input });
}

export function removeCredentials() {
  return mutateCredentials({ method: 'remove' });
}
