import { z } from 'zod';

// Preserve the route's UUID policy, without imposing a version restriction.
export const recapIdSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
export const recapScopeSchema = z.object({ subject: recapIdSchema, conversation: recapIdSchema });

// Match valid_recap's four nonblank fields and UTF-8 limits without normalizing stored text.
const interpretationFieldSchema = z.string().refine(value => /[^ ]/.test(value) && new TextEncoder().encode(value).byteLength <= 1200);
export const interpretationSchema = z.strictObject({
  text: interpretationFieldSchema,
  difficulty: interpretationFieldSchema,
  assistance: interpretationFieldSchema,
  uncertainty: interpretationFieldSchema,
});
export const recapSourceSchema = z.looseObject({
  id: recapIdSchema,
  title: z.string(),
  revision: z.number().int().positive(),
});
export const recapSchema = z.looseObject({
  id: recapIdSchema,
  account_id: recapIdSchema,
  subject_id: recapIdSchema,
  conversation_id: recapIdSchema,
  revision: z.number().int().nonnegative(),
  coverage_from: z.number().int().positive(),
  coverage_to: z.number().int().positive(),
  sources: z.array(recapSourceSchema),
  proposal: interpretationSchema.nullable(),
  status: z.enum(['pending', 'proposed', 'accepted', 'corrected', 'dismissed']),
  created_at: z.string(),
});
export const observationSchema = z.looseObject({
  id: recapIdSchema,
  account_id: recapIdSchema,
  subject_id: recapIdSchema,
  conversation_id: recapIdSchema.nullable(),
  origin_conversation_id: recapIdSchema,
  coverage_from: z.number().int().positive(),
  coverage_to: z.number().int().positive(),
  sources: z.array(recapSourceSchema),
  observation: interpretationSchema,
  review: z.enum(['accepted', 'corrected']),
  created_at: z.string(),
});
export const recapListSchema = z.array(recapSchema);
export const observationListSchema = z.array(observationSchema);
export const recapCoverageSchema = z.object({ through_ordinal: z.number().int().nonnegative() }).nullable();
export const recapDocumentsSchema = z.array(z.object({ id: recapIdSchema }));
export const reviewedObservationSchema = observationSchema.extend({
  sources: z.array(recapSourceSchema.extend({ deleted: z.boolean() })),
});
export const recapStateSchema = z.object({
  recaps: recapListSchema,
  observations: z.array(reviewedObservationSchema),
  through: z.number().int().nonnegative(),
});
