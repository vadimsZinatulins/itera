import 'server-only';
import type { ConversationReadError, ConversationReadFailureKind, ConversationReadFailureStage } from '../types';

export function reportConversationReadFailure(stage: ConversationReadFailureStage, kind: ConversationReadFailureKind) {
  // Closed metadata only: never conversation text, account IDs, upstream objects or causes.
  console.error('Conversations read failed.', { stage, kind });
}

export function conversationReadErrorResponse(error: ConversationReadError) {
  const status = error.code === 'reauthenticate' ? 401 : error.code === 'unavailable' ? error.status : 503;
  return Response.json({ error: error.message }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
