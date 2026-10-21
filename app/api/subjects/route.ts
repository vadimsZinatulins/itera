import { authClient, currentAccount } from '@/lib/auth/server';
import { authConfig } from '@/lib/auth/config';

function reply(body: object, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (request.headers.get('origin') !== authConfig().origin) return reply({ error: 'Request not allowed.' }, 403);
  try {
    const account = await currentAccount();
    if (!account) return reply({ error: 'Sign in to create a Subject.' }, 401);
    const text = await request.text();
    if (text.length > 2048) return reply({ error: 'Request too large.' }, 413);
    let input: unknown;
    try { input = JSON.parse(text); } catch { return reply({ error: 'Enter a Subject name.' }, 400); }
    if (!input || typeof input !== 'object' || !('name' in input) || typeof input.name !== 'string' || !input.name.trim()) {
      return reply({ error: 'Enter a Subject name.' }, 400);
    }
    const name = input.name.trim();
    if ([...name].length > 80) return reply({ error: 'Use 80 characters or fewer.' }, 400);
    const client = await authClient();
    // Never accept ownership or identifiers from the request body.
    const { data, error } = await client.from('subjects').insert({ name, account_id: account.id }).select('id,name').single();
    if (error?.code === '23505') return reply({ error: 'A Subject with this name already exists.' }, 409);
    if (error) return reply({ error: 'Could not save the Subject. Try again.' }, 503);
    return reply(data, 201);
  } catch {
    return reply({ error: 'Could not save the Subject. Check your connection and try again.' }, 503);
  }
}
