import { conversationHistorySchema, conversationTrailSchema } from '@/lib/conversations/helpers/validation';
import type { ConversationHistory, ConversationTrail } from '@/lib/conversations/types';
import type { Result } from '@/lib/types/result';
import type { BrowserReadError } from '../types';

export async function readTrail(subject: string, signal?: AbortSignal): Promise<Result<ConversationTrail, BrowserReadError>> {
  try {
    const response = await fetch(`/api/conversations?subject=${subject}`, { cache: 'no-store', signal });
    if (response.ok) {
      const data: unknown = await response.json();
      const parsed = conversationTrailSchema.safeParse(data);
      if (parsed.success) {
        return [null, parsed.data];
      }
    }
  } catch {
    // Transport and invalid JSON share the same explicit reload recovery.
  }
  return [{ code: 'retry', message: 'Could not load your trail. Try reloading.' }, null];
}

export async function readHistory(subject: string, conversation: string, signal?: AbortSignal): Promise<Result<ConversationHistory, BrowserReadError>> {
  const message = 'Conversation unavailable. Choose another thread or reload.';
  try {
    const response = await fetch(`/api/conversations?subject=${subject}&conversation=${conversation}`, { cache: 'no-store', signal });
    if (response.status === 404) {
      return [{ code: 'unavailable', message }, null];
    }
    if (response.ok) {
      const data: unknown = await response.json();
      const parsed = conversationHistorySchema.safeParse(data);
      if (parsed.success) {
        return [null, parsed.data];
      }
    }
  } catch {
    // Do not expose an untrusted response or transport error to the learner.
  }
  return [{ code: 'retry', message }, null];
}
