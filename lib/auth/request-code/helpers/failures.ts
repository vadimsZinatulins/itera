import 'server-only';
import type { CodeRequestError, CodeRequestFailureKind, CodeRequestFailureStage } from '../types';

export function reportCodeRequestFailure(stage: CodeRequestFailureStage, kind: CodeRequestFailureKind) {
  // Closed metadata only: never include addresses, codes, bodies or provider errors.
  console.error('Sign-in code request failed.', { stage, kind });
}

export function codeRequestErrorResponse(error: CodeRequestError) {
  let status = 503;
  if (error.code === 'correction') {
    status = 400;
  } else if (error.code === 'too-large') {
    status = 413;
  } else if (error.code === 'rate-limited') {
    status = 429;
  }
  return Response.json({ error: error.message }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
