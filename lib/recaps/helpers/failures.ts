import 'server-only';
import type { RecapReadError, RecapReadFailureKind, RecapReadFailureStage } from '../types';

export function reportRecapReadFailure(stage: RecapReadFailureStage, kind: RecapReadFailureKind) {
  // Closed metadata only: never report rows, provider errors, identifiers or learner text.
  console.error('Practice recaps read failed.', { stage, kind });
}

export function recapReadErrorResponse(error: RecapReadError) {
  const status = error.code === 'reauthenticate' ? 401 : error.code === 'unavailable' ? error.status : 503;
  return Response.json({ error: error.message }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
