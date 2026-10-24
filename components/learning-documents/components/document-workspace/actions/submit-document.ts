import type { Result } from '@/lib/types/result';
import type { LearningDocument } from '@/lib/documents/types';
import type { DocumentSaveError, DocumentSubmission } from '@/lib/documents/types/submission';
import { documentSaveConflictMessage, documentSaveErrorResponseSchema, documentSaveResponseSchema, documentSaveRetryMessage } from '@/lib/documents/helpers/submission-validation';

export async function submitDocument(submission: DocumentSubmission): Promise<Result<LearningDocument, DocumentSaveError>> {
  try {
    const response = await fetch('/api/documents', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submission),
    });
    const input: unknown = await response.json();
    if (!response.ok) {
      const failure = documentSaveErrorResponseSchema.safeParse(input);
      const message = failure.success ? failure.data.error : documentSaveRetryMessage;
      if (response.status === 401) {
        return [{ code: 'reauthenticate', status: 401, message }, null];
      }
      if (response.status === 409) {
        return [{ code: 'conflict', status: 409, message: failure.success ? message : documentSaveConflictMessage }, null];
      }
      if (response.status === 400 || response.status === 403 || response.status === 413) {
        return [{ code: 'correction', status: response.status, message }, null];
      }
      return [{ code: 'retry', status: 503, message }, null];
    }
    const saved = documentSaveResponseSchema.safeParse(input);
    if (!saved.success || saved.data.id.toLowerCase() !== submission.id.toLowerCase() || saved.data.subject_id.toLowerCase() !== submission.subjectId.toLowerCase() || saved.data.revision !== submission.revision + 1) {
      return [{ code: 'retry', status: 503, message: documentSaveRetryMessage }, null];
    }
    return [null, saved.data];
  } catch {
    return [{ code: 'retry', status: 503, message: 'Save failed. Check your connection; your edits remain here.' }, null];
  }
}
