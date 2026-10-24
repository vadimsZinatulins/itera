import type { z } from 'zod';
import type { conversationTrailSchema } from '../helpers/validation';

export type ConversationTrail = z.output<typeof conversationTrailSchema>;
export type ConversationReadError = { code: 'retry'; message: string };
