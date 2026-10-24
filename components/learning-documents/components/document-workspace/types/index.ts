import type { z } from 'zod';
import type { documentEditorSchema } from '../helpers/validation';
import type { DocumentBlock } from '@/lib/documents/types';
import type { LearningDocumentsProps, SessionEdits } from '../../../types';

export type DocumentWorkspaceProps = LearningDocumentsProps & { sessions: Map<string, SessionEdits> };
export type DocumentEditorInput = z.input<typeof documentEditorSchema>;
export type DocumentEditorSubmission = z.output<typeof documentEditorSchema>;
export type RemovedBlock = { block: DocumentBlock; index: number };
export type DocumentReadState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'unavailable'; message: string };
