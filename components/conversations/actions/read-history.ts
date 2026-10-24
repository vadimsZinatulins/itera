import { conversationTrailSchema } from '@/lib/conversations/helpers/validation';
import type { ConversationReadError, ConversationTrail } from '@/lib/conversations/types';
import type { Result } from '@/lib/types/result';

export async function readTrail(subject: string, signal?: AbortSignal): Promise<Result<ConversationTrail, ConversationReadError>> {
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
