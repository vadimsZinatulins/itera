import { documentListSchema } from '@/lib/documents/helpers/validation';
import type { DocumentList, DocumentReadError } from '@/lib/documents/types';
import type { Result } from '@/lib/types/result';

export async function readDocuments(subjectId: string): Promise<Result<DocumentList, DocumentReadError>> {
  try {
    const response = await fetch(`/api/documents?subject=${subjectId}`);
    if (response.status === 401) {
      return [{ code: 'reauthenticate', message: 'Sign in required.' }, null];
    }
    if (!response.ok) {
      return [{ code: 'retry', message: 'Could not load documents. Reload to try again.' }, null];
    }
    const input: unknown = await response.json();
    const documents = documentListSchema.safeParse(input);
    if (!documents.success) {
      return [{ code: 'retry', message: 'Could not load documents. Reload to try again.' }, null];
    }
    return [null, documents.data];
  } catch {
    return [{ code: 'retry', message: 'Could not load documents. Reload to try again.' }, null];
  }
}
