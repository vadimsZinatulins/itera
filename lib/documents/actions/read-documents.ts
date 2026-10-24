import 'server-only';
import { unstable_rethrow } from 'next/navigation';
import { authClient, currentAccount } from '@/lib/auth/server';
import { AccountServiceUnavailable } from '@/lib/auth/availability';
import type { Result } from '@/lib/types/result';
import { reportDocumentReadFailure } from '../helpers/failures';
import { documentListSchema, documentSubjectSchema } from '../helpers/validation';
import type { DocumentList, DocumentReadError, DocumentReadFailureStage } from '../types';

export async function readDocuments(subjectInput: unknown): Promise<Result<DocumentList, DocumentReadError>> {
  let stage: DocumentReadFailureStage = 'authentication';
  try {
    const account = await currentAccount();
    if (!account) {
      return [{ code: 'reauthenticate', message: 'Sign in required.' }, null];
    }
    const subjectId = documentSubjectSchema.safeParse(subjectInput);
    if (!subjectId.success) {
      return [{ code: 'unavailable', status: 400, message: 'Subject unavailable.' }, null];
    }

    stage = 'persistence';
    const client = await authClient();
    const subject = await client.from('subjects').select('id').eq('id', subjectId.data).eq('account_id', account.id).maybeSingle();
    if (subject.error) {
      reportDocumentReadFailure(stage, 'integration-failure');
      return [{ code: 'retry', message: 'Could not load documents.' }, null];
    }
    if (!subject.data) {
      return [{ code: 'unavailable', status: 404, message: 'Subject unavailable.' }, null];
    }

    const { data, error } = await client.from('learning_documents')
      .select('id,subject_id,revision,title,description,blocks,practice_version')
      .eq('account_id', account.id).eq('subject_id', subjectId.data)
      .order('updated_at', { ascending: false });
    if (error) {
      reportDocumentReadFailure(stage, 'integration-failure');
      return [{ code: 'retry', message: 'Could not load documents.' }, null];
    }
    // SQL establishes scalar columns; opaque block/Practice JSON is narrowed here.
    const documents = documentListSchema.safeParse(data);
    if (!documents.success) {
      reportDocumentReadFailure(stage, 'invalid-response');
      return [{ code: 'retry', message: 'Could not load documents.' }, null];
    }
    return [null, documents.data];
  } catch (error) {
    unstable_rethrow(error);
    if (!(error instanceof AccountServiceUnavailable)) {
      reportDocumentReadFailure(stage, 'unexpected');
    }
    return [{ code: 'retry', message: 'Could not load documents. Try again.' }, null];
  }
}
