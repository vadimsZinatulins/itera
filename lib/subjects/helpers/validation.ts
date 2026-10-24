import { z } from 'zod';

export const subjectSubmissionSchema = z.object({
  name: z.string({ error: 'Enter a Subject name.' }).trim()
    .min(1, 'Enter a Subject name.')
    .refine(name => [...name].length <= 80, 'Use 80 characters or fewer.'),
});

export const createdSubjectSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

export const subjectErrorResponseSchema = z.object({
  error: z.enum([
    'Enter a Subject name.',
    'Use 80 characters or fewer.',
    'A Subject with this name already exists.',
    'Sign in to create a Subject.',
    'Request not allowed.',
    'Request too large.',
    'Could not save the Subject. Try again.',
    'Could not save the Subject. Check your connection and try again.',
  ]),
});
