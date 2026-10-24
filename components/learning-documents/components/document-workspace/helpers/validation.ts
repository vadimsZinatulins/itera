import { z } from 'zod';
import { learningDocumentSchema } from '@/lib/documents/helpers/validation';
import { draftTitleSchema, draftDescriptionSchema, draftBlocksSchema } from '@/lib/documents/helpers/submission-validation';

export const editorDraftSchema = learningDocumentSchema.extend({
  revision: z.number().int().nonnegative(),
  title: draftTitleSchema,
  description: draftDescriptionSchema,
  blocks: draftBlocksSchema,
});

export const documentEditorSchema = z.object({
  draft: editorDraftSchema.nullable(),
  editing: z.record(z.string(), z.string()),
});
