import { z } from 'zod';

export const codeRequestSubmissionSchema = z.object({
  // Preserve the endpoint's email policy; Zod's built-in email format is stricter.
  email: z.string({ error: 'Enter a valid email address.' }).trim().toLowerCase()
    .max(254, 'Enter a valid email address.')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.'),
});

export const codeRequestResponseSchema = z.object({ ok: z.literal(true) });

export const codeRequestErrorResponseSchema = z.object({
  error: z.enum([
    'Enter a valid request.',
    'Enter a valid email address.',
    'Request not allowed.',
    'Request too large.',
    'Too many requests. Wait a moment before requesting another code.',
    'Could not send a code. Try again in a moment.',
    'Could not complete the request. Check your connection and try again.',
  ]),
});
