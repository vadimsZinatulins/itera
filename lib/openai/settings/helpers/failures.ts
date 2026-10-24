import 'server-only';
import type { SettingsReadError, SettingsReadFailureKind, SettingsReadFailureStage } from '../types';

export function reportSettingsReadFailure(stage: SettingsReadFailureStage, kind: SettingsReadFailureKind) {
  // Only closed metadata, never an exception, upstream object, account ID or input.
  console.error('AI settings read failed.', { stage, kind });
}

export function settingsReadErrorResponse(error: SettingsReadError) {
  return Response.json({ error: error.message }, {
    status: error.code === 'reauthenticate' ? 401 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
