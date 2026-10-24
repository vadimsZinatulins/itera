import 'server-only';
import { unstable_rethrow } from 'next/navigation';
import type { Result } from '@/lib/types/result';
import type { DocumentSaveError, DocumentSubmission } from '../types/submission';
import { documentLimitMessage, documentSubmissionSchema } from '../helpers/submission-validation';
import { reportDocumentSaveFailure } from '../helpers/submission-failures';

export async function readDocumentSubmission(request: Request): Promise<Result<DocumentSubmission, DocumentSaveError>> {
  const reader = request.body?.getReader();
  if (!reader) {
    return [{ code: 'correction', status: 400, message: 'Invalid Draft.' }, null];
  }
  const decoder = new TextDecoder();
  let text = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      text += decoder.decode(value, { stream: !done });
      // Preserve the existing UTF-16 request policy, not an approximate UTF-8 limit.
      if (text.length > 600000) {
        await reader.cancel();
        return [{ code: 'correction', status: 413, message: 'Draft too large.' }, null];
      }
      if (done) {
        break;
      }
    }
  } catch (error) {
    unstable_rethrow(error);
    reportDocumentSaveFailure('submission', 'unexpected');
    return [{ code: 'retry', status: 503, message: 'Save failed. Check your connection; your edits remain here.' }, null];
  } finally {
    reader.releaseLock();
  }

  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return [{ code: 'correction', status: 400, message: 'Invalid Draft.' }, null];
  }
  const submission = documentSubmissionSchema.safeParse(input);
  if (!submission.success) {
    const fieldLimit = submission.error.issues.some(issue =>
      issue.path[0] === 'title' && issue.code === 'custom'
      || issue.path[0] === 'description' && issue.code === 'custom'
      || issue.path[0] === 'blocks' && !(issue.path.length === 1 && issue.code === 'invalid_type'));
    return [{ code: 'correction', status: 400, message: fieldLimit ? documentLimitMessage : 'Invalid Draft.' }, null];
  }
  return [null, submission.data];
}
