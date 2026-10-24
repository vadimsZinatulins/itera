import type { ConversationHistory, ConversationTrail } from '@/lib/conversations/types';
import type { Result } from '@/lib/types/result';

export type ConversationsProps = { accountId: string; subjectId: string; initialConversation?: string };
// Stream-local entries intentionally omit fields only available after persistence reads.
export type Thread = Pick<ConversationTrail[number], 'id' | 'title'>;
export type Turn = ConversationHistory[number];
export type ReadStatus = 'loading' | 'ready' | 'unavailable';
export type SendError = { code: 'correction' | 'retry'; message: string };
export type BrowserReadError = { code: 'retry' | 'unavailable'; message: string };
export type TrailReadResult = Result<ConversationTrail, BrowserReadError>;
export type RecoveryDeletedDetail = { account: string; subject?: string; conversation?: string };
