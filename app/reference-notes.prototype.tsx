"use client";

// Throwaway reference-note exploration. All edits are in-memory and AI is scripted.
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, FileText, Pencil, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import s from "./main-workflow.prototype.module.css";

type Note = { id: number; title: string; subtitle: string; content: string };
const initialNotes: Note[] = [
  { id: 1, title: "Ports & processes", subtitle: "Find what’s using a port before restarting the dev server.", content: "# Ports & processes\n\nWhen a development server says **address already in use**, inspect the process first.\n\n## Find the process\n\n```bash\nlsof -i :3000\n```\n\n- Check the process name and PID.\n- Confirm it belongs to the server you intended to stop.\n- Stop that server from its terminal when possible.\n\n> Inspect first. Don’t kill an unfamiliar process.\n\n## Another port\n\nReplace `3000` with the port you need." },
  { id: 2, title: "Docker essentials", subtitle: "The commands I always forget when working with containers.", content: "# Docker essentials\n\n## Build and run\n\n```bash\ndocker build -t my-app .\ndocker run --rm -p 3000:3000 my-app\n```\n\n## Look around\n\n```bash\ndocker ps\ndocker logs <container>\ndocker exec -it <container> sh\n```\n\n**Reminder:** run this project’s Node tooling inside Docker, never directly on the host." },
  { id: 3, title: "Git: find my way back", subtitle: "Inspect recent changes without rewriting history.", content: "# Git: find my way back\n\n## What changed?\n\n```bash\ngit status\ngit diff\ngit log --oneline -10\n```\n\n## Where was I?\n\n```bash\ngit reflog -10\n```\n\nThe reflog is a local history of reference movements. Inspect it before deciding what to recover." },
  { id: 4, title: "Python environments", subtitle: "Create, activate, and leave a virtual environment.", content: "# Python environments\n\nCreate a local environment:\n\n```bash\npython3 -m venv .venv\nsource .venv/bin/activate\n```\n\nLeave it when finished:\n\n```bash\ndeactivate\n```\n\nKeep `.venv/` out of version control." },
];

function MarkdownNote({ content }: { content: string }) {
  const [copied, setCopied] = useState("");
  return <div className={s.markdown}><ReactMarkdown components={{
    pre: ({ children }) => <div className="group relative"><pre>{children}</pre></div>,
    code: ({ children, className }) => {
      const text = String(children).replace(/\n$/, "");
      if (!className) return <code>{children}</code>;
      return <><code className={className}>{children}</code><Button variant="outline" size="sm" className="mt-3" onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(text); } catch { setCopied("Copy unavailable; select the command instead."); } }}><Copy />{copied === text ? "Copied" : "Copy command"}</Button></>;
    },
  }}>{content}</ReactMarkdown>{copied.startsWith("Copy unavailable") && <p role="status">{copied}</p>}</div>;
}

function NoteDialog({ note, save, close }: { note: Note; save: (note: Note) => void; close: () => void }) {
  const [mode, setMode] = useState<"read" | "edit" | "improve">("read");
  const [draft, setDraft] = useState(note.content);
  const [title, setTitle] = useState(note.title);
  const [subtitle, setSubtitle] = useState(note.subtitle);
  const [request, setRequest] = useState("");
  const [proposal, setProposal] = useState("");
  const [instruction, setInstruction] = useState("");
  const [status, setStatus] = useState("");
  function switchMode(next: "read" | "edit" | "improve") {
    setMode(next); setDraft(note.content); setTitle(note.title); setSubtitle(note.subtitle); setProposal(""); setStatus("");
  }
  return <Dialog open onOpenChange={open => { if (!open) close(); }}>
    <DialogContent className="flex h-dvh max-h-dvh w-full max-w-none flex-col gap-0 rounded-none p-0 sm:h-[90dvh] sm:max-h-[960px] sm:w-[94vw] sm:max-w-6xl sm:rounded-xl">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b p-5 pr-12 sm:p-6 sm:pr-14">
        <div className="min-w-0"><DialogTitle className="text-lg">{note.title}</DialogTitle><DialogDescription className="mt-2">{note.subtitle}</DialogDescription></div>
        <div className="flex gap-2"><Button variant={mode === "edit" ? "secondary" : "outline"} className="min-h-10" onClick={() => switchMode(mode === "edit" ? "read" : "edit")}><Pencil />Edit</Button><Button variant={mode === "improve" ? "secondary" : "outline"} className="min-h-10" onClick={() => switchMode(mode === "improve" ? "read" : "improve")}><Sparkles />Improve</Button></div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {mode === "edit" ? <form className="mx-auto grid max-w-3xl gap-4 p-5 sm:p-8" onSubmit={e => { e.preventDefault(); save({ ...note, title: title.trim(), subtitle: subtitle.trim(), content: draft }); setMode("read"); setStatus("Your edit was saved for this demo only."); }}>
          <label className="grid gap-2 text-sm">Title<Input value={title} onChange={e => setTitle(e.target.value)} /></label>
          <label className="grid gap-2 text-sm">Subtitle<Input value={subtitle} onChange={e => setSubtitle(e.target.value)} /></label>
          <label className="grid gap-2 text-sm">Markdown<Textarea className="min-h-80 font-mono text-sm" value={draft} onChange={e => setDraft(e.target.value)} /></label>
          <div className="flex gap-2"><Button type="submit" className="min-h-10" disabled={!title.trim()}>Save changes</Button><Button type="button" variant="outline" className="min-h-10" onClick={() => switchMode("read")}>Cancel</Button></div>
        </form> : <div className={mode === "improve" ? "grid min-h-full lg:grid-cols-[1fr_380px]" : ""}>
          <article className="mx-auto w-full max-w-3xl p-5 sm:p-8"><MarkdownNote content={note.content} /></article>
          {mode === "improve" && <aside className="border-t bg-muted/30 p-5 lg:border-t-0 lg:border-l">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4" />Improve with AI</div>
            <p className="mb-5 text-xs leading-6 text-muted-foreground">Tell the AI what you want changed. Your original stays untouched until you apply a suggestion.</p>
            <form className="grid gap-3" onSubmit={e => { e.preventDefault(); if (!request.trim()) return; setInstruction(request.trim()); setProposal(note.content + "\n\n## Quick reference\n\n- Find the command under the relevant heading.\n- Replace example values before running it.\n- Check the output before taking the next step."); setRequest(""); }}>
              <label className="grid gap-2 text-sm">What would you like to improve?<Textarea value={request} onChange={e => setRequest(e.target.value)} placeholder="Make this easier to scan…" rows={3} /></label><Button type="submit" className="min-h-10" disabled={!request.trim()}>Suggest changes</Button>
            </form>
            {proposal && <div className="mt-6 space-y-4"><p className="rounded-lg border bg-background p-3 text-sm"><b>Your request:</b> {instruction}</p><p className="text-xs leading-6 text-muted-foreground">Scripted example: this adds a quick-reference section. It does not interpret your request or evaluate the commands.</p><details><summary className="cursor-pointer py-2 text-sm font-medium">Before · original Markdown</summary><pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border bg-background p-3 text-xs">{note.content}</pre></details><div><p className="mb-2 text-sm font-medium">After · suggested Markdown</p><Textarea aria-label="Suggested Markdown" value={proposal} onChange={e => setProposal(e.target.value)} className="min-h-56 font-mono text-xs" /></div><div className="flex flex-wrap gap-2"><Button className="min-h-10" onClick={() => { save({ ...note, content: proposal }); setProposal(""); setMode("read"); setStatus("Suggestion applied with your approval. Demo only."); }}>Apply suggestion</Button><Button variant="outline" className="min-h-10" onClick={() => { setProposal(""); setStatus("Suggestion discarded. Original unchanged."); }}>Discard</Button></div></div>}
          </aside>}
        </div>}
      </div>
      <footer className="shrink-0 border-t px-5 py-3 text-xs text-muted-foreground"><span role="status">{status || "Reference only · not used for learning or assessment · changes reset on reload"}</span></footer>
    </DialogContent>
  </Dialog>;
}

export default function ReferenceNotesPrototype() {
  const [notes, setNotes] = useState(initialNotes);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const note = notes.find(n => n.id === selected);
  const filtered = notes.filter(n => `${n.title} ${n.subtitle} ${n.content}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Your personal reference</p><h1 className="text-3xl font-semibold tracking-tight">Reference notes</h1><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">The things you want close at hand. Yours to edit, never turned into a lesson.</p></div><div className="relative w-full sm:w-64"><Search className="absolute top-3 left-3 size-4 text-muted-foreground" /><Input aria-label="Search reference notes" placeholder="Find a note…" value={query} onChange={e => setQuery(e.target.value)} className="h-10 pl-9" /></div></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{filtered.map(n => <button key={n.id} onClick={() => setSelected(n.id)} className="h-44 min-w-0 rounded-xl text-left outline-none transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring" aria-label={`Open ${n.title}`}><Card className="h-full"><CardContent className="flex h-full min-w-0 flex-col"><FileText className="mb-4 size-5 shrink-0 text-muted-foreground" /><h2 className="line-clamp-2 text-sm font-medium">{n.title}</h2><p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{n.subtitle}</p></CardContent></Card></button>)}</div>
    {!filtered.length && <p className="py-12 text-center text-sm text-muted-foreground">No matching notes. Try a different search.</p>}
    {note && <NoteDialog key={note.id} note={note} save={updated => setNotes(notes.map(n => n.id === updated.id ? updated : n))} close={() => setSelected(null)} />}
    <p className="mt-7 text-xs text-muted-foreground">Prototype · sample notes · no persistence or live AI</p>
  </main>;
}
