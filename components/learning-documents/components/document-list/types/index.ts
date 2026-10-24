import type { LearningDocument } from '@/lib/documents/types';

export type DocumentListProps = {
  documents: LearningDocument[];
  loading: boolean;
  error: string;
  query: string;
  filter: string;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: string) => void;
  onCreate: () => void;
  onOpen: (document: LearningDocument) => void;
};
