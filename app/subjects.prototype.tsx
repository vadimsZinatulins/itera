"use client";

// Throwaway subject management: routine switching is separate from destructive settings.
import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, Plus, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useStudyPrototype } from "./study-state.prototype";

export default function SubjectsPrototype({ changed }: { changed: () => void }) {
  const { subjects, subjectId, setSubjectId, documents, addSubject, deleteSubject } = useStudyPrototype();
  const [view, setView] = useState<"create" | "manage" | "settings" | "delete" | null>(null);
  const [targetId, setTargetId] = useState("");
  const [name, setName] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const current = subjects.find(s => s.id === subjectId);
  const target = subjects.find(s => s.id === targetId);
  const targetDocuments = documents.filter(d => d.subjectId === targetId);
  const duplicate = subjects.some(s => s.name.toLowerCase() === name.trim().toLowerCase());
  const canCreate = !!name.trim() && !duplicate;
  const canDelete = !!target && confirmation === target.name;
  const create = () => { setName(""); setView("create"); };
  function close() { setView(null); setConfirmation(""); setTargetId(""); setName(""); }
  return <>
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="h-10 min-w-0 max-w-40 shrink gap-1 text-xs font-normal text-muted-foreground" />} aria-label="Switch subject"><span className="truncate">{current?.name ?? "No subjects"}</span><ChevronDown className="size-3" /></DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-[70dvh] w-64 overflow-y-auto">
        <DropdownMenuGroup><DropdownMenuLabel>Subject</DropdownMenuLabel><DropdownMenuRadioGroup value={subjectId} onValueChange={value => { if (value !== subjectId) { setSubjectId(String(value)); changed(); } }}>{subjects.map(s => <DropdownMenuRadioItem key={s.id} value={s.id} closeOnClick className="min-h-11"><span className="break-words">{s.name}</span></DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="min-h-11" onClick={create}><Plus />Add subject</DropdownMenuItem>
        <DropdownMenuItem className="min-h-11" onClick={() => setView("manage")}><Settings2 />Manage subjects</DropdownMenuItem>
        <p className="px-2 py-2 text-[11px] leading-5 text-muted-foreground">Scopes your trail, documents, and practice. Reference notes are shared.</p>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={view !== null} onOpenChange={open => { if (!open) close(); }}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogTitle className="pr-8 leading-6 break-words">{view === "create" ? "Add subject" : view === "delete" ? "Delete subject?" : view === "settings" ? `Subject settings · ${target?.name ?? ""}` : "Manage subjects"}</DialogTitle>
        <DialogDescription className="leading-6">{view === "create" ? "Give a new area of study its own documents, learning trail, and practice." : view === "delete" ? "This removes the subject and its content from this demo. This action cannot be undone here." : "Subject management is separate from everyday switching. Reference notes remain shared."}</DialogDescription>
        {view === "create" && <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (!canCreate) return; if (addSubject(name)) { changed(); close(); } }}>
          <div className="space-y-2"><label htmlFor="new-subject-name" className="text-sm font-medium">Subject name</label><Input id="new-subject-name" className="h-11 text-base sm:text-sm" placeholder="For example, Photography" maxLength={80} value={name} onChange={e => setName(e.target.value)} aria-invalid={duplicate} aria-describedby={duplicate ? "subject-name-error" : undefined} />{duplicate && <p id="subject-name-error" role="status" className="text-sm text-destructive">A subject with this name already exists.</p>}</div>
          <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" className="min-h-11" onClick={close}>Cancel</Button><Button type="submit" className="min-h-11" disabled={!canCreate}>Create subject</Button></div>
        </form>}
        {view === "manage" && <div className="space-y-4"><div className="space-y-2">{subjects.map(s => <Button key={s.id} variant="outline" className="h-auto min-h-14 w-full justify-between gap-4 py-3 text-left whitespace-normal" onClick={() => { setTargetId(s.id); setView("settings"); }} aria-label={`Settings for ${s.name}`}><span className="min-w-0 break-words">{s.name}</span><ChevronRight className="shrink-0" /></Button>)}{!subjects.length && <p className="py-4 text-sm text-muted-foreground">No subjects yet. Add one to start a new learning trail.</p>}</div><Button variant="outline" className="min-h-11" onClick={create}><Plus />Add subject</Button></div>}
        {view === "settings" && target && <div className="space-y-6"><Button variant="ghost" className="min-h-11" onClick={() => setView("manage")}><ArrowLeft />All subjects</Button><p className="text-sm text-muted-foreground">{targetDocuments.length} Learning Documents · {targetDocuments.filter(d => d.practice).length} approved practice versions</p><section className="mt-8 space-y-3 rounded-xl border border-destructive/30 p-4" aria-label="Danger zone"><h2 className="font-medium">Danger zone</h2><p className="text-sm leading-6 text-muted-foreground">Deleting this subject also removes its documents, including drafts and approved practice versions. Other subjects and shared Reference notes are not affected.</p><Button variant="outline" className="min-h-11 text-destructive" onClick={() => { setConfirmation(""); setView("delete"); }}><Trash2 />Delete this subject…</Button></section></div>}
        {view === "delete" && target && <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (!canDelete) return; if (deleteSubject(target.id, confirmation)) { if (target.id === subjectId) changed(); close(); } }}>
          <div className="rounded-lg border border-destructive/30 p-4 text-sm leading-6"><p className="break-words">You are deleting <strong>{target.name}</strong>.</p><p className="mt-2">This includes {targetDocuments.length} Learning Documents (including drafts) and {targetDocuments.filter(d => d.practice).length} approved practice versions, plus this subject’s learning trail and practice context.</p><p className="mt-2">Other subjects and shared Reference notes will be kept.</p></div>
          <div className="space-y-2"><label htmlFor="delete-subject-name" className="block text-sm leading-6 break-words">Type <strong>{target.name}</strong> to enable deletion.</label><Input id="delete-subject-name" aria-label="Subject name to confirm deletion" className="h-11 text-base sm:text-sm" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="off" spellCheck={false} autoCapitalize="none" aria-describedby="delete-subject-instructions" /><p id="delete-subject-instructions" className="text-xs leading-5 text-muted-foreground">The name must match exactly, including capitalisation and spaces.</p></div>
          <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" className="min-h-11" onClick={() => { setConfirmation(""); setView("settings"); }}>Cancel</Button><Button type="submit" variant="destructive" className="min-h-11" disabled={!canDelete}>Delete subject</Button></div>
        </form>}
        <p className="text-xs leading-5 text-muted-foreground">Prototype only · changes stay in memory and reset on reload.</p>
      </DialogContent>
    </Dialog>
  </>;
}
