import 'server-only';
import { unstable_rethrow } from 'next/navigation';
import type { Result } from '@/lib/types/result';
import type { CredentialMutationError, CredentialSubmissionPayload } from '../types/credentials';
import { reportCredentialMutationFailure } from '../helpers/credential-failures';

export async function readCredentialSubmission(request: Request): Promise<Result<CredentialSubmissionPayload, CredentialMutationError>> {
  const reader = request.body?.getReader();
  if (!reader) {
    return [{ code: 'correction', status: 400, message: 'Enter a key or select a model.' }, null];
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      size += value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        return [{ code: 'correction', status: 413, message: 'Request too large.' }, null];
      }
      chunks.push(value);
    }
  } catch (error) {
    unstable_rethrow(error);
    reportCredentialMutationFailure('submission', 'unexpected');
    return [{ code: 'retry', status: 503, message: 'AI settings are temporarily unavailable. Try again.' }, null];
  } finally {
    reader.releaseLock();
  }

  let input: unknown;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return [{ code: 'correction', status: 400, message: 'Enter valid settings.' }, null];
  }
  return [null, { input }];
}
