import type { z } from 'zod';
import type { documentSubmissionSchema } from '../helpers/submission-validation';

export type DocumentSubmission = z.output<typeof documentSubmissionSchema>;
export type DocumentSaveError = {
  code: 'correction' | 'reauthenticate' | 'conflict' | 'retry';
  status: 400 | 401 | 403 | 409 | 413 | 503;
  message: string;
};
export type DocumentSaveFailureStage = 'authentication' | 'submission' | 'persistence';
export type DocumentSaveFailureKind = 'unexpected' | 'integration-failure' | 'invalid-response';
