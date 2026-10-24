import 'server-only';
import { unstable_rethrow } from 'next/navigation';
import { authClient, currentAccount } from '@/lib/auth/server';
import { AccountServiceUnavailable } from '@/lib/auth/availability';
import type { Result } from '@/lib/types/result';
import { reportRecapReadFailure } from '../helpers/failures';
import { observationListSchema, recapCoverageSchema, recapDocumentsSchema, recapListSchema, recapScopeSchema } from '../helpers/validation';
import type { RecapReadError, RecapReadFailureStage, RecapState } from '../types';

export async function readRecaps(subjectInput: unknown, conversationInput: unknown): Promise<Result<RecapState, RecapReadError>> {
  let stage: RecapReadFailureStage = 'authentication';
  try {
    const account = await currentAccount();
    if (!account) {
      return [{ code: 'reauthenticate', message: 'Sign in required.' }, null];
    }
    const scope = recapScopeSchema.safeParse({ subject: subjectInput, conversation: conversationInput });
    if (!scope.success) {
      return [{ code: 'unavailable', status: 400, message: 'Invalid recap scope.' }, null];
    }

    stage = 'persistence';
    const { subject, conversation } = scope.data;
    const client = await authClient();
    const owned = await client.from('conversations').select('id').eq('id', conversation).eq('subject_id', subject).eq('account_id', account.id).maybeSingle();
    if (owned.error) {
      reportRecapReadFailure(stage, 'integration-failure');
      return [{ code: 'retry', message: 'Could not load reviewed understanding.' }, null];
    }
    if (!owned.data) {
      return [{ code: 'unavailable', status: 404, message: 'Conversation unavailable.' }, null];
    }
    const [recaps, observations, coverage, documents] = await Promise.all([
      client.from('practice_recaps').select('*').eq('subject_id', subject).eq('conversation_id', conversation).order('created_at'),
      client.from('reviewed_observations').select('*').eq('subject_id', subject).order('created_at'),
      client.from('reviewed_coverage').select('through_ordinal').eq('conversation_id', conversation).maybeSingle(),
      client.from('learning_documents').select('id').eq('subject_id', subject),
    ]);
    if (recaps.error || observations.error || coverage.error || documents.error) {
      reportRecapReadFailure(stage, 'integration-failure');
      return [{ code: 'retry', message: 'Could not load reviewed understanding.' }, null];
    }

    // SQL establishes scalar columns; narrow opaque proposal, observation and provenance JSON here.
    const parsedRecaps = recapListSchema.safeParse(recaps.data);
    const parsedObservations = observationListSchema.safeParse(observations.data);
    const parsedCoverage = recapCoverageSchema.safeParse(coverage.data);
    const parsedDocuments = recapDocumentsSchema.safeParse(documents.data);
    if (!parsedRecaps.success || !parsedObservations.success || !parsedCoverage.success || !parsedDocuments.success) {
      reportRecapReadFailure(stage, 'invalid-response');
      return [{ code: 'retry', message: 'Could not load reviewed understanding.' }, null];
    }
    const existing = new Set(parsedDocuments.data.map(document => document.id));
    return [null, {
      recaps: parsedRecaps.data,
      observations: parsedObservations.data.map(observation => ({
        ...observation,
        sources: observation.sources.map(source => ({ ...source, deleted: !existing.has(source.id) })),
      })),
      through: parsedCoverage.data?.through_ordinal ?? 0,
    }];
  } catch (error) {
    unstable_rethrow(error);
    if (!(error instanceof AccountServiceUnavailable)) {
      reportRecapReadFailure(stage, 'unexpected');
    }
    return [{ code: 'retry', message: 'Could not load reviewed understanding.' }, null];
  }
}
