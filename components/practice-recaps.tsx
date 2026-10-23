'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { documentId } from '@/lib/document-id';

type Interpretation = { text: string; difficulty: string; assistance: string; uncertainty: string };
type Recap = { id: string; status: string; proposal: Interpretation | null; coverage_from: number; coverage_to: number };
type Observation = { id: string; observation: Interpretation; conversation_id: string | null; coverage_from: number; coverage_to: number; sources: { id: string; title: string; revision: number; deleted: boolean }[] };
type State = { recaps: Recap[]; observations: Observation[]; through: number };
const fields = ['text', 'difficulty', 'assistance', 'uncertainty'] as const;

export default function PracticeRecaps({ subject, conversation, activity, checkpoint, disabled }: { subject: string; conversation: string; activity: string; checkpoint: boolean; disabled: boolean }) {
  const [state, setState] = useState<State>({ recaps: [], observations: [], through: 0 });
  const [edits, setEdits] = useState<Record<string, Interpretation>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const mutation = useRef<AbortController | null>(null);
  useEffect(() => () => mutation.current?.abort(), []);
  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`/api/recaps?subject=${subject}&conversation=${conversation}`, { cache: 'no-store', signal });
    if (!response.ok) throw new Error('Could not load reviewed understanding.');
    const data = await response.json();
    if (!signal?.aborted) setState(data);
  }, [subject, conversation]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void load(controller.signal).catch(() => { if (!controller.signal.aborted) setNotice('Could not load reviewed understanding.'); }); }, 0);
    const clear = () => { controller.abort(); mutation.current?.abort(); setState({ recaps: [], observations: [], through: 0 }); setEdits({}); setNotice(''); };
    window.addEventListener('account-state-cleared', clear);
    return () => { window.clearTimeout(timer); controller.abort(); window.removeEventListener('account-state-cleared', clear); };
  }, [load, activity]);
  async function act(action: string, recap?: Recap) {
    setBusy(true); setNotice('');
    const controller = new AbortController(); mutation.current = controller;
    try {
      const response = await fetch('/api/recaps', { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, conversation, operation: recap?.id ?? documentId(), action, ...(action === 'corrected' ? { observation: edits[recap!.id] } : {}) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await load(controller.signal);
      if (controller.signal.aborted) return;
      setNotice(action === 'generate' ? 'Provisional recap saved. Review it or keep talking.' : action === 'dismissed' ? 'Recap dismissed. Earlier observations unchanged.' : 'Reviewed observation saved. Newer discussion remains tentative.');
    } catch (cause) { if (!controller.signal.aborted) setNotice(cause instanceof Error ? cause.message : 'Recap outcome unconfirmed. Reload to check.'); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  return <section aria-label="Practice recaps" className="space-y-3 rounded-xl border p-3 text-sm">
    <h3 className="font-medium">Practice recaps · Subject understanding</h3>
    <p>Proposals are tentative until reviewed. Reviewed through activity {state.through}; later discussion is tentative. Review never ends this conversation.</p>
    {checkpoint && <p>A meaningful activity checkpoint was reached. You can review a recap or keep talking.</p>}
    <Button variant="outline" disabled={busy || disabled} onClick={() => void act('generate')}>Request Practice recap</Button>
    {state.recaps.map(recap => <article key={recap.id} className="space-y-2 rounded-lg border p-3" aria-label={`Recap activity ${recap.coverage_from}–${recap.coverage_to}`}>
      <h4>Activity {recap.coverage_from}–{recap.coverage_to} · {recap.status === 'proposed' ? 'Tentative proposal' : recap.status}</h4>
      {recap.proposal && fields.map(field => <label key={field} className="block capitalize">{field === 'text' ? 'Observation' : field}
        <Textarea aria-label={`Recap ${field}`} value={(edits[recap.id] ?? recap.proposal!)[field]} readOnly={recap.status !== 'proposed'} onChange={event => setEdits(current => ({ ...current, [recap.id]: { ...(current[recap.id] ?? recap.proposal!), [field]: event.target.value } }))} />
      </label>)}
      {recap.status === 'pending' && <p>Generation pending or interrupted. Reload to check; no automatic retry. Requesting a new recap may incur another charge.</p>}
      {recap.status === 'proposed' && <div className="flex flex-wrap gap-2">
        <Button disabled={busy || Boolean(edits[recap.id])} onClick={() => void act('accepted', recap)}>Accept recap</Button>
        <Button disabled={busy || !edits[recap.id]} onClick={() => void act('corrected', recap)}>Save corrected recap</Button>
        <Button variant="ghost" disabled={busy} onClick={() => void act('dismissed', recap)}>Dismiss recap</Button>
      </div>}
    </article>)}
    <details><summary className="min-h-11 cursor-pointer">Reviewed observations · {state.observations.length}</summary>
      <p>Provisional learning context, not mastery or verified subject facts.</p>
      {state.observations.map(item => <article key={item.id} className="my-3 space-y-2 border-t pt-3">
        {fields.map(field => <p key={field} className="whitespace-pre-wrap break-words"><b>{field === 'text' ? 'Observation' : field}:</b> {item.observation[field]}</p>)}
        <p>Activity {item.coverage_from}–{item.coverage_to} · {item.conversation_id ? <a className="underline" href={`/?subject=${subject}&conversation=${item.conversation_id}`}>Source conversation</a> : 'Source conversation deleted'}</p>
        {item.sources.map(source => <p key={`${source.id}-${source.revision}`}>{source.title} · Practice version {source.revision}{source.deleted ? ' · Source deleted' : ''}</p>)}
      </article>)}
    </details>
    <p role="status">{notice}</p>
  </section>;
}
