import 'server-only';
import { unstable_rethrow } from 'next/navigation';
import { authClient, currentAccount } from '@/lib/auth/server';
import { AccountServiceUnavailable } from '@/lib/auth/availability';
import type { Result } from '@/lib/types/result';
import type { LearningDocument } from '../types';
import type { DocumentSaveError, DocumentSaveFailureStage } from '../types/submission';
import { documentLimitMessage, documentSaveConflictMessage, documentSaveResponseSchema, documentSaveRetryMessage } from '../helpers/submission-validation';
import { reportDocumentSaveFailure } from '../helpers/submission-failures';
import { readDocumentSubmission } from './read-submission';

export async function saveDocument(request: Request): Promise<Result<LearningDocument, DocumentSaveError>> {
  let stage: DocumentSaveFailureStage = 'authentication';
  try {
    if (!await currentAccount()) {
      return [{ code: 'reauthenticate', status: 401, message: 'Sign in required.' }, null];
    }

    stage = 'submission';
    const [submissionError, submission] = await readDocumentSubmission(request);
    if (submissionError !== null) {
      return [submissionError, null];
    }

    stage = 'persistence';
    const client = await authClient();
    const { data, error } = await client.rpc('save_learning_document', {
      p_id: submission.id, p_subject_id: submission.subjectId, p_revision: submission.revision,
      p_title: submission.title, p_description: submission.description, p_blocks: submission.blocks,
    });
    if (error?.code === '40001') {
      return [{ code: 'conflict', status: 409, message: documentSaveConflictMessage }, null];
    }
    if (error?.code === '42501') {
      return [{ code: 'correction', status: 403, message: 'Subject unavailable.' }, null];
    }
    if (error?.code === '22023') {
      return [{ code: 'correction', status: 400, message: documentLimitMessage }, null];
    }
    if (error) {
      reportDocumentSaveFailure(stage, 'integration-failure');
      return [{ code: 'retry', status: 503, message: documentSaveRetryMessage }, null];
    }
    const saved = documentSaveResponseSchema.safeParse(data);
    if (!saved.success || saved.data.id.toLowerCase() !== submission.id.toLowerCase() || saved.data.subject_id.toLowerCase() !== submission.subjectId.toLowerCase() || saved.data.revision !== submission.revision + 1) {
      reportDocumentSaveFailure(stage, 'invalid-response');
      return [{ code: 'retry', status: 503, message: documentSaveRetryMessage }, null];
    }
    return [null, saved.data];
  } catch (error) {
    unstable_rethrow(error);
    if (!(error instanceof AccountServiceUnavailable)) {
      reportDocumentSaveFailure(stage, 'unexpected');
    }
    return [{ code: 'retry', status: 503, message: 'Save failed. Check your connection; your edits remain here.' }, null];
  }
}
