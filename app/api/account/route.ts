import { currentAccount } from '@/lib/auth/server';

export async function GET() {
  const account = await currentAccount();
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!account) return Response.json({ error: 'Sign in to continue.' }, { status: 401, headers });
  return Response.json({ id: account.id }, { headers });
}
