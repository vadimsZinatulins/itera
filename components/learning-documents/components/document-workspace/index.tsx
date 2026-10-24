'use client';

import { Fragment, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { documentId } from '@/lib/document-id';
import type { DocumentBlock, LearningDocument } from '@/lib/documents/types';
import { readDocuments } from '../../actions/read-documents';
import { assembled, documentStatus, hasUnsavedEdits } from '../../helpers/documents';
import DocumentList from '../document-list';
import DocumentOutput from '../document-output';
import type { DocumentOutputMode } from '../document-output/types';
import Markdown from '../markdown';
import type { DocumentReadState, DocumentWorkspaceProps, RemovedBlock } from './types';
import s from '../../learning-documents.module.css';

export default function DocumentWorkspace({ subjectId, sessions }: DocumentWorkspaceProps) {
  const initial = sessions.get(subjectId);
  const [documents, setDocuments] = useState<LearningDocument[]>([]);
  const [draft, setDraft] = useState<LearningDocument | null>(initial?.draft ?? null);
  const [saved, setSaved] = useState<LearningDocument | null>(initial?.saved ?? null);
  const [editing, setEditing] = useState<Record<string, string>>(initial?.editing ?? {});
  const [removed, setRemoved] = useState<RemovedBlock | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [readState, setReadState] = useState<DocumentReadState>({ status: 'loading' });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [output, setOutput] = useState<DocumentOutputMode | null>(null);
  const [newer, setNewer] = useState<LearningDocument | null>(null);
  const dirty = hasUnsavedEdits({ draft, saved, editing, busy });

  useEffect(() => {
    sessions.set(subjectId, { draft, saved, editing, busy });
  }, [sessions, subjectId, draft, saved, editing, busy]);
  useEffect(() => {
    let active = true;
    readDocuments(subjectId).then(([readError, data]) => {
      if (!active) {
        return;
      }
      if (readError !== null) {
        setError(readError.message);
        setReadState({ status: 'unavailable', message: readError.message });
      } else {
        setDocuments(data);
        setReadState({ status: 'ready' });
      }
    });
    return () => {
      active = false;
    };
  }, [subjectId]);
  useEffect(() => {
    const discard = () => {
      setDraft(saved);
      setEditing({});
    };
    window.addEventListener('document-discard', discard);
    return () => window.removeEventListener('document-discard', discard);
  }, [saved]);
  function leave() {
    return !dirty || window.confirm('Discard unsaved document edits? Cancel to stay and save your Draft.');
  }
  function open(doc: LearningDocument) {
    setDraft(doc);
    setSaved(doc.revision ? doc : null);
    setEditing({});
    setRemoved(null);
    setError('');
    setStatus(doc.revision ? `Saved on server · ${documentStatus(doc)}` : 'Unsaved local edits');
    setNewer(null);
  }
  function blocks(value: DocumentBlock[]) {
    if (draft) {
      setDraft({ ...draft, blocks: value });
    }
  }
  function insert(index: number) {
    if (!draft) {
      return;
    }
    const block = { id: documentId(), markdown: '' };
    const next = [...draft.blocks];
    next.splice(index, 0, block);
    blocks(next);
    setEditing({ ...editing, [block.id]: '' });
  }
  function finish(id: string, save: boolean) {
    if (save && draft) {
      blocks(draft.blocks.map(b => b.id === id ? { ...b, markdown: editing[id] } : b));
    }
    setEditing(current => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }
  function acceptSavedDocument(document: LearningDocument) {
    setDraft(document);
    setSaved(document);
    setNewer(null);
    setDocuments(current => [document, ...current.filter(doc => doc.id !== document.id)]);
  }
  async function save() {
    if (!draft) {
      return;
    }
    setBusy(true);
    setError('');
    setStatus('Saving…');
    try {
      const response = await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: draft.id, subjectId, revision: draft.revision, title: draft.title, description: draft.description, blocks: draft.blocks }) });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error);
        setStatus('Save failed · unsaved local edits retained');
        return;
      }
      acceptSavedDocument(result);
      setStatus(`Saved on server · ${documentStatus(result)} · ${result.practice_version ? 'Practice version unchanged' : 'not approved for practice'}`);
    } catch {
      setError('Save failed. Check your connection; your edits remain here.');
      setStatus('Save failed · unsaved local edits retained');
    } finally {
      setBusy(false);
    }
  }
  async function approve() {
    if (!saved || dirty || busy) {
      return;
    }
    setBusy(true);
    setError('');
    setStatus('Approving…');
    try {
      const response = await fetch('/api/documents/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: saved.id, subjectId, revision: saved.revision }) });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error);
        setStatus('Approval not confirmed · refresh and review');
        return;
      }
      acceptSavedDocument(result);
      setStatus('Saved on server · Available for practice · not demonstrated understanding');
    } catch {
      setError('Approval could not be confirmed. Refresh and review before retrying.');
      setStatus('Approval not confirmed');
    } finally {
      setBusy(false);
      setOutput(null);
    }
  }
  async function reviewSaved() {
    const [readError, latest] = await readDocuments(subjectId);
    if (readError !== null) {
      setError(readError.code === 'reauthenticate' ? readError.message : 'Could not refresh. Your attempted text remains here. Try again.');
      return;
    }
    const match = latest.find(doc => doc.id === draft?.id);
    if (!match) {
      setError('Saved document unavailable. Your attempted text remains here.');
      return;
    }
    setNewer(match);
  }
  if (!draft) {
    return <DocumentList documents={documents} loading={readState.status === 'loading'} error={readState.status === 'unavailable' ? readState.message : ''} query={query} filter={filter}
      onQueryChange={setQuery} onFilterChange={setFilter} onOpen={open}
      onCreate={() => open({ id: documentId(), subject_id: subjectId, revision: 0, title: '', description: '', blocks: [] })} />;
  }
  return <section className="mx-auto mt-8 max-w-4xl space-y-5" aria-label="Document editor">
    <Button variant="ghost" disabled={busy} onClick={() => {
      if (leave()) {
        setDraft(null);
        setEditing({});
        setError('');
      }
    }}>All Learning Documents</Button>
    <fieldset disabled={busy} className="min-w-0 space-y-5">
      <label className="grid gap-2">Document title<Input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label>
      <label className="grid gap-2">Document description<Textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></label>
      <p className="text-sm">{dirty && draft.practice_version ? 'Draft revision' : documentStatus(draft)} · {draft.practice_version ? 'Only the approved snapshot is eligible; later Draft changes stay out of practice.' : 'Drafts are excluded from practice.'} Approval means material encountered, not demonstrated understanding.</p>
      <div className="flex flex-wrap gap-2"><Button disabled={!dirty || Object.keys(editing).length > 0} onClick={save}>Save as Draft</Button><Button variant="outline" disabled={!saved} onClick={() => setOutput('preview')}>Document preview</Button><Button variant="outline" disabled={!saved} onClick={() => setOutput('markdown')}>Final Markdown</Button></div>
      <div className="flex flex-wrap gap-2"><Button disabled={dirty || !saved || !saved.title.trim() || !saved.blocks.some(b => /[\p{L}\p{N}]/u.test(b.markdown)) || saved.practice_version?.revision === saved.revision} onClick={() => setOutput('approve')}>{saved?.practice_version ? 'Update practice version' : 'Ready to Practice'}</Button>{saved?.practice_version && <Button variant="outline" onClick={() => setOutput('practice')}>View practice version</Button>}{dirty && saved && <Button variant="outline" onClick={() => {
        setDraft(saved);
        setEditing({});
        setRemoved(null);
        setError('');
        setStatus(`Saved on server · ${documentStatus(saved)}`);
      }}>Discard local edits</Button>}</div>
      {dirty && <p className="text-sm">Save or discard outstanding edits before approval. Open blocks must be saved locally or cancelled first.</p>}
      <p role="status">{busy ? status : dirty && !error ? 'Unsaved local edits · not saved on server' : status}</p>
      {error && <div className="space-y-2"><p role="alert">{error}</p><Button variant="outline" onClick={reviewSaved}>Refresh and review saved version</Button></div>}
      <p className="text-xs text-muted-foreground">Save or cancel open blocks before saving the Draft. Block saves are local until Save as Draft succeeds. Unsaved edits are kept only in this session; not offline recovery. Double-click a block to edit, or use Edit.</p>
      {draft.blocks.map((block, index) => <Fragment key={block.id}>
        <Button variant="outline" className="min-h-11" onClick={() => insert(index)}>Insert block before block {index + 1}</Button>
        <article aria-label={`Block ${index + 1}`} className={`${s.markdownBlock} min-w-0 rounded-xl border p-4`}>
          {block.id in editing ? <div className="space-y-3"><label className="grid gap-2">Block {index + 1} Markdown<Textarea autoFocus className="min-h-48 font-mono" value={editing[block.id]} onChange={e => setEditing({ ...editing, [block.id]: e.target.value })} onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing && e.keyCode !== 229) {
              e.preventDefault();
              finish(block.id, true);
            }
          }} /></label><Button onClick={() => finish(block.id, true)}>Save block</Button> <Button variant="outline" onClick={() => finish(block.id, false)}>Cancel</Button></div> : <>
            <div className={`${s.blockTools} mb-3 flex flex-wrap gap-2`}><Button variant="ghost" aria-label={`Edit block ${index + 1}`} onClick={() => setEditing({ ...editing, [block.id]: block.markdown })}>Edit</Button><Button variant="ghost" disabled={index === 0} onClick={() => {
              const next = [...draft.blocks];
              [next[index - 1], next[index]] = [next[index], next[index - 1]];
              blocks(next);
            }} aria-label={`Move block ${index + 1} up`}>↑</Button><Button variant="ghost" disabled={index === draft.blocks.length - 1} onClick={() => {
              const next = [...draft.blocks];
              [next[index + 1], next[index]] = [next[index], next[index + 1]];
              blocks(next);
            }} aria-label={`Move block ${index + 1} down`}>↓</Button><Button variant="ghost" aria-label={`Delete block ${index + 1}`} onClick={() => {
              setRemoved({ block, index });
              blocks(draft.blocks.filter(b => b.id !== block.id));
            }}>Delete</Button></div>
            <div className="min-h-20" onDoubleClick={e => {
              if (!(e.target instanceof Element) || !e.target.closest('a,button')) {
                setEditing({ ...editing, [block.id]: block.markdown });
              }
            }}><Markdown>{block.markdown || '*Empty block. Choose Edit.*'}</Markdown></div>
          </>}
        </article>
      </Fragment>)}
      <Button variant="outline" className="min-h-11 w-full" onClick={() => insert(draft.blocks.length)}>Add Markdown block</Button>
      {removed && <div className="flex flex-wrap items-center gap-3"><p>Block removed.</p><Button variant="outline" onClick={() => {
        const next = [...draft.blocks];
        next.splice(Math.min(removed.index, next.length), 0, removed.block);
        blocks(next);
        setRemoved(null);
      }}>Undo delete</Button></div>}
    </fieldset>
    {newer && <aside className="space-y-4 rounded-xl border p-4"><h2 className="font-semibold">Latest saved version · your attempted edits remain above</h2><Markdown>{assembled(newer)}</Markdown><Button variant="outline" onClick={() => {
      if (window.confirm('Discard your attempted edits and use this saved version?')) {
        open(newer);
      }
    }}>Discard attempted edits and use saved version</Button></aside>}
    <DocumentOutput output={output} saved={saved} busy={busy} dirty={dirty} onClose={() => setOutput(null)} onApprove={approve} onStatus={setStatus} />
  </section>;
}
