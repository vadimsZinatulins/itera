import type { LearningDocument } from '@/lib/documents/types';

export type LearningDocumentsProps = { subjectId: string };
export type SessionEdits = {
  draft: LearningDocument | null;
  saved: LearningDocument | null;
  editing: Record<string, string>;
  busy: boolean;
};
