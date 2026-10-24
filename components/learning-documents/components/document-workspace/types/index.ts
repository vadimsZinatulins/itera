import type { DocumentBlock } from '@/lib/documents/types';
import type { LearningDocumentsProps, SessionEdits } from '../../../types';

export type DocumentWorkspaceProps = LearningDocumentsProps & { sessions: Map<string, SessionEdits> };
export type RemovedBlock = { block: DocumentBlock; index: number };
