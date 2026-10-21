import { authClient, currentAccount } from '@/lib/auth/server';
import { authConfig } from '@/lib/auth/config';

const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function GET(request: Request) {
  try {
    const account = await currentAccount();
    if (!account) return reply({ error: 'Sign in required.' }, 401);
    const subjectId = new URL(request.url).searchParams.get('subject');
    if (!uuid(subjectId)) return reply({ error: 'Subject unavailable.' }, 400);
    const client = await authClient();
    const subject = await client.from('subjects').select('id').eq('id', subjectId).eq('account_id', account.id).maybeSingle();
    if (subject.error) return reply({ error: 'Could not load documents.' }, 503);
    if (!subject.data) return reply({ error: 'Subject unavailable.' }, 404);
    const { data, error } = await client.from('learning_documents').select('id,subject_id,revision,title,description,blocks').eq('account_id', account.id).eq('subject_id', subjectId).order('updated_at', { ascending: false });
    return error ? reply({ error: 'Could not load documents.' }, 503) : reply(data);
  } catch { return reply({ error: 'Could not load documents. Try again.' }, 503); }
}

export async function POST(request: Request) {
  if (request.headers.get('origin') !== authConfig().origin) return reply({ error: 'Request not allowed.' }, 403);
  try {
    if (!await currentAccount()) return reply({ error: 'Sign in required.' }, 401);
    const text = await request.text();
    if (text.length > 600000) return reply({ error: 'Draft too large.' }, 413);
    let input;
    try { input = JSON.parse(text); } catch { return reply({ error: 'Invalid Draft.' }, 400); }
    if (!input || !uuid(input.id) || !uuid(input.subjectId) || !Number.isInteger(input.revision) || input.revision < 0 || typeof input.title !== 'string' || typeof input.description !== 'string' || !Array.isArray(input.blocks)) return reply({ error: 'Invalid Draft.' }, 400);
    const client = await authClient();
    const { data, error } = await client.rpc('save_learning_document', { p_id: input.id, p_subject_id: input.subjectId, p_revision: input.revision, p_title: input.title, p_description: input.description, p_blocks: input.blocks });
    if (error?.code === '40001') return reply({ error: 'A newer saved document may exist. Your attempted text is retained. Refresh and review the saved version before trying again.' }, 409);
    if (error?.code === '42501') return reply({ error: 'Subject unavailable.' }, 403);
    if (error?.code === '22023') return reply({ error: 'Invalid Draft or document limit exceeded (300-character title, 5000-character description, 200 blocks, 500 KB blocks).' }, 400);
    return error ? reply({ error: 'Save failed. Your edits remain here; try again.' }, 503) : reply(data);
  } catch { return reply({ error: 'Save failed. Check your connection; your edits remain here.' }, 503); }
}
