import { z } from 'zod';
import { composerSchema, conversationSubmissionSchema } from '@/lib/conversations/helpers/submission-validation';

export const chatOperationSchema = z.object({
  ...conversationSubmissionSchema.shape,
  text: composerSchema.shape.text,
  practice: z.boolean(),
});

export const chatRecoverySchema = z.object({
  text: z.string(),
  practice: z.boolean(),
  operation: chatOperationSchema.nullable().default(null),
}).refine(value => value.operation === null || (
  value.operation.text === value.text && value.operation.practice === value.practice
));
