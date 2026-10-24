import type { ReadStatus, Thread } from '../../../types';

export type ConversationThreadsProps = {
  threads: Thread[];
  status: ReadStatus;
  busy: boolean;
  selected: string;
  choose: (id: string) => void;
};
