"use client";

// Throwaway exploration: rendered-first Markdown blocks, one assembled document.
// In-memory only. AI reviews are explicitly scripted, not real correctness checks.
import { Fragment, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, Check, Copy, Download, Eye, FileText, Pencil, Plus, Search, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import s from "./main-workflow.prototype.module.css";

import { contentSnapshot, documentStatus, hasDraftRevision, useStudyPrototype, type Block, type DocumentContent, type LearningDocument } from "./study-state.prototype";
type Review = { kind: "improve" | "correctness"; blockId?: string };
type Proposal = { id: string; before: string; after: string; comment: string };
const misconception = "A smaller learning rate always fixes training.";
const correction = "A smaller learning rate can reduce overshooting, but it will not fix every training problem. Incorrect gradient signs or missing parameter updates need a different investigation.";
function assembled(document: DocumentContent) {
  return [`# ${document.title.trim() || "Untitled Learning Document"}`, document.description.trim(), ...document.blocks.map(b => b.markdown.trim())].filter(Boolean).join("\n\n") + "\n";
}
function Markdown({ content }: { content: string }) {
  return <div className={s.markdown}><ReactMarkdown>{content}</ReactMarkdown></div>;
}

function InsertBlock({ position, insert }: { position: number; insert: () => void }) {
  const label = position === 0 ? "Insert block before block 1" : `Insert block between blocks ${position} and ${position + 1}`;
  return <div className={`${s.blockInsert} flex h-12 items-center gap-3 px-4`}>
    <span className="flex-1 border-t" aria-hidden="true" />
    <Button variant="outline" size="icon" className="size-11 shrink-0 rounded-full" aria-label={label} title={label} onClick={insert}><Plus /></Button>
    <span className="flex-1 border-t" aria-hidden="true" />
  </div>;
}

function MarkdownBlock({ block, index, total, save, remove, move, review, editingChanged }: {
  block: Block; index: number; total: number; save: (value: string) => void; remove: () => void;
  move: (direction: number) => void; review: (kind: Review["kind"]) => void; editingChanged: (editing: boolean) => void;
}) {
  const [editing, setEditing] = useState(!block.markdown);
  const [draft, setDraft] = useState(block.markdown);
  function startEditing() { setDraft(block.markdown); setEditing(true); editingChanged(true); }
  function finish() { save(draft); setEditing(false); editingChanged(false); }
  return <article aria-label={`Block ${index + 1}`} className={`${s.markdownBlock} min-w-0 rounded-xl border border-transparent`}>
    {editing ? <div className="rounded-xl border bg-card p-4 sm:p-5">
      <label htmlFor={`markdown-${block.id}`} className="mb-3 block text-xs font-medium text-muted-foreground">Block {index + 1} · Markdown</label>
      <Textarea id={`markdown-${block.id}`} autoFocus value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing) { e.preventDefault(); finish(); } }} className="min-h-56 font-mono text-base leading-7 sm:text-sm" />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">Ctrl / ⌘ + Enter to save</span><div className="flex gap-2"><Button variant="ghost" className="min-h-11" onClick={() => { setDraft(block.markdown); setEditing(false); editingChanged(false); }}>Cancel</Button><Button className="min-h-11" onClick={finish}><Check />Save block</Button></div></div>
    </div> : <>
      <div className={`${s.blockTools} flex flex-wrap items-center justify-between gap-1 border-b border-transparent px-3 pt-2 sm:px-5`}>
        <span className="text-[10px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
        <div className="flex flex-wrap items-center gap-1"><Button variant="ghost" size="sm" className="min-h-10" onClick={startEditing}><Pencil />Edit</Button><Button variant="ghost" size="sm" className="min-h-10" onClick={() => review("improve")}><Sparkles />Improve</Button><Button variant="ghost" size="sm" className="min-h-10" onClick={() => review("correctness")}><ShieldCheck />Review correctness</Button><Button variant="ghost" size="icon" className="size-10" disabled={index === 0} aria-label={`Move block ${index + 1} up`} onClick={() => move(-1)}><ArrowUp /></Button><Button variant="ghost" size="icon" className="size-10" disabled={index === total - 1} aria-label={`Move block ${index + 1} down`} onClick={() => move(1)}><ArrowDown /></Button><Button variant="ghost" size="icon" className="size-10" aria-label={`Delete block ${index + 1}`} onClick={remove}><Trash2 /></Button></div>
      </div>
      <div className="min-h-24 px-4 pb-5 sm:px-6" onDoubleClick={e => { if (!(e.target instanceof Element) || !e.target.closest("a, button")) startEditing(); }}>
        {block.markdown.trim() ? <Markdown content={block.markdown} /> : <p className="py-5 text-sm text-muted-foreground">An empty block. Choose Edit to add Markdown.</p>}
      </div>
    </>}
  </article>;
}

function AIReview({ review, blocks, close, apply }: { review: Review; blocks: Block[]; close: () => void; apply: (proposals: Proposal[]) => void }) {
  const targets = review.blockId ? blocks.filter(b => b.id === review.blockId) : blocks;
  const [request, setRequest] = useState("");
  const [instruction, setInstruction] = useState("");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [generated, setGenerated] = useState(false);
  const [checked, setChecked] = useState(false);
  const scope = review.blockId ? `Block ${blocks.findIndex(b => b.id === review.blockId) + 1}` : "Entire document";
  function generate() {
    setInstruction(request.trim());
    setProposals(targets.map(b => {
      if (review.kind === "correctness") return { id: b.id, before: b.markdown, after: b.markdown.replace(misconception, correction), comment: b.markdown.includes(misconception) ? "Sample finding: ‘always’ is too strong. A smaller step does not repair an incorrect gradient sign. This scripted example replaces that one sentence." : "No automated verdict in this demo. A real review would identify claims, explain uncertainty, and cite supporting evidence where available. Unchanged does not mean verified." };
      return { id: b.id, before: b.markdown, after: b.markdown.trim().replace(/\n{3,}/g, "\n\n") + "\n\n> Next step: add a concrete example in my own words.", comment: "Scripted writing suggestion: tidy excess spacing and add a prompt for a concrete example. Your request is recorded, but is not interpreted by a live model." };
    }));
    setGenerated(true); setChecked(false);
  }
  const changes = proposals.filter(p => p.before !== p.after);
  return <Dialog open onOpenChange={open => { if (!open) close(); }}><DialogContent className="flex max-h-[92dvh] flex-col gap-0 p-0 sm:max-w-4xl"><header className="border-b p-5 pr-12"><DialogTitle className="text-lg">{review.kind === "improve" ? "Improve writing" : "Review correctness"}</DialogTitle><DialogDescription className="mt-2">{scope} · suggestions only, never automatic edits</DialogDescription></header><div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
    <p className="rounded-lg border bg-muted/40 p-3 text-xs leading-6 text-muted-foreground">Simulated AI. This prototype does not assess arbitrary claims or verify sources. The gradient-descent example has an intentionally questionable “always fixes training” claim to demonstrate a correction; other text is not verified.</p>
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); generate(); }}><label className="grid gap-2 text-sm">{review.kind === "improve" ? "What would you like to improve?" : "What should the review focus on? (optional)"}<Textarea value={request} onChange={e => setRequest(e.target.value)} placeholder={review.kind === "improve" ? "Keep my voice, but make the explanation clearer…" : "Check whether my learning-rate assumption is too broad…"} rows={2} /></label><Button type="submit" className="min-h-11" disabled={review.kind === "improve" && !request.trim()}>{review.kind === "improve" ? "Suggest improvements" : "Run sample review"}</Button></form>
    {generated && <div className="space-y-5">{instruction && <p className="text-sm leading-6"><b>Your request:</b> {instruction}</p>}{proposals.map(p => <section key={p.id} className="space-y-3 rounded-lg border p-4"><p className="text-xs font-medium">Block {blocks.findIndex(b => b.id === p.id) + 1}</p><p className="text-sm leading-6 text-muted-foreground">{p.comment}</p><div className="grid gap-4 sm:grid-cols-2"><div><p className="mb-2 text-xs text-muted-foreground">Before</p><pre className="max-h-72 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs leading-6 whitespace-pre-wrap break-words">{p.before || "(empty)"}</pre></div><label className="grid content-start gap-2 text-xs text-muted-foreground">Suggested Markdown · editable<Textarea aria-label={`Suggested Markdown for block ${blocks.findIndex(b => b.id === p.id) + 1}`} className="min-h-48 font-mono text-xs leading-6" value={p.after} onChange={e => setProposals(proposals.map(item => item.id === p.id ? { ...item, after: e.target.value } : item))} /></label></div></section>)}
      {changes.length > 0 ? <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" className="mt-1 size-4" checked={checked} onChange={e => setChecked(e.target.checked)} />I’ve reviewed these changes and want to replace the affected blocks.</label> : <p className="text-sm text-muted-foreground">No changes proposed. This is not a correctness certificate.</p>}
    </div>}
  </div><footer className="flex flex-wrap justify-end gap-2 border-t p-4"><Button variant="outline" className="min-h-11" onClick={close}>Discard and close</Button><Button className="min-h-11" disabled={!generated || !changes.length || !checked} onClick={() => apply(changes)}>Apply {changes.length || ""} {changes.length === 1 ? "change" : "changes"}</Button></footer></DialogContent></Dialog>;
}

function DocumentEditor({ document, change, back }: { document: LearningDocument; change: (document: LearningDocument) => void; back: () => void }) {
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const [review, setReview] = useState<Review | null>(null);
  const [output, setOutput] = useState<"preview" | "markdown" | "practice" | null>(null);
  const [status, setStatus] = useState("");
  const [removed, setRemoved] = useState<{ block: Block; index: number } | null>(null);
  const dirty = editingIds.size > 0;
  const finalMarkdown = assembled(document);
  const revision = hasDraftRevision(document);
  const canApprove = !dirty && !!document.title.trim() && document.blocks.some(b => b.markdown.trim()) && (!document.practice || revision);
  const displayMarkdown = output === "practice" && document.practice ? assembled(document.practice) : finalMarkdown;
  function updateBlocks(blocks: Block[]) { change({ ...document, blocks, updated: "Just now" }); }
  function editingChanged(id: string, value: boolean) { setEditingIds(ids => { const next = new Set(ids); if (value) next.add(id); else next.delete(id); return next; }); }
  function addBlock(position = document.blocks.length) {
    const block = { id: crypto.randomUUID(), markdown: "" };
    const blocks = [...document.blocks]; blocks.splice(position, 0, block);
    updateBlocks(blocks); editingChanged(block.id, true); setStatus(`New block inserted at position ${position + 1} · write Markdown, then save.`);
  }
  return <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Button variant="ghost" className="-ml-2 min-h-11" onClick={back} disabled={dirty}><ArrowLeft />All Learning Documents</Button><Badge variant={document.practice && !revision ? "secondary" : "outline"}>{documentStatus(document)}</Badge></div>
    <div className="mb-7 space-y-3"><label className="sr-only" htmlFor={`document-title-${document.id}`}>Document title</label><Textarea id={`document-title-${document.id}`} rows={1} className="min-h-0 resize-none border-0 px-0 py-2 text-2xl! font-semibold tracking-tight shadow-none focus-visible:ring-0 sm:text-3xl!" value={document.title} placeholder="Untitled Learning Document" onChange={e => change({ ...document, title: e.target.value.replace(/\n/g, " "), updated: "Just now" })} /><label className="sr-only" htmlFor={`document-description-${document.id}`}>Document description</label><Textarea id={`document-description-${document.id}`} rows={1} className="min-h-0 resize-none border-0 px-0 text-base shadow-none focus-visible:ring-0 sm:text-sm" value={document.description} placeholder="What are you exploring?" onChange={e => change({ ...document, description: e.target.value, updated: "Just now" })} /><p className="text-xs text-muted-foreground">Self-study · {document.blocks.length} Markdown blocks · saved changes stay in this demo only</p></div>
    <div className="mb-5 space-y-3 rounded-xl border bg-muted/30 p-4"><p className="text-sm leading-6">{!document.practice ? "Draft · excluded from practice and learning-profile interpretation. You can still ask AI to assist with your writing." : revision ? "Draft revision · your last approved practice version remains in use. These edits stay out of practice until you approve the update." : "This approved practice version is available in its subject. It is material encountered, not demonstrated understanding."}</p><div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-11" disabled={dirty} onClick={() => { change({ ...document, updated: "Just now" }); setStatus(!document.practice ? "Draft saved in this demo. Still excluded from practice." : revision ? "Draft revision saved in this demo. The approved practice version is unchanged." : "Saved in this demo. The approved practice version is unchanged."); }}>Save as Draft</Button><Button className="min-h-11" disabled={!canApprove} onClick={() => { change({ ...document, practice: contentSnapshot(document), updated: "Just now" }); setStatus("Practice version approved. Only this snapshot is eligible; no mastery was inferred."); }}>{document.practice ? "Update practice version" : "Ready to Practice"}</Button>{document.practice && <Button variant="ghost" className="min-h-11" disabled={dirty} onClick={() => setOutput("practice")}>View practice version</Button>}</div><p className="text-xs leading-6 text-muted-foreground">Demo only · block saves keep your working draft in memory. Nothing survives a reload.</p></div>
    <div className="mb-5 flex flex-wrap gap-2 border-y py-3"><Button variant="outline" className="min-h-11" disabled={dirty} onClick={() => setOutput("preview")}><Eye />Document preview</Button><Button variant="outline" className="min-h-11" disabled={dirty} onClick={() => setOutput("markdown")}><FileText />Final Markdown</Button><Button variant="ghost" className="min-h-11" disabled={dirty || !document.blocks.length} onClick={() => setReview({ kind: "improve" })}><Sparkles />Improve document</Button><Button variant="ghost" className="min-h-11" disabled={dirty || !document.blocks.length} onClick={() => setReview({ kind: "correctness" })}><ShieldCheck />Review document</Button></div>
    <p className="mb-6 text-xs leading-6 text-muted-foreground">Read first. Hover or focus a block for actions; on touch screens they stay visible. Double-click to edit on desktop.{dirty && <span className="block font-medium text-foreground">Save or cancel open blocks before previewing, reviewing, or leaving this document.</span>}</p>
    <div>{document.blocks.map((block, index) => <Fragment key={block.id}><InsertBlock position={index} insert={() => addBlock(index)} /><MarkdownBlock block={block} index={index} total={document.blocks.length} editingChanged={value => editingChanged(block.id, value)} save={value => { updateBlocks(document.blocks.map(b => b.id === block.id ? { ...b, markdown: value } : b)); setStatus(`Block ${index + 1} saved to your working draft. Practice eligibility is unchanged.`); }} remove={() => { setRemoved({ block, index }); updateBlocks(document.blocks.filter(b => b.id !== block.id)); setStatus("Block removed. You can undo this deletion."); }} move={direction => { const blocks = [...document.blocks]; [blocks[index], blocks[index + direction]] = [blocks[index + direction], blocks[index]]; updateBlocks(blocks); setStatus("Block order updated."); }} review={kind => { if (dirty) { setStatus("Save or cancel open blocks before requesting an AI review."); return; } setReview({ kind, blockId: block.id }); }} /></Fragment>)}</div>
    <Button variant="outline" className="mt-6 min-h-12 w-full border-dashed" onClick={() => addBlock()}><Plus />Add Markdown block</Button>
    <div className="mt-5 flex flex-wrap items-center gap-3"><p role="status" className="text-xs leading-6 text-muted-foreground">{status || "Saving is not approval. Only a practice version can inform study; no real learning profile is updated in this demo."}</p>{removed && <Button variant="ghost" className="min-h-10" onClick={() => { const blocks = [...document.blocks]; blocks.splice(Math.min(removed.index, blocks.length), 0, removed.block); updateBlocks(blocks); setRemoved(null); setStatus("Block restored."); }}>Undo delete</Button>}</div>
    <details className="mt-8 text-xs text-muted-foreground"><summary className="cursor-pointer py-3">Document prototype state</summary><pre className="overflow-auto rounded-lg border p-4 whitespace-pre-wrap break-words">{JSON.stringify({ id: document.id, blocks: document.blocks, editing: [...editingIds], review, documentStatus: documentStatus(document), subjectId: document.subjectId, approvedSnapshot: document.practice, eligibleAs: document.practice ? "approved snapshot only" : "excluded: draft", demonstratedUnderstanding: "not inferred", persistence: "none" }, null, 2)}</pre></details>
    {review && <AIReview key={`${review.kind}-${review.blockId ?? "document"}`} review={review} blocks={document.blocks} close={() => setReview(null)} apply={proposals => { updateBlocks(document.blocks.map(b => { const proposal = proposals.find(p => p.id === b.id); return proposal ? { ...b, markdown: proposal.after } : b; })); setReview(null); setStatus("Only the reviewed changes were applied. No understanding was inferred."); }} />}
    {output && <Dialog open onOpenChange={open => { if (!open) setOutput(null); }}><DialogContent className="flex max-h-[92dvh] flex-col gap-0 p-0 sm:max-w-4xl"><header className="border-b p-5 pr-12"><DialogTitle>{output === "practice" ? "Approved practice version" : output === "preview" ? "Document preview" : "Final Markdown"}</DialogTitle><DialogDescription className="mt-2">{output === "practice" ? "Only this approved snapshot can inform practice. Working draft revisions are excluded." : "Your working draft, assembled in order. Exporting it does not approve it for practice."}</DialogDescription></header><div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">{output !== "markdown" ? <Markdown content={displayMarkdown} /> : <pre className="font-mono text-sm leading-7 whitespace-pre-wrap break-words">{displayMarkdown}</pre>}</div><footer className="flex flex-wrap justify-end gap-2 border-t p-4"><Button variant="outline" className="min-h-11" onClick={async () => { try { await navigator.clipboard.writeText(displayMarkdown); setStatus("Final Markdown copied."); } catch { setStatus("Clipboard unavailable. Select the text in Final Markdown to copy it."); } }}><Copy />Copy Markdown</Button><Button className="min-h-11" onClick={() => { const url = URL.createObjectURL(new Blob([displayMarkdown], { type: "text/markdown;charset=utf-8" })); const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = ((output === "practice" && document.practice ? document.practice.title : document.title).trim().replace(/[^a-z0-9-]+/gi, "-") || "learning-document") + ".md"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setStatus("Markdown downloaded."); }}><Download />Download .md</Button></footer></DialogContent></Dialog>}
  </main>;
}

export default function LearningDocumentsPrototype({ subjectId }: { subjectId: string }) {
  const { documents, setDocuments, subjects } = useStudyPrototype();
  const subject = subjects.find(s => s.id === subjectId)!;
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const document = documents.find(d => d.id === selected && d.subjectId === subjectId);
  if (document) return <DocumentEditor key={document.id} document={document} change={updated => setDocuments(docs => docs.map(d => d.id === updated.id ? updated : d))} back={() => setSelected(null)} />;
  const filtered = documents.filter(d => d.subjectId === subjectId && (filter === "all" || (filter === "drafts" ? !d.practice || hasDraftRevision(d) : !!d.practice)) && `${d.title} ${d.description} ${d.blocks.map(b => b.markdown).join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12"><div className="mb-7 flex flex-wrap items-start justify-between gap-5"><div><p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">{subject.name} · Things you’re making sense of</p><h1 className="text-3xl font-semibold tracking-tight">Learning Documents</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Write what you’re learning, one Markdown block at a time. Keep your thinking, open questions, and discoveries together.</p></div><Button className="min-h-11" onClick={() => { const doc: LearningDocument = { id: crypto.randomUUID(), subjectId, title: "Untitled Learning Document", description: "", updated: "Just now", blocks: [], practice: null }; setDocuments([doc, ...documents]); setSelected(doc.id); }}><Plus />New Learning Document</Button></div>
    <div className="relative mb-7 max-w-sm"><Search className="absolute top-3 left-3 size-4 text-muted-foreground" /><Input className="h-11 pl-9 text-base sm:text-sm" aria-label="Search Learning Documents" placeholder="Search titles, topics, or contents…" value={query} onChange={e => setQuery(e.target.value)} /></div>
    <div className="mb-6 flex flex-wrap gap-2" aria-label="Filter documents">{[["all", "All"], ["drafts", "Drafts"], ["practice", "Available for practice"]].map(([value, label]) => <Button key={value} variant={filter === value ? "secondary" : "ghost"} className="min-h-11" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</Button>)}</div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(doc => <button key={doc.id} aria-label={`Open ${doc.title}`} onClick={() => setSelected(doc.id)} className="min-w-0 rounded-xl text-left outline-none transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring"><Card className="h-full"><CardContent className="flex h-full flex-col"><div className="mb-5 flex items-center justify-between"><BookOpen className="size-5 text-muted-foreground" /><Badge variant={doc.practice && !hasDraftRevision(doc) ? "secondary" : "outline"}>{documentStatus(doc)}</Badge></div><h2 className="line-clamp-2 text-base font-medium">{doc.title}</h2><p className="mt-2 mb-5 line-clamp-2 text-sm leading-6 text-muted-foreground">{doc.description || "A new space for your learning."}</p><div className="mt-auto flex items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground"><span>{doc.blocks.length} blocks</span><span>{doc.updated}</span></div></CardContent></Card></button>)}</div>
    {!filtered.length && <p className="py-12 text-center text-sm text-muted-foreground">No documents match. Try another search or create a document.</p>}
    <p className="mt-7 text-xs leading-6 text-muted-foreground">Drafts are excluded from study. Only approved practice versions in this subject are eligible, never proof of understanding. Draft revisions leave the previous practice version intact. Prototype only: reload resets all changes.</p>
  </main>;
}
