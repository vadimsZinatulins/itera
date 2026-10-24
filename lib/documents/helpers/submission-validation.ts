import { z } from 'zod';
import { documentBlockSchema, documentSubjectSchema, learningDocumentSchema } from './validation';

export const documentLimitMessage = 'Invalid Draft or document limit exceeded (300-character title, 5000-character description, 200 blocks, 500 KB blocks).';
export const documentSaveRetryMessage = 'Save failed. Your edits remain here; try again.';
export const documentSaveConflictMessage = 'A newer saved document may exist. Your attempted text is retained. Refresh and review the saved version before trying again.';

export const draftTitleSchema = z.string().refine(value => [...value].length <= 300, 'Use 300 characters or fewer for the title.');
export const draftDescriptionSchema = z.string().refine(value => [...value].length <= 5000, 'Use 5000 characters or fewer for the description.');
export const draftBlocksSchema = z.array(documentBlockSchema.extend({
  id: z.string().refine(value => [...value].length >= 1 && [...value].length <= 80),
})).max(200).refine(blocks => new Set(blocks.map(block => block.id)).size === blocks.length);

// Unknown top-level fields are ignored; extra block fields are retained by the RPC.
// SQL remains the authority for the 500000-byte PostgreSQL JSONB text limit.
// JSON.stringify byte length is not equivalent (spacing, numeric expansion, escapes).
export const documentSubmissionSchema = z.object({
  id: documentSubjectSchema,
  subjectId: documentSubjectSchema,
  revision: z.number().nonnegative().refine(Number.isInteger),
  title: draftTitleSchema,
  description: draftDescriptionSchema,
  blocks: draftBlocksSchema,
});

// Preserve RPC response metadata accepted by the existing POST contract.
export const documentSaveResponseSchema = learningDocumentSchema.loose();
export const documentSaveErrorResponseSchema = z.object({
  error: z.enum([
    'Request not allowed.', 'Sign in required.', 'Draft too large.', 'Invalid Draft.',
    'Subject unavailable.', documentLimitMessage, documentSaveRetryMessage,
    documentSaveConflictMessage, 'Save failed. Check your connection; your edits remain here.',
  ]),
});
