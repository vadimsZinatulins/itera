import 'server-only';
import { unstable_rethrow } from 'next/navigation';
import { authClient, currentAccount } from '@/lib/auth/server';
import { AccountServiceUnavailable } from '@/lib/auth/availability';
import type { Result } from '@/lib/types/result';
import { reportConversationReadFailure } from '../helpers/failures';
import { conversationHistorySchema, conversationScopeSchema, conversationTrailSchema } from '../helpers/validation';
import type { ConversationHistory, ConversationReadError, ConversationReadFailureStage, ConversationTrail } from '../types';

export async function readConversations(subjectInput: unknown, conversationInput: unknown): Promise<Result<ConversationTrail | ConversationHistory, ConversationReadError>> {
  let stage: ConversationReadFailureStage = 'authentication';
  try {
    const account = await currentAccount();
    if (!account) {
      return [{ code: 'reauthenticate', message: 'Sign in required.' }, null];
    }
    const scope = conversationScopeSchema.safeParse({ subject: subjectInput, conversation: conversationInput });
    if (!scope.success) {
      return [{ code: 'unavailable', status: 400, message: 'Invalid conversation scope.' }, null];
    }

    stage = 'persistence';
    const { subject, conversation } = scope.data;
    const client = await authClient();
    const owned = await client.from('subjects').select('id').eq('id', subject).eq('account_id', account.id).maybeSingle();
    if (owned.error) {
      reportConversationReadFailure(stage, 'integration-failure');
      return [{ code: 'retry', message: 'Could not load trail.' }, null];
    }
    if (!owned.data) {
      return [{ code: 'unavailable', status: 404, message: 'Subject unavailable.' }, null];
    }
    if (conversation === null) {
      const { data, error } = await client.from('conversations').select('id,title,created_at')
        .eq('account_id', account.id).eq('subject_id', subject).order('created_at', { ascending: false });
      if (error) {
        reportConversationReadFailure(stage, 'integration-failure');
        return [{ code: 'retry', message: 'Could not load trail.' }, null];
      }
      const trail = conversationTrailSchema.safeParse(data);
      if (!trail.success) {
        reportConversationReadFailure(stage, 'invalid-response');
        return [{ code: 'retry', message: 'Could not load trail.' }, null];
      }
      return [null, trail.data];
    }

    const ownedConversation = await client.from('conversations').select('id').eq('id', conversation).eq('subject_id', subject).eq('account_id', account.id).maybeSingle();
    if (ownedConversation.error) {
      reportConversationReadFailure(stage, 'integration-failure');
      return [{ code: 'retry', message: 'Could not load conversation.' }, null];
    }
    if (!ownedConversation.data) {
      return [{ code: 'unavailable', status: 404, message: 'Conversation unavailable.' }, null];
    }
    const { data, error } = await client.from('conversation_turns').select('id,ordinal,user_text,assistant_text,status,pending_until,practice,sources,assessment')
      .eq('account_id', account.id).eq('conversation_id', conversation).order('ordinal');
    if (error) {
      reportConversationReadFailure(stage, 'integration-failure');
      return [{ code: 'retry', message: 'Could not load conversation.' }, null];
    }
    // Scalar columns have SQL contracts; opaque source/assessment snapshots are narrowed here.
    const history = conversationHistorySchema.safeParse(data);
    if (!history.success) {
      reportConversationReadFailure(stage, 'invalid-response');
      return [{ code: 'retry', message: 'Could not load conversation.' }, null];
    }
    return [null, history.data];
  } catch (error) {
    unstable_rethrow(error);
    if (!(error instanceof AccountServiceUnavailable)) {
      reportConversationReadFailure(stage, 'unexpected');
    }
    return [{ code: 'retry', message: 'Could not load conversations. Try again.' }, null];
  }
}
