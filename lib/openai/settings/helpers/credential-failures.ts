import 'server-only';
import type { CredentialFailureKind, CredentialFailureStage, CredentialMutationError } from '../types/credentials';

export function reportCredentialMutationFailure(stage: CredentialFailureStage, kind: CredentialFailureKind) {
  // Never pass credentials, account identifiers, exceptions or upstream payloads here.
  console.error('AI credential mutation failed.', { stage, kind });
}

export function credentialMutationErrorResponse(error: CredentialMutationError) {
  return Response.json({ error: error.message }, {
    status: error.status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
