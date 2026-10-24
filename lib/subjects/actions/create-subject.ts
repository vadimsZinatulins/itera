import 'server-only';
import { unstable_rethrow } from 'next/navigation';
import { authClient, currentAccount } from '@/lib/auth/server';
import { AccountServiceUnavailable } from '@/lib/auth/availability';
import type { Result } from '@/lib/types/result';
import { reportSubjectCreationFailure } from '../helpers/failures';
import { createdSubjectSchema, subjectSubmissionSchema } from '../helpers/validation';
import type { CreatedSubject, SubjectCreationError } from '../types';

export async function createSubject(request: Request): Promise<Result<CreatedSubject, SubjectCreationError>> {
  let account;
  try {
    account = await currentAccount();
  } catch (error) {
    unstable_rethrow(error);
    if (!(error instanceof AccountServiceUnavailable)) {
      reportSubjectCreationFailure('authentication', 'unexpected');
    }
    return [{ code: 'retry', message: 'Could not save the Subject. Check your connection and try again.' }, null];
  }
  if (!account) {
    return [{ code: 'reauthenticate', message: 'Sign in to create a Subject.' }, null];
  }

  let text;
  try {
    text = await request.text();
  } catch (error) {
    unstable_rethrow(error);
    reportSubjectCreationFailure('submission', 'unexpected');
    return [{ code: 'retry', message: 'Could not save the Subject. Check your connection and try again.' }, null];
  }
  // This endpoint's established request limit counts UTF-16 units, not UTF-8 bytes.
  if (text.length > 2048) {
    return [{ code: 'too-large', message: 'Request too large.' }, null];
  }
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return [{ code: 'correction', status: 400, message: 'Enter a Subject name.' }, null];
  }
  const submission = subjectSubmissionSchema.safeParse(input);
  if (!submission.success) {
    const message = submission.error.issues[0]?.message === 'Use 80 characters or fewer.'
      ? 'Use 80 characters or fewer.' : 'Enter a Subject name.';
    return [{ code: 'correction', status: 400, message }, null];
  }

  try {
    const client = await authClient();
    // The schema strips extras; ownership always comes from the authenticated account.
    const { data, error } = await client.from('subjects')
      .insert({ name: submission.data.name, account_id: account.id }).select('id,name').single();
    if (error?.code === '23505') {
      return [{ code: 'correction', status: 409, message: 'A Subject with this name already exists.' }, null];
    }
    if (error) {
      reportSubjectCreationFailure('persistence', 'integration-failure');
      return [{ code: 'retry', message: 'Could not save the Subject. Try again.' }, null];
    }
    const created = createdSubjectSchema.safeParse(data);
    if (!created.success) {
      reportSubjectCreationFailure('persistence', 'invalid-response');
      return [{ code: 'retry', message: 'Could not save the Subject. Try again.' }, null];
    }
    return [null, created.data];
  } catch (error) {
    unstable_rethrow(error);
    reportSubjectCreationFailure('persistence', 'unexpected');
    return [{ code: 'retry', message: 'Could not save the Subject. Check your connection and try again.' }, null];
  }
}
