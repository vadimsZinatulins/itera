import type { z } from 'zod';
import type { codeRequestResponseSchema, codeRequestSubmissionSchema } from '../helpers/validation';

export type CodeRequestSubmissionInput = z.input<typeof codeRequestSubmissionSchema>;
export type CodeRequestSubmission = z.output<typeof codeRequestSubmissionSchema>;
export type CodeRequestResponse = z.output<typeof codeRequestResponseSchema>;

export type CodeRequestError =
  | { code: 'correction'; message: string }
  | { code: 'too-large'; message: string }
  | { code: 'rate-limited'; message: string }
  | { code: 'retry'; message: string };

export type CodeRequestFailureStage = 'submission' | 'delivery';
export type CodeRequestFailureKind = 'unexpected' | 'integration-failure';
