import 'server-only';
import type { DocumentReadError, DocumentReadFailureKind, DocumentReadFailureStage } from '../types';

export function reportDocumentReadFailure(stage: DocumentReadFailureStage, kind: DocumentReadFailureKind) {
  // Closed metadata only: no account IDs, document text, upstream errors or causes.
  console.error('Learning Documents read failed.', { stage, kind });
}

export function documentReadErrorResponse(error: DocumentReadError) {
  const status = error.code === 'reauthenticate' ? 401 : error.code === 'unavailable' ? error.status : 503;
  return Response.json({ error: error.message }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
