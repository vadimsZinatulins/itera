import type { Result } from '@/lib/types/result';
import { credentialErrorResponseSchema, credentialMutationResponseSchema } from '@/lib/openai/settings/helpers/credential-validation';
import type { CredentialFormSubmission, CredentialMutationResponse } from '@/lib/openai/settings/types/credentials';
import type { CredentialClientError } from '../types';

export async function submitCredentialMutation(method: 'PUT' | 'DELETE', submission?: CredentialFormSubmission): Promise<Result<CredentialMutationResponse, CredentialClientError>> {
  try {
    const response = await fetch('/api/settings/openai', {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(submission ? { body: JSON.stringify(submission) } : {}),
    });
    const input: unknown = await response.json();
    if (!response.ok) {
      const failure = credentialErrorResponseSchema.safeParse(input);
      const message = failure.success ? failure.data.error : 'Could not update AI settings.';
      if (response.status === 401) {
        return [{ code: 'reauthenticate', message }, null];
      }
      if (response.status === 400 || response.status === 413 || response.status === 422) {
        return [{ code: 'correction', message }, null];
      }
      return [{ code: 'retry', message }, null];
    }
    const status = credentialMutationResponseSchema.safeParse(input);
    if (!status.success || status.data.hasKey !== (method === 'PUT')) {
      return [{ code: 'retry', message: 'Could not update AI settings.' }, null];
    }
    return [null, status.data];
  } catch {
    return [{ code: 'retry', message: 'Could not reach settings. Check your connection and reload to verify saved state.' }, null];
  }
}
