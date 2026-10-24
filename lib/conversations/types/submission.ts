import type { z } from 'zod';
import type { composerSchema, conversationSubmissionSchema } from '../helpers/submission-validation';

export type ComposerFields = z.infer<typeof composerSchema>;
export type ConversationSubmission = z.infer<typeof conversationSubmissionSchema>;
export type SubmissionError = { code: 'correction' | 'retry'; status: 400 | 413 | 503; message: string };
