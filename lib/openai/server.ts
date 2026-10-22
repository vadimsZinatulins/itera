import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { currentAccount } from '@/lib/auth/server';
import { authConfig } from '@/lib/auth/config';

// Explicit, pinned catalogue: never substitute or silently follow a moving alias.
export const catalogue = [
  { id: 'gpt-5.5-2026-04-23', name: 'GPT-5.5' },
  { id: 'gpt-5.4-mini-2026-03-17', name: 'GPT-5.4 mini' },
] as const;

export class SettingsError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}
type Credential = { api_key: string; model: string | null };

// Kept separate from ordinary account-content access. Never export this client.
function credentialClient() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new SettingsError('AI settings are temporarily unavailable. Try again later.');
  return createClient(authConfig().url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
async function authorised() {
  const account = await currentAccount();
  if (!account) throw new SettingsError('Sign in to manage AI settings.', 401);
  return account;
}
async function read(owner: string): Promise<Credential | null> {
  const { data, error } = await credentialClient().rpc('server_openai_read', { owner_id: owner });
  if (error) throw new SettingsError('Could not read AI settings. Try again.');
  return data?.[0] ?? null;
}
async function write(owner: string, key: string, model: string | null) {
  const { error } = await credentialClient().rpc('server_openai_write', { owner_id: owner, secret: key, selected_model: model });
  if (error) throw new SettingsError('Could not save AI settings. Try again.');
}

async function provider(key: string, path: string, body?: object) {
  let response: Response;
  try {
    response = await fetch(`https://api.openai.com/v1/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new SettingsError('OpenAI could not be reached in time. Retry explicitly; a generation retry may incur another charge.');
  }
  // Do not expose or log upstream bodies, headers, request inputs or credentials.
  if (response.status === 401) throw new SettingsError('OpenAI rejected the key. Replace it with a valid API key.', 422);
  if (response.status === 403) throw new SettingsError('OpenAI denied access. Check key permissions and model access.', 422);
  if (response.status === 404) throw new SettingsError('The selected model is unavailable. Refresh models and explicitly choose an available model.', 422);
  if (response.status === 429) throw new SettingsError('OpenAI quota or rate limit reached. Check API billing and limits before retrying.', 429);
  if (!response.ok) throw new SettingsError('OpenAI could not complete this request. Check model access and request limits before retrying.', 502);
  try { return await response.json(); }
  catch { throw new SettingsError('OpenAI returned an unreadable response. Try again later.', 502); }
}
async function available(key: string) {
  const result = await provider(key, 'models');
  if (!Array.isArray(result.data)) throw new SettingsError('Could not read OpenAI model access. Try again later.', 502);
  const ids = new Set(result.data.map((item: { id?: string }) => item?.id));
  return catalogue.filter(model => ids.has(model.id));
}

export async function settingsStatus() {
  const account = await authorised();
  const saved = await read(account.id);
  // No network call on page load; saved content stays readable during provider outages.
  return { hasKey: Boolean(saved), model: saved?.model ?? null };
}
export async function refreshModels() {
  const account = await authorised();
  const saved = await read(account.id);
  if (!saved) throw new SettingsError('Save an OpenAI key first.', 422);
  return { models: await available(saved.api_key) };
}
export async function saveSettings(input: unknown) {
  const account = await authorised();
  if (!input || typeof input !== 'object') throw new SettingsError('Enter a key or select a model.', 400);
  const values = input as Record<string, unknown>;
  if (Object.keys(values).some(key => key !== 'key' && key !== 'model')) throw new SettingsError('Unsupported settings field.', 400);
  const saved = await read(account.id);
  let key = saved?.api_key;
  if ('key' in values) {
    if (typeof values.key !== 'string' || !/^sk-[A-Za-z0-9_-]{8,500}$/.test(values.key)) throw new SettingsError('Enter an OpenAI API key beginning with sk-.', 400);
    key = values.key;
  }
  if (!key) throw new SettingsError('Save an OpenAI key first.', 422);
  const models = await available(key);
  const model = 'model' in values ? values.model : saved?.model ?? null;
  if (model !== null && (typeof model !== 'string' || !models.some(item => item.id === model))) {
    throw new SettingsError('That model is not supported or is unavailable to this key. Refresh models and choose explicitly.', 422);
  }
  await write(account.id, key, model);
  return { hasKey: true, model, models };
}
export async function removeSettings() {
  const account = await authorised();
  const { error } = await credentialClient().rpc('server_openai_remove', { owner_id: account.id });
  if (error) throw new SettingsError('Could not remove the key. Try again.');
  return { hasKey: false, model: null, models: [] };
}

// Foundation for later user-initiated workflows, not a public generation endpoint.
// Read credentials afresh after authorisation: removal blocks future invocations,
// not provider work already accepted. No automatic retries or alternate providers.
export async function generateText(input: string) {
  const account = await authorised();
  if (!input.trim() || new TextEncoder().encode(input).length > 32_000) throw new SettingsError('AI input must be between 1 and 32,000 UTF-8 bytes. Shorten the requested material.', 413);
  const saved = await read(account.id);
  if (!saved) throw new SettingsError('Save an OpenAI key before starting AI work.', 422);
  if (!catalogue.some(model => model.id === saved.model)) throw new SettingsError('Choose a supported OpenAI model in settings first.', 422);
  const result = await provider(saved.api_key, 'responses', {
    model: saved.model, input, store: false, stream: false, max_output_tokens: 2048,
  });
  if (result.status !== 'completed') throw new SettingsError('OpenAI did not complete the output within the request limits. An explicit retry may incur another charge.', 422);
  const text = result.output?.flatMap((item: { type: string; content?: { type: string; text?: string }[] }) =>
    item.type === 'message' ? item.content?.filter(part => part.type === 'output_text').map(part => part.text ?? '') ?? [] : []).join('');
  if (!text) throw new SettingsError('OpenAI returned no usable text. An explicit retry may incur another charge.', 502);
  return text as string;
}
