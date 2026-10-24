import 'server-only';
import type { SubjectCreationError, SubjectCreationFailureKind, SubjectCreationFailureStage } from '../types';

export function reportSubjectCreationFailure(stage: SubjectCreationFailureStage, kind: SubjectCreationFailureKind) {
  // Closed metadata only: never report names, ownership, upstream payloads or exceptions.
  console.error('Subject creation failed.', { stage, kind });
}

export function subjectCreationErrorResponse(error: SubjectCreationError) {
  let status = 503;
  if (error.code === 'correction') {
    status = error.status;
  } else if (error.code === 'reauthenticate') {
    status = 401;
  } else if (error.code === 'too-large') {
    status = 413;
  }

  return Response.json({ error: error.message }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
