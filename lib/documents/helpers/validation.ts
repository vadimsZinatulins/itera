import { z } from 'zod';

// Match the existing route UUID policy, including UUIDs without a version restriction.
export const documentSubjectSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

// Blocks are persisted JSON; retain additional fields accepted by the save RPC.
export const documentBlockSchema = z.looseObject({
  id: z.string().min(1),
  markdown: z.string(),
});

export const documentSnapshotSchema = z.object({
  revision: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  blocks: z.array(documentBlockSchema),
});

export const learningDocumentSchema = documentSnapshotSchema.extend({
  id: documentSubjectSchema,
  subject_id: documentSubjectSchema,
  practice_version: documentSnapshotSchema.nullish(),
});

export const documentListSchema = z.array(learningDocumentSchema);
