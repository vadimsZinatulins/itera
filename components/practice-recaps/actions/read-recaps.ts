import { recapStateSchema } from '@/lib/recaps/helpers/validation';
import type { RecapState } from '@/lib/recaps/types';
import type { Result } from '@/lib/types/result';
import type { RecapLoadError } from '../types';

export async function readRecaps(subject: string, conversation: string, signal?: AbortSignal): Promise<Result<RecapState, RecapLoadError>> {
  try {
    const response = await fetch(`/api/recaps?subject=${subject}&conversation=${conversation}`, { cache: 'no-store', signal });
    if (response.ok) {
      const payload: unknown = await response.json();
      const state = recapStateSchema.safeParse(payload);
      if (state.success) {
        return [null, state.data];
      }
    }
  } catch {
    // A failed browser transport or invalid JSON is an unavailable read, never empty understanding.
  }
  if (signal?.aborted) {
    return [{ code: 'cancelled', message: '' }, null];
  }
  return [{ code: 'retry', message: 'Could not load reviewed understanding.' }, null];
}
