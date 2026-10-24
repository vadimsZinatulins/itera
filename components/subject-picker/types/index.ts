import type { CreatedSubject } from '@/lib/subjects/types';

export type SubjectPickerProps = {
  subjects: CreatedSubject[];
  activeId?: string;
};
