import type { Result } from '@/lib/types/result';
import { createdSubjectSchema, subjectErrorResponseSchema } from '@/lib/subjects/helpers/validation';
import type { CreatedSubject, SubjectCreationError, SubjectSubmission } from '@/lib/subjects/types';

export async function submitSubject(submission: SubjectSubmission): Promise<Result<CreatedSubject, SubjectCreationError>> {
  try {
    const response = await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    const input: unknown = await response.json();
    if (!response.ok) {
      const failure = subjectErrorResponseSchema.safeParse(input);
      const message = failure.success ? failure.data.error : 'Could not save the Subject. Try again.';
      if (response.status === 400 || response.status === 409) {
        return [{ code: 'correction', status: response.status, message }, null];
      }
      if (response.status === 401) {
        return [{ code: 'reauthenticate', message }, null];
      }
      if (response.status === 413) {
        return [{ code: 'too-large', message }, null];
      }
      return [{ code: 'retry', message }, null];
    }
    const created = createdSubjectSchema.safeParse(input);
    if (!created.success) {
      return [{ code: 'retry', message: 'Could not save the Subject. Try again.' }, null];
    }
    return [null, created.data];
  } catch {
    return [{ code: 'retry', message: 'Could not save the Subject. Check your connection and try again.' }, null];
  }
}
