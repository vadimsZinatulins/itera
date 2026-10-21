import { currentAccount } from '@/lib/auth/server';
import { AccountServiceUnavailable } from '@/lib/auth/availability';

export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store' };
  try {
    const account = await currentAccount();
    if (!account) return Response.json({ error: 'Sign in to continue.' }, { status: 401, headers });
    return Response.json({ id: account.id }, { headers });
  } catch (error) {
    if (!(error instanceof AccountServiceUnavailable)) throw error;
    return Response.json({ error: error.message }, { status: 503, headers });
  }
}
