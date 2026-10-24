import type { z } from 'zod';
import type { documentBlockSchema, documentListSchema, documentSnapshotSchema, learningDocumentSchema } from '../helpers/validation';

export type DocumentBlock = z.output<typeof documentBlockSchema>;
export type DocumentSnapshot = z.output<typeof documentSnapshotSchema>;
export type LearningDocument = z.output<typeof learningDocumentSchema>;
export type DocumentList = z.output<typeof documentListSchema>;

export type DocumentReadError =
  | { code: 'reauthenticate'; message: string }
  | { code: 'unavailable'; status: 400 | 404; message: string }
  | { code: 'retry'; message: string };

export type DocumentReadFailureStage = 'authentication' | 'persistence';
export type DocumentReadFailureKind = 'unexpected' | 'integration-failure' | 'invalid-response';
