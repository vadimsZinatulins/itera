'use client';

import { Fragment, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import s from './learning-documents.module.css';
import { documentId } from '@/lib/document-id';

type Block = { id: string; markdown: string };
type Snapshot = { revision: number; title: string; description: string; blocks: Block[] };
type Draft = Snapshot & { id: string; subject_id: string; practice_version?: Snapshot | null };
function documentStatus(doc: Draft) {
  return !doc.practice_version ? 'Draft' : doc.practice_version.revision === doc.revision ? 'Available for practice' : 'Draft revision';
}
function searchable(doc: Snapshot) {
  return `${doc.title} ${doc.description} ${doc.blocks.map(b => b.markdown).join(' ')}`;
}
function assembled(doc: Snapshot) {
  return [`# ${doc.title.trim() || 'Untitled Learning Document'}`, doc.description, ...doc.blocks.map(b => b.markdown)].filter(Boolean).join('\n\n') + '\n';
}
function Markdown({ children }: { children: string }) {
  return <div className={`${s.markdown} break-words`}><ReactMarkdown>{children}</ReactMarkdown></div>;
}

type SessionEdits = { draft: Draft | null; saved: Draft | null; editing: Record<string, string>; busy: boolean };
function hasUnsavedEdits(session: SessionEdits) {
  return !!session.draft && (Object.keys(session.editing).length > 0 || JSON.stringify(session.draft) !== JSON.stringify(session.saved));
}

// Lives only in the account's mounted page, not browser storage. Subject history
// navigation can remount an editor without destroying its outstanding buffers.
export default function LearningDocuments({ subjectId }: { subjectId: string }) {
  const [sessions] = useState(() => new Map<string, SessionEdits>());
  useEffect(() => {
    const hasEdits = () => [...sessions.values()].some(hasUnsavedEdits);
    const unload = (event: BeforeUnloadEvent) => { if (hasEdits()) event.preventDefault(); };
    const navigation = (event: Event) => {
      if (!hasEdits()) return;
      if ([...sessions.values()].some(session => session.busy) || !window.confirm('Discard unsaved document edits in all Subjects and leave? Cancel to return and save your Drafts.')) {
        event.preventDefault(); return;
      }
      for (const [id, session] of sessions) sessions.set(id, { ...session, draft: session.saved, editing: {} });
      window.dispatchEvent(new Event('document-discard'));
    };
    window.addEventListener('beforeunload', unload);
    window.addEventListener('document-navigation', navigation);
    return () => { window.removeEventListener('beforeunload', unload); window.removeEventListener('document-navigation', navigation); };
  }, [sessions]);
  return <DocumentWorkspace key={subjectId} subjectId={subjectId} sessions={sessions} />;
}

function DocumentWorkspace({ subjectId, sessions }: { subjectId: string; sessions: Map<string, SessionEdits> }) {
  const initial = sessions.get(subjectId);
  const [documents, setDocuments] = useState<Draft[]>([]);
  const [draft, setDraft] = useState<Draft | null>(initial?.draft ?? null);
  const [saved, setSaved] = useState<Draft | null>(initial?.saved ?? null);
  const [editing, setEditing] = useState<Record<string, string>>(initial?.editing ?? {});
  const [removed, setRemoved] = useState<{ block: Block; index: number } | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [output, setOutput] = useState<'preview' | 'markdown' | 'practice' | 'approve' | null>(null);
  const [newer, setNewer] = useState<Draft | null>(null);
  const dirty = hasUnsavedEdits({ draft, saved, editing, busy });

  useEffect(() => { sessions.set(subjectId, { draft, saved, editing, busy }); }, [sessions, subjectId, draft, saved, editing, busy]);
  useEffect(() => {
    let active = true;
    fetch(`/api/documents?subject=${subjectId}`).then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (active) setDocuments(data);
    }).catch(() => { if (active) setError('Could not load documents. Reload to try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [subjectId]);
  useEffect(() => {
    const discard = () => { setDraft(saved); setEditing({}); };
    window.addEventListener('document-discard', discard);
    return () => window.removeEventListener('document-discard', discard);
  }, [saved]);
  function leave() { return !dirty || window.confirm('Discard unsaved document edits? Cancel to stay and save your Draft.'); }
  function open(doc: Draft) { setDraft(doc); setSaved(doc.revision ? doc : null); setEditing({}); setRemoved(null); setError(''); setStatus(doc.revision ? `Saved on server · ${documentStatus(doc)}` : 'Unsaved local edits'); setNewer(null); }
  function blocks(value: Block[]) { if (draft) setDraft({ ...draft, blocks: value }); }
  function insert(index: number) {
    if (!draft) return;
    const block = { id: documentId(), markdown: '' };
    const next = [...draft.blocks]; next.splice(index, 0, block); blocks(next);
    setEditing({ ...editing, [block.id]: '' });
  }
  function finish(id: string, save: boolean) {
    if (save && draft) blocks(draft.blocks.map(b => b.id === id ? { ...b, markdown: editing[id] } : b));
    setEditing(current => { const next = { ...current }; delete next[id]; return next; });
  }
  async function save() {
    if (!draft) return;
    setBusy(true); setError(''); setStatus('Saving…');
    try {
      const response = await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, subjectId }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error); setStatus('Save failed · unsaved local edits retained'); return; }
      setDraft(result); setSaved(result); setNewer(null);
      setDocuments(current => [result, ...current.filter(doc => doc.id !== result.id)]);
      setStatus(`Saved on server · ${documentStatus(result)} · ${result.practice_version ? 'Practice version unchanged' : 'not approved for practice'}`);
    } catch { setError('Save failed. Check your connection; your edits remain here.'); setStatus('Save failed · unsaved local edits retained'); }
    finally { setBusy(false); }
  }
  async function approve() {
    if (!saved || dirty || busy) return;
    setBusy(true); setError(''); setStatus('Approving…');
    try {
      const response = await fetch('/api/documents/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: saved.id, subjectId, revision: saved.revision }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error); setStatus('Approval not confirmed · refresh and review'); return; }
      setDraft(result); setSaved(result); setNewer(null);
      setDocuments(current => [result, ...current.filter(doc => doc.id !== result.id)]);
      setStatus('Saved on server · Available for practice · not demonstrated understanding');
    } catch { setError('Approval could not be confirmed. Refresh and review before retrying.'); setStatus('Approval not confirmed'); }
    finally { setBusy(false); setOutput(null); }
  }
  async function reviewSaved() {
    try {
      const response = await fetch(`/api/documents?subject=${subjectId}`);
      if (!response.ok) throw new Error();
      const latest: Draft[] = await response.json();
      const match = latest.find(doc => doc.id === draft?.id);
      if (!match) { setError('Saved document unavailable. Your attempted text remains here.'); return; }
      setNewer(match);
    } catch { setError('Could not refresh. Your attempted text remains here. Try again.'); }
  }
  if (!draft) return <section className="mt-8 space-y-5" aria-label="Learning Documents">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-semibold">Learning Documents</h2><Button disabled={loading} onClick={() => open({ id: documentId(), subject_id: subjectId, revision: 0, title: '', description: '', blocks: [] })}>New Learning Document</Button></div>
    <Input aria-label="Search Learning Documents" placeholder="Search titles and content…" value={query} onChange={e => setQuery(e.target.value)} />
    {error && <p role="alert">{error}</p>}{loading && <p role="status">Loading documents…</p>}
    <div className="flex flex-wrap gap-2" aria-label="Filter documents">{[['all', 'All'], ['draft', 'Drafts'], ['revision', 'Draft revisions'], ['practice', 'Available for practice']].map(([value, label]) => <Button key={value} variant={filter === value ? 'secondary' : 'ghost'} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</Button>)}</div>
    <p className="text-xs text-muted-foreground">Only approved Practice versions are eligible. Draft revisions are excluded while the previous Practice version remains available.</p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{documents.filter(doc => (filter === 'all' || (filter === 'practice' ? !!doc.practice_version : filter === 'draft' ? !doc.practice_version : documentStatus(doc) === 'Draft revision')) && `${searchable(doc)} ${doc.practice_version ? searchable(doc.practice_version) : ''}`.toLowerCase().includes(query.toLowerCase())).map(doc => <button key={doc.id} className="min-w-0 space-y-2 rounded-xl border p-5 text-left hover:bg-muted focus-visible:ring-2" aria-label={`Open ${doc.title || 'Untitled Learning Document'}`} onClick={() => open(doc)}><h3 className="break-words font-medium">{doc.title || 'Untitled Learning Document'}</h3><p className="break-words text-sm text-muted-foreground">{doc.description}</p><p className="text-xs">{documentStatus(doc)} · {doc.blocks.length} blocks{documentStatus(doc) === 'Draft revision' ? ' · approved version available for practice' : ''}</p></button>)}</div>
    {!loading && !documents.length && <p>No Learning Documents yet. Create a Draft to capture study material.</p>}
  </section>;
  const selected = output === 'practice' ? saved?.practice_version : saved;
  const markdown = selected ? assembled(selected) : '';
  return <section className="mx-auto mt-8 max-w-4xl space-y-5" aria-label="Document editor">
    <Button variant="ghost" disabled={busy} onClick={() => { if (leave()) { setDraft(null); setEditing({}); setError(''); } }}>All Learning Documents</Button>
    <fieldset disabled={busy} className="min-w-0 space-y-5">
      <label className="grid gap-2">Document title<Input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label>
      <label className="grid gap-2">Document description<Textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></label>
      <p className="text-sm">{dirty && draft.practice_version ? 'Draft revision' : documentStatus(draft)} · {draft.practice_version ? 'Only the approved snapshot is eligible; later Draft changes stay out of practice.' : 'Drafts are excluded from practice.'} Approval means material encountered, not demonstrated understanding.</p>
      <div className="flex flex-wrap gap-2"><Button disabled={!dirty || Object.keys(editing).length > 0} onClick={save}>Save as Draft</Button><Button variant="outline" disabled={!saved} onClick={() => setOutput('preview')}>Document preview</Button><Button variant="outline" disabled={!saved} onClick={() => setOutput('markdown')}>Final Markdown</Button></div>
      <div className="flex flex-wrap gap-2"><Button disabled={dirty || !saved || !saved.title.trim() || !saved.blocks.some(b => /[\p{L}\p{N}]/u.test(b.markdown)) || saved.practice_version?.revision === saved.revision} onClick={() => setOutput('approve')}>{saved?.practice_version ? 'Update practice version' : 'Ready to Practice'}</Button>{saved?.practice_version && <Button variant="outline" onClick={() => setOutput('practice')}>View practice version</Button>}{dirty && saved && <Button variant="outline" onClick={() => { setDraft(saved); setEditing({}); setRemoved(null); setError(''); setStatus(`Saved on server · ${documentStatus(saved)}`); }}>Discard local edits</Button>}</div>
      {dirty && <p className="text-sm">Save or discard outstanding edits before approval. Open blocks must be saved locally or cancelled first.</p>}
      <p role="status">{busy ? status : dirty && !error ? 'Unsaved local edits · not saved on server' : status}</p>
      {error && <div className="space-y-2"><p role="alert">{error}</p><Button variant="outline" onClick={reviewSaved}>Refresh and review saved version</Button></div>}
      <p className="text-xs text-muted-foreground">Save or cancel open blocks before saving the Draft. Block saves are local until Save as Draft succeeds. Unsaved edits are kept only in this session; not offline recovery. Double-click a block to edit, or use Edit.</p>
      {draft.blocks.map((block, index) => <Fragment key={block.id}>
        <Button variant="outline" className="min-h-11" onClick={() => insert(index)}>Insert block before block {index + 1}</Button>
        <article aria-label={`Block ${index + 1}`} className={`${s.markdownBlock} min-w-0 rounded-xl border p-4`}>
          {block.id in editing ? <div className="space-y-3"><label className="grid gap-2">Block {index + 1} Markdown<Textarea autoFocus className="min-h-48 font-mono" value={editing[block.id]} onChange={e => setEditing({ ...editing, [block.id]: e.target.value })} onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); finish(block.id, true); } }} /></label><Button onClick={() => finish(block.id, true)}>Save block</Button> <Button variant="outline" onClick={() => finish(block.id, false)}>Cancel</Button></div> : <>
            <div className={`${s.blockTools} mb-3 flex flex-wrap gap-2`}><Button variant="ghost" aria-label={`Edit block ${index + 1}`} onClick={() => setEditing({ ...editing, [block.id]: block.markdown })}>Edit</Button><Button variant="ghost" disabled={index === 0} onClick={() => { const next = [...draft.blocks]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; blocks(next); }} aria-label={`Move block ${index + 1} up`}>↑</Button><Button variant="ghost" disabled={index === draft.blocks.length - 1} onClick={() => { const next = [...draft.blocks]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; blocks(next); }} aria-label={`Move block ${index + 1} down`}>↓</Button><Button variant="ghost" aria-label={`Delete block ${index + 1}`} onClick={() => { setRemoved({ block, index }); blocks(draft.blocks.filter(b => b.id !== block.id)); }}>Delete</Button></div>
            <div className="min-h-20" onDoubleClick={e => { if (!(e.target instanceof Element) || !e.target.closest('a,button')) setEditing({ ...editing, [block.id]: block.markdown }); }}><Markdown>{block.markdown || '*Empty block. Choose Edit.*'}</Markdown></div>
          </>}
        </article>
      </Fragment>)}
      <Button variant="outline" className="min-h-11 w-full" onClick={() => insert(draft.blocks.length)}>Add Markdown block</Button>
      {removed && <div className="flex flex-wrap items-center gap-3"><p>Block removed.</p><Button variant="outline" onClick={() => { const next = [...draft.blocks]; next.splice(Math.min(removed.index, next.length), 0, removed.block); blocks(next); setRemoved(null); }}>Undo delete</Button></div>}
    </fieldset>
    {newer && <aside className="space-y-4 rounded-xl border p-4"><h2 className="font-semibold">Latest saved version · your attempted edits remain above</h2><Markdown>{assembled(newer)}</Markdown><Button variant="outline" onClick={() => { if (window.confirm('Discard your attempted edits and use this saved version?')) open(newer); }}>Discard attempted edits and use saved version</Button></aside>}
    <Dialog open={!!output} onOpenChange={value => { if (!value && !busy) setOutput(null); }}><DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-4xl"><DialogTitle>{output === 'practice' ? 'Approved practice version' : output === 'approve' ? 'Review saved version for practice' : output === 'preview' ? 'Document preview' : 'Final Markdown'}</DialogTitle><DialogDescription>{output === 'practice' ? 'Only this approved snapshot is eligible. Draft revisions are excluded.' : output === 'approve' ? 'Approve this complete saved snapshot only after review. Approval means material encountered, not demonstrated understanding.' : 'Saved Draft only, in block order. Unsaved edits are excluded. Exporting does not approve material and is not an account backup.'}</DialogDescription><div className="min-h-0 overflow-auto">{output !== 'markdown' ? <Markdown>{markdown}</Markdown> : <pre className="whitespace-pre-wrap break-words">{markdown}</pre>}</div><div className="flex flex-wrap gap-2">{output === 'approve' && <Button disabled={busy || dirty} onClick={approve}>{busy ? 'Approving…' : 'Approve saved version'}</Button>}<Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(markdown); setStatus(`${output === 'practice' ? 'Practice version' : 'Saved Draft'} Markdown copied.`); } catch { setStatus('Clipboard unavailable. Select text in Final Markdown to copy.'); } }}>Copy Markdown</Button><Button onClick={() => { const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' })); const a = window.document.createElement('a'); a.href = url; a.download = (selected?.title.replace(/[^a-z0-9-]+/gi, '-') || 'learning-document') + '.md'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}>Download .md</Button></div></DialogContent></Dialog>
  </section>;
}
