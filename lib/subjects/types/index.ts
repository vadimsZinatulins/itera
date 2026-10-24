import type { z } from 'zod';
import type { createdSubjectSchema, subjectSubmissionSchema } from '../helpers/validation';

export type SubjectSubmissionInput = z.input<typeof subjectSubmissionSchema>;
export type SubjectSubmission = z.output<typeof subjectSubmissionSchema>;
export type CreatedSubject = z.output<typeof createdSubjectSchema>;

export type SubjectCreationError =
  | { code: 'correction'; message: string; status: 400 | 409 }
  | { code: 'reauthenticate'; message: string }
  | { code: 'too-large'; message: string }
  | { code: 'retry'; message: string };

export type SubjectCreationFailureStage = 'authentication' | 'submission' | 'persistence';
export type SubjectCreationFailureKind = 'unexpected' | 'integration-failure' | 'invalid-response';
