import type { z } from 'zod';
import type { conversationHistorySchema, conversationTrailSchema } from '../helpers/validation';

export type ConversationTrail = z.output<typeof conversationTrailSchema>;
export type ConversationHistory = z.output<typeof conversationHistorySchema>;
export type ConversationReadError =
  | { code: 'reauthenticate'; message: 'Sign in required.' }
  | { code: 'unavailable'; status: 400 | 404; message: 'Invalid conversation scope.' | 'Subject unavailable.' | 'Conversation unavailable.' }
  | { code: 'retry'; message: 'Could not load trail.' | 'Could not load conversation.' | 'Could not load conversations. Try again.' };
export type ConversationReadFailureStage = 'authentication' | 'persistence';
export type ConversationReadFailureKind = 'integration-failure' | 'invalid-response' | 'unexpected';
