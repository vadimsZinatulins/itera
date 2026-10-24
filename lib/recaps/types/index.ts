import type { z } from 'zod';
import type { interpretationSchema, recapSchema, recapStateSchema } from '../helpers/validation';

export type Interpretation = z.infer<typeof interpretationSchema>;
export type Recap = z.infer<typeof recapSchema>;
export type RecapState = z.infer<typeof recapStateSchema>;
export type RecapReadError =
  | { code: 'reauthenticate'; message: string }
  | { code: 'unavailable'; status: 400 | 404; message: string }
  | { code: 'retry'; message: string };
export type RecapReadFailureStage = 'authentication' | 'persistence';
export type RecapReadFailureKind = 'integration-failure' | 'invalid-response' | 'unexpected';
