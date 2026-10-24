import type { LearningDocument } from '@/lib/documents/types';

export type DocumentOutputMode = 'preview' | 'markdown' | 'practice' | 'approve';
export type DocumentOutputProps = {
  output: DocumentOutputMode | null;
  saved: LearningDocument | null;
  busy: boolean;
  dirty: boolean;
  onClose: () => void;
  onApprove: () => Promise<void>;
  onStatus: (status: string) => void;
};
