import { authClient, currentAccount } from '@/lib/auth/server';
import { authConfig } from '@/lib/auth/config';

const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function POST(request: Request) {
  if (request.headers.get('origin') !== authConfig().origin) return reply({ error: 'Request not allowed.' }, 403);
  try {
    if (!await currentAccount()) return reply({ error: 'Sign in required.' }, 401);
    const text = await request.text();
    if (text.length > 2000) return reply({ error: 'Approval request too large.' }, 413);
    let input;
    try { input = JSON.parse(text); } catch { return reply({ error: 'Invalid approval request.' }, 400); }
    if (!input || !uuid(input.id) || !uuid(input.subjectId) || !Number.isInteger(input.revision) || input.revision < 1) return reply({ error: 'Save a Draft before approval.' }, 400);
    const client = await authClient();
    const { data, error } = await client.rpc('approve_learning_document', { p_id: input.id, p_subject_id: input.subjectId, p_revision: input.revision });
    if (error?.code === '40001') return reply({ error: 'A newer saved document exists. Nothing was approved. Your attempted edits remain here; refresh and review before approving.' }, 409);
    if (error?.code === '42501') return reply({ error: 'Document or Subject unavailable.' }, 403);
    if (error?.code === '22023') return reply({ error: 'Approval requires a nonblank title and substantive saved block content.' }, 400);
    return error ? reply({ error: 'Approval could not be confirmed. Refresh and review the saved version before retrying.' }, 503) : reply(data);
  } catch { return reply({ error: 'Approval could not be confirmed. Your edits remain here. Refresh and review before retrying.' }, 503); }
}
