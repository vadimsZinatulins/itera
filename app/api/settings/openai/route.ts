import { authConfig } from '@/lib/auth/config';
import { SettingsError, refreshModels } from '@/lib/openai/server';
import { removeCredentials, saveCredentials } from '@/lib/openai/settings/actions/mutate-credentials';
import { readCredentialSubmission } from '@/lib/openai/settings/actions/read-credential-submission';
import { credentialMutationErrorResponse } from '@/lib/openai/settings/helpers/credential-failures';
import { readSettingsStatus } from '@/lib/openai/settings/actions/read-settings-status';
import { settingsReadErrorResponse } from '@/lib/openai/settings/helpers/failures';

function reply(body: object, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
async function handle(request: Request, action: () => Promise<object>) {
  if (request.method !== 'GET' && request.headers.get('origin') !== authConfig().origin) return reply({ error: 'Request not allowed.' }, 403);
  try { return reply(await action()); }
  catch (error) {
    if (error instanceof SettingsError) return reply({ error: error.message }, error.status);
    return reply({ error: 'AI settings are temporarily unavailable. Try again.' }, 503);
  }
}
export async function GET() {
  const [error, status] = await readSettingsStatus();
  if (error !== null) {
    return settingsReadErrorResponse(error);
  }

  return reply({ hasKey: status.hasKey, model: status.model });
}
export async function POST(request: Request) { return handle(request, refreshModels); }
export async function DELETE(request: Request) {
  if (request.headers.get('origin') !== authConfig().origin) {
    return reply({ error: 'Request not allowed.' }, 403);
  }
  const [error, removed] = await removeCredentials();
  if (error !== null) {
    return credentialMutationErrorResponse(error);
  }
  return reply(removed);
}

export async function PUT(request: Request) {
  if (request.headers.get('origin') !== authConfig().origin) {
    return reply({ error: 'Request not allowed.' }, 403);
  }
  const [submissionError, submission] = await readCredentialSubmission(request);
  if (submissionError !== null) {
    return credentialMutationErrorResponse(submissionError);
  }
  const [error, saved] = await saveCredentials(submission.input);
  if (error !== null) {
    return credentialMutationErrorResponse(error);
  }
  return reply(saved);
}
