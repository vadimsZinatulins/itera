import type { Result } from '@/lib/types/result';
import { chatRecoverySchema } from './chat-recovery/helpers/validation';
import type { ChatRecovery, ChatRecoveryError, ChatRecoveryRead } from './chat-recovery/types';

// Device-only personal text. No credentials or server history belong here.
const prefix = 'learning-companion:chat:v1:';
const key = (account: string, subject: string, conversation: string) => `${prefix}${account}:${subject}:${conversation || 'new'}`;

export function readChatRecovery(account: string, subject: string, conversation: string): Result<ChatRecoveryRead, ChatRecoveryError> {
  let stored: string | null;
  try {
    stored = localStorage.getItem(key(account, subject, conversation));
  } catch {
    return [{ code: 'unavailable', message: 'Device recovery unavailable. Unsent text is not server-saved.' }, null];
  }
  if (stored === null) {
    return [null, { status: 'absent' }];
  }
  let input: unknown;
  try {
    input = JSON.parse(stored);
  } catch {
    return [{ code: 'corrupt', message: 'Device recovery could not be read. No automatic retry was made.' }, null];
  }
  const parsed = chatRecoverySchema.safeParse(input);
  if (!parsed.success || (parsed.data.operation !== null && (
    parsed.data.operation.subject !== subject || (conversation !== '' && parsed.data.operation.conversation !== conversation)
  ))) {
    return [{ code: 'corrupt', message: 'Device recovery could not be read. No automatic retry was made.' }, null];
  }
  return [null, { status: 'recovered', recovery: parsed.data }];
}

export function saveChatRecovery(account: string, subject: string, conversation: string, recovery: ChatRecovery | null): Result<{ saved: true }, ChatRecoveryError> {
  try {
    const name = key(account, subject, conversation);
    if (!recovery || (!recovery.text && !recovery.operation)) {
      localStorage.removeItem(name);
    } else {
      localStorage.setItem(name, JSON.stringify(recovery));
    }
    return [null, { saved: true }];
  } catch {
    return [{ code: 'unavailable', message: 'Device recovery unavailable. Unsent text is not server-saved.' }, null];
  }
}

// Retained for the explicitly deferred deletion slices; no deletion workflow is added here.
export function clearChatRecovery(account: string, subject?: string, conversation?: string) {
  const scope = `${prefix}${account}:${subject ? `${subject}:` : ''}`;
  try {
    for (const name of Object.keys(localStorage)) {
      if (!name.startsWith(scope)) {
        continue;
      }
      let pendingConversation: string | undefined;
      if (conversation && subject) {
        const [error, result] = readChatRecovery(account, subject, name.slice(scope.length));
        if (error === null && result.status === 'recovered') {
          pendingConversation = result.recovery.operation?.conversation;
        }
      }
      if (!conversation || name === key(account, subject ?? '', conversation) || pendingConversation === conversation) {
        localStorage.removeItem(name);
      }
    }
  } catch {
    // Storage is unavailable; mounted consumers must still discard the deleted scope.
  }
  window.dispatchEvent(new CustomEvent('chat-recovery-deleted', { detail: { account, subject, conversation } }));
}
