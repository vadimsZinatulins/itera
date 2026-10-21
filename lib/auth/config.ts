import 'server-only';

export function authConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const origin = process.env.APP_ORIGIN;
  if (!url || !key || !origin) throw new Error('Authentication configuration is missing.');
  return {
    url,
    key,
    origin: new URL(origin).origin,
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: new URL(origin).protocol === 'https:',
      path: '/',
    },
  };
}
