import { z } from 'zod';
import { conversationIdSchema } from './validation';

export const messageTooLarge = 'Message too large (8,000 UTF-8 bytes maximum).';
const messageTextSchema = z.string().refine(text => text.trim().length > 0, 'Message required.');
export const composerSchema = z.object({
  text: messageTextSchema.refine(text => new TextEncoder().encode(text).length <= 8000, messageTooLarge),
  practice: z.boolean(),
});

export const conversationSubmissionSchema = z.strictObject({
  subject: conversationIdSchema,
  conversation: conversationIdSchema,
  operation: conversationIdSchema,
  text: messageTextSchema,
  practice: z.boolean().default(false),
  assessmentRevision: z.number().int().nonnegative().optional(),
});
