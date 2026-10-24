import { z } from 'zod';

// Match the route's established UUID policy, including non-versioned operation IDs.
export const conversationIdSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

export const conversationScopeSchema = z.object({
  subject: conversationIdSchema,
  conversation: conversationIdSchema.nullable(),
});

export const conversationTrailSchema = z.array(z.object({
  id: conversationIdSchema,
  title: z.string(),
  created_at: z.string(),
}));

const difficultySchema = z.enum(['easy', 'medium', 'hard']);
const assessmentQuestionSchema = z.looseObject({
  id: conversationIdSchema,
  number: z.number().int(),
  question: z.string(),
  difficulty: difficultySchema,
  status: z.enum(['open', 'answered', 'skipped']),
  assistance: z.array(z.enum(['hint', 'explanation'])),
});
const assessmentSchema = z.looseObject({
  revision: z.number().int(),
  topic: z.string(),
  requested_difficulty: difficultySchema.nullable(),
  current_question: assessmentQuestionSchema.nullable(),
  opened: z.number().int(),
  answered: z.number().int(),
  skipped: z.number().int(),
  budget: z.looseObject({
    minutes: z.number(),
    started_at: z.string(),
    continued: z.boolean(),
  }).nullable().optional(),
});
const sourceSchema = z.looseObject({
  id: conversationIdSchema,
  title: z.string(),
  revision: z.number().int(),
});

// Keep the full persisted snapshots, including fields not rendered by the transcript.
export const conversationHistorySchema = z.array(z.object({
  id: conversationIdSchema,
  ordinal: z.number().int(),
  user_text: z.string(),
  assistant_text: z.string(),
  status: z.enum(['complete', 'incomplete']),
  pending_until: z.string(),
  practice: z.boolean().optional(),
  sources: z.array(sourceSchema).optional(),
  assessment: assessmentSchema.nullable().optional(),
}));
