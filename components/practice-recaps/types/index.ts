import type { RecapState } from '@/lib/recaps/types';

export type PracticeRecapsProps = {
  subject: string;
  conversation: string;
  activity: string;
  checkpoint: boolean;
  disabled: boolean;
};
export type RecapLoadState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'ready'; data: RecapState };
export type RecapLoadError = { code: 'retry' | 'cancelled'; message: string };
