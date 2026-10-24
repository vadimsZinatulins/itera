import type { Assessment } from '@/lib/assessment';

export type ConversationsProps = { accountId: string; subjectId: string; initialConversation?: string };
export type Thread = { id: string; title: string };
export type Source = { id: string; title: string; revision: number };
export type Turn = { assessment?: Assessment | null; practice?: boolean; sources?: Source[]; id: string; ordinal: number; user_text: string; assistant_text: string; status: 'complete' | 'incomplete'; pending_until: string };
export type ReadStatus = 'loading' | 'ready' | 'unavailable';
