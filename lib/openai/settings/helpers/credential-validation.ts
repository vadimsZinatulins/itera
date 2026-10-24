import { z } from 'zod';

export const credentialKeySchema = z.string({ error: 'Enter an OpenAI API key beginning with sk-.' })
  .regex(/^sk-[A-Za-z0-9_-]{8,500}$/, 'Enter an OpenAI API key beginning with sk-.');

export const credentialSubmissionSchema = z.strictObject({
  key: credentialKeySchema.optional(),
  // Model selection keeps its existing access-dependent validation until its own slice.
  model: z.unknown().optional(),
});

export const credentialFormSchema = z.object({ key: credentialKeySchema });

export const storedCredentialSchema = z.array(z.object({
  api_key: z.string(),
  model: z.string().nullable(),
})).max(1);

export const credentialModelSchema = z.object({ id: z.string(), name: z.string() });
export const credentialMutationResponseSchema = z.discriminatedUnion('hasKey', [
  z.object({ hasKey: z.literal(true), model: z.string().nullable(), models: z.array(credentialModelSchema) }),
  z.object({ hasKey: z.literal(false), model: z.null(), models: z.array(credentialModelSchema).max(0) }),
]);

export const credentialErrorMessageSchema = z.enum([
  'Enter a key or select a model.',
  'Unsupported settings field.',
  'Enter an OpenAI API key beginning with sk-.',
  'Save an OpenAI key first.',
  'That model is not supported or is unavailable to this key. Refresh models and choose explicitly.',
  'Request not allowed.',
  'Request too large.',
  'Enter valid settings.',
  'Sign in to manage AI settings.',
  'AI settings are temporarily unavailable. Try again later.',
  'AI settings are temporarily unavailable. Try again.',
  'Could not read AI settings. Try again.',
  'Could not save AI settings. Try again.',
  'Could not remove the key. Try again.',
  'OpenAI could not be reached in time. Retry explicitly; a generation retry may incur another charge.',
  'OpenAI rejected the key. Replace it with a valid API key.',
  'OpenAI denied access. Check key permissions and model access.',
  'The selected model is unavailable. Refresh models and explicitly choose an available model.',
  'OpenAI quota or rate limit reached. Check API billing and limits before retrying.',
  'OpenAI could not complete this request. Check model access and request limits before retrying.',
  'OpenAI returned an unreadable response. Try again later.',
  'Could not read OpenAI model access. Try again later.',
]);

export const credentialErrorResponseSchema = z.object({ error: credentialErrorMessageSchema });
