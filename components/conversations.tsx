'use client';

import { useEffect, useRef, useState } from 'react';
import { History, MessageCircle, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { documentId as operationId } from '@/lib/document-id';
import styles from './conversations.module.css';

type Thread = { id: string; title: string };
type Source = { id: string; title: string; revision: number };
type Turn = { practice?: boolean; sources?: Source[]; id: string; ordinal: number; user_text: string; assistant_text: string; status: 'complete' | 'incomplete'; pending_until: string };
type Operation = { subject: string; conversation: string; operation: string; text: string; practice: boolean };

export default function Conversations({ subjectId, initialConversation }: { subjectId: string; initialConversation?: string }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState(initialConversation ?? '');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [practice, setPractice] = useState(false);
  const [loading, setLoading] = useState(Boolean(initialConversation));
  const [notice, setNotice] = useState('');
  const [mobile, setMobile] = useState<'threads' | 'chat'>('chat');
  const [retry, setRetry] = useState<Operation | null>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  function url(id: string) {
    const next = new URL(window.location.href);
    if (id) next.searchParams.set('conversation', id); else next.searchParams.delete('conversation');
    window.history.replaceState(null, '', next);
  }
  async function trail(signal?: AbortSignal) {
    const response = await fetch(`/api/conversations?subject=${subjectId}`, { cache: 'no-store', signal });
    if (!response.ok) throw new Error('Could not load your trail. Try reloading.');
    setThreads(await response.json());
  }
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/conversations?subject=${subjectId}`, { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Trail unavailable');
      const data = await response.json();
      if (!controller.signal.aborted) setThreads(data);
    }).catch(() => { if (!controller.signal.aborted) setNotice('Could not load your trail. Try reloading.'); });
    return () => { controller.abort(); abort.current?.abort(); };
  }, [subjectId]);
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/conversations?subject=${subjectId}&conversation=${selected}`, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Conversation unavailable. Choose another thread or reload.');
        const data = await response.json();
        if (!controller.signal.aborted) { setTurns(data); setPractice(data.at(-1)?.practice ?? false); }
      } catch { if (!controller.signal.aborted) setNotice('Conversation unavailable. Choose another thread or reload.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [selected, subjectId]);
  useEffect(() => { transcript.current?.scrollTo({ top: transcript.current.scrollHeight }); }, [turns]);

  function choose(id: string) {
    if (busy) return;
    if (id && id === selected) { setMobile('chat'); return; }
    setLoading(Boolean(id)); setSelected(id); setTurns([]); setDraft(''); setRetry(null); setNotice(''); setMobile('chat'); url(id);
  }
  async function send() {
    if (busy || loading || (!retry && !draft.trim())) return;
    const operation = retry ?? { subject: subjectId, conversation: selected || operationId(), operation: operationId(), text: draft, practice };
    setRetry(operation); setBusy(true); setNotice('Sending — not yet confirmed saved.');
    const controller = new AbortController(); abort.current = controller;
    let saved = false;
    try {
      const response = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(operation), signal: controller.signal });
      if (!response.ok) {
        // A definitive rejection did not save this send. Keep text editable;
        // ambiguous transport/server failures retain the exact operation instead.
        if (response.status >= 400 && response.status < 500) setRetry(null);
        const result = await response.json(); throw new Error(result.error ?? 'Send failed.');
      }
      if (response.headers.get('content-type')?.includes('application/json')) {
        setSelected(operation.conversation); url(operation.conversation); setDraft(''); setRetry(null);
        const history = await fetch(`/api/conversations?subject=${subjectId}&conversation=${operation.conversation}`, { cache: 'no-store' });
        if (!history.ok) throw new Error('Saved message found, but history could not be loaded. Reload to check.');
        setTurns(await history.json()); await trail();
        setNotice('Message already saved. No generation was retried.'); return;
      }
      const reader = response.body!.getReader(); const decoder = new TextDecoder(); let buffer = '', ended = false;
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let end;
        while ((end = buffer.indexOf('\n')) !== -1) {
          const event = JSON.parse(buffer.slice(0, end)); buffer = buffer.slice(end + 1);
          if (event.saved) {
            saved = true; setDraft(''); setRetry(null); url(operation.conversation);
            setTurns(current => [...current.filter(turn => turn.id !== operation.operation), { id: operation.operation, ordinal: current.length + 1, user_text: operation.text, assistant_text: '', status: 'incomplete', pending_until: '' }]);
            setThreads(current => current.some(thread => thread.id === operation.conversation) ? current : [{ id: operation.conversation, title: operation.text.slice(0, 80) }, ...current]);
            setNotice('Message saved. Reply streaming — not complete yet.');
          }
          if (event.sources) setTurns(current => current.map(turn => turn.id === operation.operation ? { ...turn, sources: event.sources } : turn));
          if (event.delta) setTurns(current => current.map(turn => turn.id === operation.operation ? { ...turn, assistant_text: turn.assistant_text + event.delta } : turn));
          if (event.status) {
            ended = true;
            setTurns(current => current.map(turn => turn.id === operation.operation ? { ...turn, status: event.status } : turn));
            setNotice(event.error ?? 'Message and complete reply saved.');
          }
        }
      }
      if (!ended) setNotice('Reply interrupted — incomplete. Reload to inspect saved output. No automatic generation retry was made.');
    } catch (error) {
      if (!controller.signal.aborted) setNotice(error instanceof Error ? error.message : 'Send failed. Retry the same send to check persistence.');
    } finally {
      setBusy(false);
      if (saved) setSelected(operation.conversation);
    }
  }
  return <section className="mt-8" aria-label="Learning Trail">
    <h2 className="text-xl font-semibold">Pick up a thread.</h2>
    <p className="my-3 text-sm text-muted-foreground">Talk about goals, organise your study, or explicitly ask for writing assistance. Source-based practice needs approved Learning Documents: switch on Use approved sources, then request practice, an explanation or a hint. Without approved material, write a Learning Document and choose Ready to Practice. Ordinary chat stays available with the switch off. Authored material and assisted reasoning are not independent evidence of understanding.</p>
    <nav className={styles.mobileNav} aria-label="Conversation views">
      <Button variant={mobile === 'threads' ? 'secondary' : 'ghost'} aria-pressed={mobile === 'threads'} onClick={() => setMobile('threads')}><History />Threads</Button>
      <Button variant={mobile === 'chat' ? 'secondary' : 'ghost'} aria-pressed={mobile === 'chat'} onClick={() => setMobile('chat')}><MessageCircle />Chat</Button>
    </nav>
    <div className={styles.workspace} data-view={mobile}>
      <aside className={styles.trail} aria-label="Conversation threads" tabIndex={0}>
        <Button className="mb-4 min-h-11 w-full" variant="outline" disabled={busy} onClick={() => choose('')}><Plus />A new thread</Button>
        {!threads.length && <p className="text-sm leading-7 text-muted-foreground">Your first saved message adds a conversation here. Return whenever you like.</p>}
        {threads.map(thread => <button key={thread.id} disabled={busy} aria-current={selected === thread.id ? 'true' : undefined} className="mb-2 block min-h-11 w-full rounded-lg border p-3 text-left text-sm break-words aria-[current=true]:bg-muted" onClick={() => choose(thread.id)}>{thread.title}</button>)}
      </aside>
      <section className={styles.chat} aria-label="Subject conversation">
        <header className="border-b p-4 text-sm font-medium">{selected ? 'Continue this conversation' : 'What’s on your mind?'}</header>
        <div ref={transcript} className={styles.transcript} aria-label="Conversation messages" tabIndex={0} aria-busy={loading}>
          {loading && <p>Loading saved history…</p>}
          {!turns.length && !loading && <p className="text-sm text-muted-foreground">Send a message to begin. Leaving does not finish a conversation.</p>}
          {turns.map(turn => <div key={turn.id} className="space-y-4">
            <article className="ml-4 rounded-xl bg-muted p-4"><h3 className="mb-1 text-xs font-medium">You · saved</h3><p className="whitespace-pre-wrap break-words text-sm leading-7">{turn.user_text}</p></article>
            <article className="p-2">{Boolean(turn.sources?.length) && <details className="mb-3 text-sm"><summary className="min-h-11 cursor-pointer">Approved sources selected · {turn.sources!.length}</summary><ul className="break-words">{turn.sources!.map(source => <li key={source.id}>{source.title} · Practice version {source.revision} <span className="break-all text-xs text-muted-foreground">({source.id})</span></li>)}</ul><p className="text-xs text-muted-foreground">Versions selected for this reply, not proof every source was used or an incomplete request reached OpenAI. Later updates do not change this record.</p></details>}<h3 className="mb-1 text-xs font-medium">Companion · {turn.status === 'complete' ? 'complete' : 'incomplete'}</h3><p className="whitespace-pre-wrap break-words text-sm leading-7">{turn.assistant_text || 'No completed reply saved.'}</p></article>
          </div>)}
        </div>
        <form className="shrink-0 border-t p-3" onSubmit={event => { event.preventDefault(); void send(); }}>
          <label className="mb-3 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={practice} disabled={busy || loading || Boolean(retry)} onChange={event => setPractice(event.target.checked)} />Use approved sources for practice, explanations and hints</label>
          <label htmlFor="conversation-message" className="sr-only">Your message</label>
          <Textarea id="conversation-message" className="min-h-20 max-h-36 text-base" value={draft} disabled={busy || Boolean(retry)} onChange={event => setDraft(event.target.value)} placeholder="Bring a question…" />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{retry ? 'Unconfirmed send retained in this session' : 'Unsent text is not server-saved'}</span><Button type="submit" className="min-h-11" disabled={busy || loading || (!retry && !draft.trim())}><Send />{busy ? 'Sending…' : retry ? 'Retry same send' : 'Send message'}</Button></div>
        </form>
      </section>
    </div>
    <p aria-live="polite" aria-label="Conversation status" className="mt-3 text-sm">{notice}</p>
    <p className="mt-3 text-xs leading-6 text-muted-foreground">This conversation and, only with Use approved sources enabled, current approved Practice versions in this Subject are sent to OpenAI. Drafts and Reference notes are excluded. Sources are bounded to 20 documents / 16,000 bytes; oversized context is refused, not silently truncated. Requests use your selected key/model. History is stored in this app with optional provider response storage disabled. This does not eliminate provider retention: abuse-monitoring logs may retain content for up to 30 days, with policy exceptions. API usage may incur charges. Replies are limited to 2,048 output tokens; messages to 8,000 UTF-8 bytes and conversation context to 28,000 bytes. No automatic generation retries.</p>
  </section>;
}
