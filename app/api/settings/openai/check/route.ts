import { authConfig } from '@/lib/auth/config';
import { generateText, SettingsError } from '@/lib/openai/server';

export async function POST(request: Request) {
  const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  if (request.headers.get('origin') !== authConfig().origin) return reply({ error: 'Request not allowed.' }, 403);
  try {
    // Explicit user-initiated compatibility check. Do not relay arbitrary provider output.
    await generateText('Reply with OK.');
    return reply({ message: 'Selected model completed a text request. OpenAI API charges may apply.' });
  } catch (error) {
    if (error instanceof SettingsError) return reply({ error: error.message }, error.status);
    return reply({ error: 'AI settings are temporarily unavailable. Try again.' }, 503);
  }
}
