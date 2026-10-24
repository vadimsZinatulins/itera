import { createClient } from '@supabase/supabase-js';
import { authClient, currentAccount } from '@/lib/auth/server';
import { authConfig } from '@/lib/auth/config';
import { SettingsError, streamConversation } from '@/lib/openai/server';
import { assessmentInstructions, assessmentRequested, readAssessmentOutput } from '@/lib/assessments/server';
import type { Assessment } from '@/lib/assessment';
import { readConversations } from '@/lib/conversations/actions/read-conversations';
import { conversationReadErrorResponse } from '@/lib/conversations/helpers/failures';

export const maxDuration = 90;
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const [error, conversations] = await readConversations(params.get('subject'), params.get('conversation'));
  if (error !== null) {
    return conversationReadErrorResponse(error);
  }
  return reply(conversations);
}

export async function POST(request: Request) {
  if (request.headers.get('origin') !== authConfig().origin) return reply({ error: 'Request not allowed.' }, 403);
  try {
    const account = await currentAccount();
    if (!account) return reply({ error: 'Sign in required.' }, 401);
    // Read a bounded body, including clients without Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: 'Message required.' }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 12000) { await reader.cancel(); return reply({ error: 'Message too large (8,000 UTF-8 bytes maximum).' }, 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let parsed: unknown;
    try { parsed = JSON.parse(new TextDecoder().decode(bytes)); } catch { return reply({ error: 'Invalid message.' }, 400); }
    if (!parsed || typeof parsed !== 'object') return reply({ error: 'Invalid message.' }, 400);
    const values = parsed as Record<string, unknown>;
    if (Object.keys(values).some(key => !['subject', 'conversation', 'operation', 'text', 'practice', 'assessmentRevision'].includes(key)) || !uuid(values.subject) || !uuid(values.conversation) || !uuid(values.operation) || typeof values.text !== 'string' || !values.text.trim()) return reply({ error: 'Invalid message.' }, 400);
    if ('practice' in values && typeof values.practice !== 'boolean') return reply({ error: 'Invalid practice selection.' }, 400);
    if ('assessmentRevision' in values && (!Number.isSafeInteger(values.assessmentRevision) || (values.assessmentRevision as number) < 0)) return reply({ error: 'Invalid assessment revision.' }, 400);
    const input = { subject: values.subject, conversation: values.conversation, operation: values.operation, text: values.text, practice: values.practice === true, assessmentRevision: values.assessmentRevision as number | undefined };
    if (new TextEncoder().encode(input.text).length > 8000) return reply({ error: 'Message too large (8,000 UTF-8 bytes maximum).' }, 413);
    const client = await authClient();
    const saved = await client.rpc('send_conversation_message', { p_subject: input.subject, p_conversation: input.conversation, p_operation: input.operation, p_text: input.text, p_practice: input.practice, p_assessment_revision: input.assessmentRevision ?? null });
    if (saved.error) {
      const code = saved.error.code;
      return reply({ error: code === '40001' ? 'A reply is already in progress or the assessment changed. Reload before answering; your text is preserved.' : code === '22023' ? 'Message or conversation context limit reached, or operation identity changed. Use a new thread for more context.' : code === '42501' ? 'Subject or conversation unavailable.' : 'Message could not be saved. Retry the same send to avoid duplication.' }, code === '40001' ? 409 : code === '22023' ? 400 : code === '42501' ? 403 : 503);
    }
    if (!saved.data) return reply({ saved: true, duplicate: true, conversation: input.conversation });
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 60000);
    request.signal.addEventListener('abort', () => abort.abort(), { once: true });
    const stream = new ReadableStream({
      async start(controller) {
        let text = '', complete = false, lastCheckpoint = 0, assessmentSaved = false;
        let error = 'Reply incomplete. No automatic generation retry was made; another request may incur another charge.';
        const send = (value: object) => { try { controller.enqueue(new TextEncoder().encode(JSON.stringify(value) + '\n')); } catch { abort.abort(); } };
        const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const writer = secret ? createClient(authConfig().url, secret, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
        async function persist(final: boolean) {
          if (!writer) throw new Error('Persistence unavailable');
          const result = await writer.rpc('server_conversation_reply', { p_owner: account!.id, p_subject: input.subject, p_conversation: input.conversation, p_operation: input.operation, p_text: text, p_complete: final && complete, p_final: final });
          if (result.error || !result.data) throw new Error('Persistence unavailable');
        }
        send({ saved: true, conversation: input.conversation, operation: input.operation });
        try {
          if (!writer) throw new Error('Persistence unavailable');
          const history = await client.from('conversation_turns').select('user_text,assistant_text,status').eq('account_id', account.id).eq('conversation_id', input.conversation).order('ordinal');
          if (history.error || !history.data) throw new Error('History unavailable');
          const context: { role: 'user' | 'assistant'; content: string }[] = [];
          for (const turn of history.data) {
            context.push({ role: 'user', content: turn.user_text });
            if (turn.assistant_text) context.push({ role: 'assistant', content: turn.status === 'complete' ? turn.assistant_text : '[Incomplete previous reply]\n' + turn.assistant_text });
          }
          let material: unknown[] = [];
          if (input.practice) {
            const selected = await writer.rpc('server_practice_context', { p_owner: account.id, p_subject: input.subject, p_operation: input.operation });
            if (selected.error) throw new SettingsError(selected.error.code === '22023' ? 'Approved source context exceeds 20 documents or 16,000 bytes. Narrow your Subject material before practising; no sources were sent.' : 'Approved sources could not be loaded. No generation was started.');
            material = selected.data;
            const provenance = await client.from('conversation_turns').select('sources').eq('id', input.operation).single();
            if (provenance.error) throw new SettingsError('Source provenance could not be confirmed. No generation was started.');
            send({ sources: provenance.data.sources });
            if (!material.length) throw new SettingsError('No approved sources in this Subject. Create a Learning Document and choose Ready to Practice. Goals and organisation chat remains available with practice switched off.', 422);
          }
          let reviewed: unknown[] = [];
          if (input.practice) {
            const observations = await client.from('reviewed_observations').select('observation,coverage_from,coverage_to').eq('account_id', account.id).eq('subject_id', input.subject).order('created_at');
            if (observations.error) throw new SettingsError('Reviewed understanding could not be loaded. No generation was started.');
            reviewed = observations.data;
          }
          const snapshot = await client.from('conversation_turns').select('assessment_context').eq('id', input.operation).single();
          if (snapshot.error) throw new SettingsError('Assessment progress could not be loaded. No generation was started.');
          const state = snapshot.data.assessment_context?.revision !== undefined ? snapshot.data.assessment_context as Assessment : null;
          const assessing = input.practice && (state !== null || assessmentRequested(input.text));
          const plan = assessing ? assessmentInstructions(state, input.text) : null;
          let raw = '', providerComplete = false;
          for await (const event of streamConversation(context, abort.signal, material, reviewed, plan?.instructions)) {
            if (event.delta) {
              if (new TextEncoder().encode(raw + event.delta).length > 16000) throw new Error('Output limit');
              raw += event.delta;
              if (!assessing) {
                text = raw;
                if (Date.now() - lastCheckpoint > 500) { await persist(false); lastCheckpoint = Date.now(); }
                send({ delta: event.delta });
              }
            }
            if (event.complete && raw.trim()) providerComplete = true;
          }
          if (plan && providerComplete) {
            const output = readAssessmentOutput(raw, state, input.text, plan);
            const result = await writer.rpc('server_assessment_reply', { p_owner: account.id, p_subject: input.subject, p_conversation: input.conversation, p_operation: input.operation, p_text: output.reply, p_topic: output.topic, p_requested_difficulty: output.requested_difficulty, p_action: output.action, p_question: output.question, p_difficulty: output.difficulty, p_budget: output.budget });
            if (result.error || !result.data) throw new SettingsError('Assessment changed or progress could not be saved. Reload to inspect it. No automatic retry was made.');
            assessmentSaved = true; text = output.reply; complete = true;
            send({ delta: text, assessment: result.data });
          } else if (!assessing) complete = providerComplete;
        } catch (cause) {
          if (cause instanceof SettingsError) error = cause.message;
        } finally {
          clearTimeout(timeout);
          try { if (!assessmentSaved) await persist(true); send({ status: complete ? 'complete' : 'incomplete', ...(complete ? {} : { error }) }); }
          catch { send({ status: 'incomplete', error: 'Reply persistence could not be confirmed. Reload to check saved history. No automatic generation retry was made.' }); }
          try { controller.close(); } catch { /* Client disconnected. */ }
        }
      },
      cancel() { abort.abort(); },
    });
    return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' } });
  } catch { return reply({ error: 'Send could not be confirmed. Retry the same send to avoid duplication.' }, 503); }
}
