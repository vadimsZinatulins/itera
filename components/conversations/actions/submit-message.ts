import { z } from 'zod';
import type { Result } from '@/lib/types/result';
import type { ChatOperation } from '@/lib/chat-recovery/types';
import type { SendError } from '../types';

const rejectionSchema = z.object({ error: z.string() });

export async function submitMessage(operation: ChatOperation, signal: AbortSignal): Promise<Result<Response, SendError>> {
  try {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operation),
      signal,
    });
    if (response.ok) {
      return [null, response];
    }
    const correction = response.status >= 400 && response.status < 500;
    let message = 'Send failed. Check the same send to avoid duplication.';
    try {
      const input: unknown = await response.json();
      const parsed = rejectionSchema.safeParse(input);
      if (parsed.success) {
        message = parsed.data.error;
      }
    } catch {
      // A non-JSON rejection still has definitive HTTP save semantics.
    }
    return [{ code: correction ? 'correction' : 'retry', message }, null];
  } catch {
    return [{ code: 'retry', message: 'Check the same send to avoid duplication.' }, null];
  }
}
