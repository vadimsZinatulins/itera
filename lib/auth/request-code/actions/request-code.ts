import 'server-only';
import { unstable_rethrow } from 'next/navigation';
import { authClient } from '@/lib/auth/server';
import type { Result } from '@/lib/types/result';
import { reportCodeRequestFailure } from '../helpers/failures';
import { codeRequestSubmissionSchema } from '../helpers/validation';
import type { CodeRequestError, CodeRequestResponse } from '../types';

export async function requestCode(request: Request): Promise<Result<CodeRequestResponse, CodeRequestError>> {
  let text;
  try {
    text = await request.text();
  } catch (error) {
    unstable_rethrow(error);
    reportCodeRequestFailure('submission', 'unexpected');
    return [{ code: 'retry', message: 'Could not complete the request. Check your connection and try again.' }, null];
  }
  // Preserve this endpoint's existing UTF-16-unit limit, not a UTF-8 byte limit.
  if (text.length > 2048) {
    return [{ code: 'too-large', message: 'Request too large.' }, null];
  }
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return [{ code: 'correction', message: 'Enter a valid request.' }, null];
  }
  const submission = codeRequestSubmissionSchema.safeParse(input);
  if (!submission.success) {
    return [{ code: 'correction', message: 'Enter a valid email address.' }, null];
  }

  try {
    const client = await authClient();
    const { error } = await client.auth.signInWithOtp({
      email: submission.data.email,
      options: { shouldCreateUser: false },
    });
    // Unknown accounts get the same acknowledgement; the provider also disables signup.
    if (error && !['user_not_found', 'signup_disabled', 'otp_disabled'].includes(error.code ?? '')) {
      if (error.status === 429) {
        return [{ code: 'rate-limited', message: 'Too many requests. Wait a moment before requesting another code.' }, null];
      }
      reportCodeRequestFailure('delivery', 'integration-failure');
      return [{ code: 'retry', message: 'Could not send a code. Try again in a moment.' }, null];
    }
    return [null, { ok: true }];
  } catch (error) {
    unstable_rethrow(error);
    reportCodeRequestFailure('delivery', 'unexpected');
    return [{ code: 'retry', message: 'Could not complete the request. Check your connection and try again.' }, null];
  }
}
