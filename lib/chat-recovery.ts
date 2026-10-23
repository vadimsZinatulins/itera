// Device-only personal text. No credentials or server history belong here.
export type ChatOperation = { subject: string; conversation: string; operation: string; text: string; practice: boolean; assessmentRevision?: number };
type Recovery = { text: string; practice: boolean; operation: ChatOperation | null };
const prefix = 'learning-companion:chat:v1:';
const key = (account: string, subject: string, conversation: string) => `${prefix}${account}:${subject}:${conversation || 'new'}`;

export function readChatRecovery(account: string, subject: string, conversation: string): Recovery | null {
  try {
    const value = JSON.parse(localStorage.getItem(key(account, subject, conversation)) ?? 'null');
    if (!value || typeof value.text !== 'string' || typeof value.practice !== 'boolean') return null;
    const op = value.operation;
    if (op && (op.subject !== subject || (conversation && op.conversation !== conversation) || typeof op.conversation !== 'string' || typeof op.operation !== 'string' || op.text !== value.text || op.practice !== value.practice || (op.assessmentRevision !== undefined && (!Number.isSafeInteger(op.assessmentRevision) || op.assessmentRevision < 0)))) return null;
    return { text: value.text, practice: value.practice, operation: op ?? null };
  } catch { return null; }
}

export function saveChatRecovery(account: string, subject: string, conversation: string, recovery: Recovery | null): boolean {
  try {
    const name = key(account, subject, conversation);
    if (!recovery || (!recovery.text && !recovery.operation)) localStorage.removeItem(name);
    else localStorage.setItem(name, JSON.stringify(recovery));
    return true;
  } catch { return false; }
}

// Deletion slices must call this after confirmed deletion, before navigation.
// Prefix scopes include the pending first-send slot when deleting a Subject.
export function clearChatRecovery(account: string, subject?: string, conversation?: string) {
  const scope = `${prefix}${account}:${subject ? `${subject}:` : ''}`;
  try {
    for (const name of Object.keys(localStorage)) {
      if (!name.startsWith(scope)) continue;
      const pending = conversation && subject ? readChatRecovery(account, subject, name.slice(scope.length))?.operation : null;
      if (!conversation || name === key(account, subject!, conversation) || pending?.conversation === conversation) localStorage.removeItem(name);
    }
  } catch { /* Storage unavailable. */ }
  window.dispatchEvent(new CustomEvent('chat-recovery-deleted', { detail: { account, subject, conversation } }));
}
