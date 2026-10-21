"use client";

// Throwaway UI study on /?variant=A|B|C. B now combines the trail with a chat entry.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, Clock3, FileText, Leaf, MessageCircle, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { approvedSources, practiceCandidate, StudyPrototypeProvider, useStudyPrototype, type PracticeCandidate } from "./study-state.prototype";
import PrototypeSwitcher from "@/components/prototype-switcher";
import ReferenceNotesPrototype from "./reference-notes.prototype";
import LearningDocumentsPrototype from "./learning-documents.prototype";
import SubjectsPrototype from "./subjects.prototype";
import { AccountPrototypeGate, AccountPrototypeMenu, AccountPrototypeProvider, bioFraming, useAccountPrototype } from "./account.prototype";
import s from "./main-workflow.prototype.module.css";

function useCandidate(selection = 0) {
  const { documents, subjectId } = useStudyPrototype();
  return practiceCandidate(approvedSources(documents, subjectId), selection);
}
type HomeProps = { start: () => void; alternate: () => void; selected: number };

function SourceSummary({ selected = 0, candidate }: { selected?: number; candidate?: PracticeCandidate }) {
  const current = useCandidate(selected);
  const c = candidate ?? current;
  if (!c) return <p className="mt-4 text-xs text-muted-foreground">No approved study material in this subject yet. Drafts remain excluded.</p>;
  return <details className="mt-5 text-xs text-muted-foreground"><summary className="cursor-pointer py-3 leading-5"><BookOpen className="mr-2 inline size-3.5" />View practice source · approved version</summary><div className="mt-2 space-y-3 rounded-lg border bg-muted/40 p-4 leading-6"><p className="font-medium">{c.source.title}</p><p>{c.source.description}</p><pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words">{c.source.blocks.map(b => b.markdown).join("\n\n")}</pre><p>Only the approved snapshot is used. Drafts, draft revisions, and Reference notes are excluded. Approved does not mean mastered.</p></div></details>;
}

function ChatEntry({ start, bounded = false }: { start: () => void; bounded?: boolean }) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<{ text: string; reply: string }[]>([]);
  const { subjectId, subjects } = useStudyPrototype();
  const { profile } = useAccountPrototype();
  const framing = bioFraming(profile, subjectId);
  const source = useCandidate();
  const subjectName = subjects.find(s => s.id === subjectId)?.name ?? "No subject";
  const transcript = useRef<HTMLDivElement>(null);
  useEffect(() => { if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight; }, [messages]);
  return <Card className={bounded ? `${s.boundedChat} h-full min-h-0 gap-3 overflow-hidden` : "gap-4"}>
    <CardHeader className="shrink-0"><div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><MessageCircle className="size-4" />{subjectName} · companion</div><CardTitle className="break-words text-xl tracking-tight">{profile.name ? `What’s on your mind, ${profile.name}?` : "What’s on your mind?"}</CardTitle><CardDescription className={`${s.chatDescription} leading-6`}>Pick up a thread, ask a question, or tell me what you’d like to practise.</CardDescription></CardHeader>
    <CardContent className={bounded ? "flex min-h-0 flex-1 flex-col" : ""}>
      <div ref={transcript} aria-label="Chat messages" tabIndex={bounded ? 0 : undefined} className={bounded ? "mb-3 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain text-sm" : "mb-4 max-h-64 space-y-3 overflow-y-auto text-sm"} aria-live="polite">
        {!messages.length && bounded && <p className="py-2 text-sm leading-6 text-muted-foreground">Your trail is here when you need context. This conversation stays in view while you explore.</p>}
        {messages.map((message, i) => <div key={i}><p className="rounded-lg bg-muted p-3 whitespace-pre-wrap break-words"><b>You:</b> {message.text}</p><p className="px-1 py-3 text-xs leading-6 text-muted-foreground">{message.reply}</p></div>)}
      </div>
      <form className="shrink-0 rounded-lg border bg-background p-3" onSubmit={e => { e.preventDefault(); if (!draft.trim()) return; setMessages([...messages, { text: draft.trim(), reply: `Scripted demo: ${source ? `we can practise from “${source.source.title}”, an approved version in ${subjectName}.` : "there is no approved practice material in this subject yet."} Drafts are not consulted.${framing.example || framing.steering ? ` Optional profile context (not study evidence): ${framing.example} ${framing.steering}` : ""}` }]); setDraft(""); }}><label htmlFor="practice-request" className="sr-only">What would you like to practise?</label><Textarea id="practice-request" placeholder="I have ten minutes. Challenge me on…" className="min-h-16 max-h-28 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0" value={draft} onChange={e => setDraft(e.target.value)} /><div className="mt-1 flex justify-end"><Button type="submit" size="icon" aria-label="Send practice request" className="size-10" disabled={!draft.trim()}><ArrowRight /></Button></div></form>
      <Button variant="outline" className="mt-3 h-auto min-h-11 w-full shrink-0 justify-start whitespace-normal text-left" onClick={start} disabled={!source}><Clock3 className="shrink-0" />I have ten minutes. Pick something.</Button><p className="mt-2 shrink-0 text-[11px] leading-5 text-muted-foreground">Simulated AI · no request interpretation or saved chat</p>
    </CardContent>
  </Card>;
}

function ChallengeCard({ start, alternate, selected }: HomeProps) {
  const c = useCandidate(selected);
  if (!c) return <Card><CardHeader><CardTitle>No practice material yet</CardTitle><CardDescription className="leading-6">Keep writing your drafts. Choose Ready to Practice in a Learning Document when you want it to inform study.</CardDescription></CardHeader></Card>;
  return <Card><CardHeader><div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Sparkles className="size-3.5" />An open thread</span><span>{c.time}</span></div><CardTitle className="text-lg">{c.title}</CardTitle><CardDescription className="leading-6">{c.reason}</CardDescription></CardHeader><CardContent><Badge variant="secondary" className="mb-4">{c.topic}</Badge><div className="flex flex-wrap gap-2"><Button className="min-h-11" onClick={start}>Explore this thread <ArrowRight /></Button><Button variant="ghost" className="min-h-11" onClick={alternate}>Something else</Button></div></CardContent></Card>;
}

export function VariantA(props: HomeProps) {
  return <main className="mx-auto max-w-xl px-5 py-10 sm:py-16"><p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">A little practice, a little clearer</p><h1 className="mb-4 text-4xl font-semibold tracking-tight">Make yesterday’s learning stick.</h1><p className="mb-8 text-sm leading-6 text-muted-foreground">One small problem. Room to think. No score to chase.</p><ChallengeCard {...props} /><SourceSummary selected={props.selected} /></main>;
}

function ApprovedTrail(props: HomeProps) {
  const { documents, subjectId, subjects } = useStudyPrototype();
  const sources = approvedSources(documents, subjectId);
  return <div><ChallengeCard {...props} /><SourceSummary selected={props.selected} /><div className="mt-6 border-l pl-5 sm:pl-7">{sources.map(source => <article key={source.id} className="relative pb-8"><span className="absolute -left-[25px] top-1 size-2 rounded-full bg-foreground ring-4 ring-background sm:-left-[33px]" /><p className="text-xs text-muted-foreground">Approved practice version · {subjects.find(s => s.id === subjectId)!.name}</p><h2 className="mt-3 text-xl font-medium tracking-tight">{source.title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{source.description}</p><p className="mt-3 text-xs text-muted-foreground">Encountered material, not demonstrated understanding.</p></article>)}</div><details className="text-xs text-muted-foreground"><summary className="cursor-pointer py-3">Design study · current state</summary><pre className="overflow-auto whitespace-pre-wrap">{JSON.stringify({ subjectId, approvedSourceIds: sources.map(d => d.id), practiceCandidate: practiceCandidate(sources, props.selected), excluded: "all drafts, draft revisions, other subjects, and Reference notes", persistence: "none" }, null, 2)}</pre></details></div>;
}

function subscribeDesktop(change: () => void) {
  const media = window.matchMedia("(min-width: 1024px)");
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
function desktopSnapshot() { return window.matchMedia("(min-width: 1024px)").matches; }
function serverDesktopSnapshot() { return false; }

export function VariantB(props: HomeProps) {
  const desktop = useSyncExternalStore(subscribeDesktop, desktopSnapshot, serverDesktopSnapshot);
  const [workspacePane, setWorkspacePane] = useState("trail");
  return <main className={`${s.trailWorkspace} mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-5 pt-5 sm:px-8`}>
    <div className={`${s.workspaceHeading} mb-5 shrink-0`}><p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">Your learning trail</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pick up a thread.</h1><p className="mt-2 hidden max-w-xl text-sm leading-6 text-muted-foreground sm:block">Explore your learning without losing the conversation.</p></div>
    <Tabs value={workspacePane} onValueChange={value => setWorkspacePane(String(value))} className="min-h-0 flex-1 gap-3">
      <TabsList aria-label="Trail workspace" className="h-11! w-full shrink-0 lg:hidden"><TabsTrigger value="trail"><BookOpen />Threads</TabsTrigger><TabsTrigger value="chat"><MessageCircle />Chat</TabsTrigger></TabsList>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <TabsContent value="trail" keepMounted hidden={!desktop && workspacePane !== "trail"} inert={!desktop && workspacePane !== "trail"} tabIndex={desktop || workspacePane === "trail" ? 0 : -1} className="min-h-0 overflow-hidden">
          <section aria-label="Sample learning history" tabIndex={0} className="h-full min-h-0 overflow-y-auto overscroll-contain pr-3 pb-6 pl-1">
            <ApprovedTrail {...props} />
          </section>
        </TabsContent>
        <TabsContent value="chat" keepMounted hidden={!desktop && workspacePane !== "chat"} inert={!desktop && workspacePane !== "chat"} tabIndex={desktop || workspacePane === "chat" ? 0 : -1} className="min-h-0 overflow-hidden"><section className="h-full min-h-0" aria-label="Companion chat"><ChatEntry start={props.start} bounded /></section></TabsContent>
      </div>
    </Tabs>
  </main>;
}

export function VariantC(props: HomeProps) {
  return <main className="mx-auto max-w-2xl px-5 py-10"><p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">Space to think</p><h1 className="mb-8 text-4xl font-semibold tracking-tight">Where shall we start?</h1><ChatEntry start={props.start} /><div className="mt-8"><ChallengeCard {...props} /></div><SourceSummary selected={props.selected} /></main>;
}

function Practice({ candidate: c, exit }: { candidate: PracticeCandidate; exit: () => void }) {
  const { profile } = useAccountPrototype();
  const framing = bioFraming(profile, c.source.subjectId);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState(false);
  const [explained, setExplained] = useState(false);
  const [finished, setFinished] = useState(false);
  const [correction, setCorrection] = useState("");
  const [editing, setEditing] = useState(false);
  const [verdict, setVerdict] = useState("");
  const turns = messages.filter(m => m.role === "You").length;
  if (finished) return <main className="mx-auto max-w-2xl px-5 py-10"><p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">A moment to reflect</p><h1 className="text-3xl font-semibold tracking-tight">A little clearer. Not a final verdict.</h1><p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">This is how a recap could feel—not a real evaluation of your answers.</p><Card><CardHeader><Badge variant="outline">Sample interpretation · needs review</Badge><CardTitle className="mt-3 text-xl">Working hypothesis</CardTitle><CardDescription className="leading-6">You may be able to connect an idea from “{c.source.title}” to a concrete example and its assumptions.</CardDescription></CardHeader><CardContent className="space-y-4"><h2 className="font-medium">Still uncertain</h2><p className="text-sm leading-6 text-muted-foreground">Whether you can independently apply this idea in a different situation. One conversation is not proof of mastery. This demo has not analysed your answers.</p>{!verdict && <div className="flex flex-wrap gap-2"><Button className="min-h-11" onClick={() => setVerdict("Sample interpretation accepted for this demo.")}>Seems fair</Button><Button variant="outline" className="min-h-11" onClick={() => setEditing(true)}>Correct this</Button><Button variant="ghost" className="min-h-11" onClick={() => setVerdict("Interpretation dismissed. No evidence added.")}>Dismiss</Button></div>}{editing && !verdict && <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (correction.trim()) { setVerdict("Your correction replaces the sample interpretation in this demo."); setEditing(false); } }}><label htmlFor="correction" className="text-sm">What should the companion understand differently?</label><Textarea id="correction" value={correction} onChange={e => setCorrection(e.target.value)} rows={3} /><Button type="submit" className="min-h-11" disabled={!correction.trim()}>Use my correction</Button></form>}{verdict && <div role="status" className="rounded-lg border bg-muted p-4 text-sm leading-6">{verdict}{correction && <p className="mt-3 whitespace-pre-wrap break-words">{correction}</p>}</div>}</CardContent></Card><SourceSummary candidate={c} /><Button variant="ghost" className="mt-4 min-h-11" onClick={exit}>Back to the start <ArrowRight /></Button></main>;
  return <main className="mx-auto max-w-2xl px-5 py-8"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{c.topic} · {c.time}</p><h1 className="mt-3 text-2xl font-semibold tracking-tight">{c.title}</h1></div><Button variant="ghost" className="min-h-11" onClick={() => setFinished(true)}>Finish here</Button></div><SourceSummary candidate={c} />
    <div className="space-y-5 py-6" aria-live="polite"><div><p className="mb-2 text-xs text-muted-foreground">Companion</p><p className="text-sm leading-7">{c.prompt}</p></div>{messages.map((m, i) => <div key={i} className={m.role === "You" ? "ml-5 rounded-xl bg-muted p-4" : "pr-3"}><p className="mb-2 text-xs text-muted-foreground">{m.role}</p><p className="text-sm leading-7 whitespace-pre-wrap break-words">{m.text}</p></div>)}{hint && <p className="rounded-lg border p-4 text-sm leading-7"><b>A nudge:</b> {c.hint}</p>}{explained && <p className="rounded-lg border p-4 text-sm leading-7"><b>Explanation:</b> {c.explanation}</p>}</div>
    <form className="rounded-xl border bg-card p-4" onSubmit={e => { e.preventDefault(); if (!draft.trim()) return; setMessages([...messages, { role: "You", text: draft.trim() }, { role: "Companion · scripted", text: turns === 0 ? `${c.followup}${framing.example || framing.steering ? `\n\nOptional profile context (not study evidence): ${framing.example} ${framing.steering}` : ""}` : "What observation could distinguish your explanation from another possibility? Keep reasoning, or finish to inspect the sample recap." }]); setDraft(""); }}><label htmlFor="reasoning" className="text-xs text-muted-foreground">Your thinking · a sentence is enough to begin</label><Textarea id="reasoning" className="mt-3 min-h-28" placeholder="I’d start by checking…" value={draft} onChange={e => setDraft(e.target.value)} /><div className="mt-3 flex flex-wrap justify-between gap-2"><div className="flex gap-1"><Button type="button" variant="outline" className="min-h-11" onClick={() => setHint(true)} disabled={hint}>Hint</Button><Button type="button" variant="ghost" className="min-h-11" onClick={() => setExplained(true)} disabled={explained}>Explain it</Button></div><Button type="submit" className="min-h-11" disabled={!draft.trim()}>Send <Send /></Button></div></form><p className="mt-4 text-xs leading-6 text-muted-foreground">Simulated AI · replies are scripted, not based on your answer · nothing is saved.</p>
  </main>;
}

function NoSubjects() {
  return <main className="mx-auto w-full max-w-xl overflow-y-auto px-5 py-10"><h1 className="text-2xl font-semibold tracking-tight">A new subject, a fresh start.</h1><p className="mt-4 text-sm leading-7 text-muted-foreground">Open the subject dropdown beside waypoint. and choose Add subject to start a learning trail. Your shared Reference notes are still available.</p></main>;
}

function Experience({ variant }: { variant: string }) {
  const { subjectId, subjects, documents } = useStudyPrototype();
  const subject = subjects.find(s => s.id === subjectId);
  const [section, setSection] = useState("practice");
  const [activeCandidate, setActiveCandidate] = useState<PracticeCandidate | null>(null);
  const active = !!activeCandidate;
  const [selected, setSelected] = useState(0);
  const sources = approvedSources(documents, subjectId);
  const candidate = practiceCandidate(sources, selected);
  const props = { start: () => setActiveCandidate(candidate), alternate: () => setSelected((selected + 1) % Math.max(1, sources.length * 2)), selected };
  const bounded = variant === "B" && section === "practice" && !active;
  return <div className={`${s.prototype} ${bounded ? s.boundedStudy : "min-h-dvh pb-28"} bg-background text-foreground`}>
    <header className="border-b"><div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-5 py-5 sm:px-8"><div className="flex min-w-0 items-center gap-1 sm:gap-3"><Button variant="ghost" className="-ml-2 h-10 gap-2 text-xl tracking-tight" onClick={() => { setSection("practice"); setActiveCandidate(null); }}><Leaf className="size-5" />waypoint.</Button><span className="text-muted-foreground/40" aria-hidden="true">/</span><SubjectsPrototype changed={() => { setSelected(0); setActiveCandidate(null); }} /></div><div className="flex shrink-0 items-center gap-3"><span className="hidden text-xs text-muted-foreground sm:block">Design study · sample data</span><AccountPrototypeMenu /></div></div></header>
    <Tabs value={section} onValueChange={value => setSection(String(value))} className={bounded ? "min-h-0 flex-1 gap-0 overflow-hidden" : "gap-0"}>
      <nav className="mx-auto w-full max-w-6xl shrink-0 border-b px-3 py-3 sm:px-8"><TabsList aria-label="Main navigation" className="h-auto! w-full sm:w-fit"><TabsTrigger value="practice" className="min-h-11 whitespace-normal px-2 text-[11px] sm:px-3 sm:text-sm sm:whitespace-nowrap"><MessageCircle />{variant === "B" ? "Learning trail" : variant === "C" ? "Companion" : "Practice"}</TabsTrigger><TabsTrigger value="documents" className="min-h-11 whitespace-normal px-2 text-[11px] sm:px-3 sm:text-sm sm:whitespace-nowrap"><BookOpen />Learning Documents</TabsTrigger><TabsTrigger value="notes" className="min-h-11 whitespace-normal px-2 text-[11px] sm:px-3 sm:text-sm sm:whitespace-nowrap"><FileText />Reference notes</TabsTrigger></TabsList></nav>
      <TabsContent value="notes" keepMounted className={section === "notes" ? "" : "hidden"}><ReferenceNotesPrototype /></TabsContent>
      <TabsContent value="documents" keepMounted className={section === "documents" ? "" : "hidden"}>{subjects.map(s => <div key={s.id} hidden={subjectId !== s.id}><LearningDocumentsPrototype subjectId={s.id} /></div>)}{!subjects.length && <NoSubjects />}</TabsContent>
      <TabsContent value="practice" keepMounted className={section === "practice" ? "flex min-h-0 flex-col" : "hidden"}>{!subjects.length ? <NoSubjects /> : activeCandidate ? <Practice key={`${subjectId}-${activeCandidate.source.id}-${selected}`} candidate={activeCandidate} exit={() => setActiveCandidate(null)} /> : variant === "B" ? <VariantB key={subjectId} {...props} /> : variant === "C" ? <VariantC key={subjectId} {...props} /> : <VariantA key={subjectId} {...props} />}</TabsContent>
    </Tabs>
    {!bounded && <details className="mx-auto mt-8 max-w-6xl px-5 text-xs text-muted-foreground sm:px-8"><summary className="cursor-pointer py-3">Design study · current state</summary><pre className="mt-2 overflow-auto rounded-lg border p-4 text-[10px] whitespace-pre-wrap">{JSON.stringify({ variant, section, screen: active ? "practice / recap" : "start", subject: subject?.name ?? null, subjects, approvedSourceIds: sources.map(d => d.id), challenge: candidate?.title ?? null, source: candidate?.source ?? null, persistence: "none; switching variants resets the demo" }, null, 2)}</pre></details>}<PrototypeSwitcher />
  </div>;
}

export default function MainWorkflowPrototype() {
  const params = useSearchParams();
  const value = params.get("variant");
  const variant = value === "A" || value === "C" ? value : "B";
  return <AccountPrototypeProvider><AccountPrototypeGate><StudyPrototypeProvider key={variant}><Experience variant={variant} /></StudyPrototypeProvider></AccountPrototypeGate></AccountPrototypeProvider>;
}
