import { authClient } from '@/lib/auth/server';
import { authConfig } from '@/lib/auth/config';
import { requestCode } from '@/lib/auth/request-code/actions/request-code';
import { codeRequestErrorResponse } from '@/lib/auth/request-code/helpers/failures';

function reply(body: object, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request, context: RouteContext<'/api/auth/[operation]'>) {
  if (request.headers.get('origin') !== authConfig().origin) {
    return reply({ error: 'Request not allowed.' }, 403);
  }
  const { operation } = await context.params;
  if (!['request', 'verify', 'logout'].includes(operation)) {
    return reply({ error: 'Not found.' }, 404);
  }
  if (operation === 'request') {
    const [error, acknowledgement] = await requestCode(request);
    if (error !== null) {
      return codeRequestErrorResponse(error);
    }
    return reply(acknowledgement);
  }
  try {
    const client = await authClient();
    if (operation === 'logout') {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) return reply({ error: 'Could not log out. Check your connection and try again.' }, 503);
      return reply({ ok: true });
    }
    const text = await request.text();
    if (text.length > 2048) return reply({ error: 'Request too large.' }, 413);
    let input: unknown;
    try { input = JSON.parse(text); }
    catch { return reply({ error: 'Enter a valid request.' }, 400); }
    if (!input || typeof input !== 'object' || !('email' in input) || typeof input.email !== 'string') {
      return reply({ error: 'Enter a valid email address.' }, 400);
    }
    const email = input.email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply({ error: 'Enter a valid email address.' }, 400);
    }
    if (!('code' in input) || typeof input.code !== 'string' || !/^\d{6,10}$/.test(input.code)) {
      return reply({ error: 'Enter the code from your email.' }, 400);
    }
    const { error } = await client.auth.verifyOtp({ email, token: input.code, type: 'email' });
    if (error) {
      if (!error.status || error.status >= 500) {
        return reply({ error: 'Could not verify the code. Check your connection and try again.' }, 503);
      }
      return reply({ error: error.status === 429
        ? 'Too many attempts. Wait a moment and try again.'
        : 'The code is invalid or has expired. Try again or request another code.' }, error.status === 429 ? 429 : 401);
    }
    return reply({ ok: true });
  } catch {
    // Never expose or log provider exceptions, request bodies, email or codes.
    return reply({ error: 'Could not complete the request. Check your connection and try again.' }, 503);
  }
}
