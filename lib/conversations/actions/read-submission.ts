import 'server-only';
import { unstable_rethrow } from 'next/navigation';
import type { Result } from '@/lib/types/result';
import type { ConversationSubmission, SubmissionError } from '../types/submission';
import { conversationSubmissionSchema, messageTooLarge } from '../helpers/submission-validation';

export async function readSubmission(request: Request): Promise<Result<ConversationSubmission, SubmissionError>> {
  const reader = request.body?.getReader();
  if (!reader) {
    return [{ code: 'correction', status: 400, message: 'Message required.' }, null];
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      size += value.byteLength;
      if (size > 12000) {
        await reader.cancel();
        return [{ code: 'correction', status: 413, message: messageTooLarge }, null];
      }
      chunks.push(value);
    }
  } catch (error) {
    unstable_rethrow(error);
    console.error('Conversation submission unavailable', { operation: 'submission', category: 'transport' });
    return [{ code: 'retry', status: 503, message: 'Send could not be confirmed. Retry the same send to avoid duplication.' }, null];
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let input: unknown;
  try {
    input = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return [{ code: 'correction', status: 400, message: 'Invalid message.' }, null];
  }
  const parsed = conversationSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    // Preserve general field/identity rejection precedence over mode/revision errors.
    const messageInvalid = parsed.error.issues.some(issue => issue.path[0] !== 'practice' && issue.path[0] !== 'assessmentRevision');
    if (messageInvalid) {
      return [{ code: 'correction', status: 400, message: 'Invalid message.' }, null];
    }
    const practiceInvalid = parsed.error.issues.some(issue => issue.path[0] === 'practice');
    return [{ code: 'correction', status: 400, message: practiceInvalid ? 'Invalid practice selection.' : 'Invalid assessment revision.' }, null];
  }
  if (new TextEncoder().encode(parsed.data.text).length > 8000) {
    return [{ code: 'correction', status: 413, message: messageTooLarge }, null];
  }
  return [null, parsed.data];
}
