import { authConfig } from '@/lib/auth/config';
import { SettingsError, refreshModels, saveSettings, removeSettings } from '@/lib/openai/server';
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
export async function DELETE(request: Request) { return handle(request, removeSettings); }
export async function PUT(request: Request) {
  return handle(request, async () => {
    const reader = request.body?.getReader();
    if (!reader) throw new SettingsError('Enter a key or select a model.', 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) { await reader.cancel(); throw new SettingsError('Request too large.', 413); }
      chunks.push(value);
    }
    let input: unknown;
    try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new SettingsError('Enter valid settings.', 400); }
    return saveSettings(input);
  });
}
