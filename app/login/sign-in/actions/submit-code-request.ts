import type { Result } from '@/lib/types/result';
import { codeRequestErrorResponseSchema, codeRequestResponseSchema } from '@/lib/auth/request-code/helpers/validation';
import type { CodeRequestError, CodeRequestSubmission } from '@/lib/auth/request-code/types';

export async function submitCodeRequest(submission: CodeRequestSubmission): Promise<Result<CodeRequestSubmission, CodeRequestError>> {
  let response;
  try {
    response = await fetch('/api/auth/request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
  } catch {
    return [{ code: 'retry', message: 'Could not connect. Check your connection and try again.' }, null];
  }

  let input: unknown;
  try {
    input = await response.json();
  } catch {
    return [{ code: 'retry', message: 'Could not send a code. Try again in a moment.' }, null];
  }
  if (!response.ok) {
    const failure = codeRequestErrorResponseSchema.safeParse(input);
    const message = failure.success ? failure.data.error : 'Could not send a code. Try again in a moment.';
    if (response.status === 400) {
      return [{ code: 'correction', message }, null];
    }
    if (response.status === 413) {
      return [{ code: 'too-large', message }, null];
    }
    if (response.status === 429) {
      return [{ code: 'rate-limited', message }, null];
    }
    return [{ code: 'retry', message }, null];
  }
  const acknowledgement = codeRequestResponseSchema.safeParse(input);
  if (!acknowledgement.success) {
    return [{ code: 'retry', message: 'Could not send a code. Try again in a moment.' }, null];
  }
  return [null, submission];
}
