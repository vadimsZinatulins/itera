"use client";

// THROWAWAY v2: one seamless Learning Trail. ?variant=A|B|C compares only
// knowledge-base visualisations, not three competing conversation workflows.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, History, MessageCircle, Plus, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { approvedSources, useStudyPrototype } from "./study-state.prototype";

type Message = { role: "you" | "companion"; text: string };
type Recap = { text: string; through: number };
type Conversation = { id: string; title: string; when: string; topic: number; messages: Message[]; recap?: Recap; proposal?: Recap; dismissed?: boolean };
type Topic = { name: string; question: string; observation: string; uncertainty: string };
type Evidence = { conversation: Conversation; text: string; reviewed: boolean };

function topicsFor(subjectId: string): Topic[] {
  if (subjectId === "bread") return [
    { name: "Hydration", question: "Two doughs have the same hydration but feel different. What might explain that?", observation: "Connected dough feel to flour and rest time, rather than hydration alone.", uncertainty: "Can you apply that distinction to a new batch without prompting?" },
    { name: "Controlled comparisons", question: "How would you compare two doughs without changing several things at once?", observation: "Proposed changing one variable while holding flour and rest time fixed.", uncertainty: "A repeated, independent comparison has not been observed." },
    { name: "Rest time", question: "What comparison would tell you whether resting changed the dough?", observation: "Discussed rest time as an alternative explanation for dough feel.", uncertainty: "We have not explored this independently yet." },
  ];
  if (subjectId !== "ai") return [
    { name: "Ideas to explore", question: "Which idea would you like to think through?", observation: "Discussed a Subject idea; this scripted demo has not evaluated understanding.", uncertainty: "No independent application has been observed." },
    { name: "Connections", question: "How might those ideas connect?", observation: "Discussed a possible connection; not an assessment.", uncertainty: "The connection remains unexplored." },
    { name: "Open questions", question: "What would you like to investigate?", observation: "Raised a question for later exploration.", uncertainty: "No conversation evidence yet." },
  ];
  return [
    { name: "Training loop", question: "The loss is flat. How would you find out where the training loop is getting stuck?", observation: "Separated loss calculation, gradients and parameter updates in the training loop.", uncertainty: "Independent diagnosis in a different setup is still uncertain." },
    { name: "Parameter updates", question: "Gradients are non-zero, but weights do not change. What would you inspect before changing the learning rate?", observation: "Distinguished non-zero gradients from actual weight changes; proposed inspecting the optimizer step.", uncertainty: "Applying this to a fresh failure without a prompt has not been observed." },
    { name: "Learning rate", question: "The weights change, but loss oscillates. What would you inspect next?", observation: "Considered the learning rate alongside update size rather than treating it as a universal fix.", uncertainty: "No independent comparison of learning rates has been observed." },
  ];
}
function seed(subjectId: string, topics: Topic[], eligible: boolean): Conversation[] {
  if (!eligible) return [];
  const bread = subjectId === "bread";
  return [
    { id: `${subjectId}-recent`, title: bread ? "Same hydration, different dough" : "Gradients, but no update", when: "Yesterday", topic: 1, messages: [
      { role: "you", text: bread ? "How do I compare two batches fairly?" : "Can gradients be non-zero without the weights changing?" },
      { role: "companion", text: topics[1].question },
    ] },
    { id: `${subjectId}-earlier`, title: bread ? "Making sense of hydration" : "Inside the training loop", when: "Monday", topic: 0, messages: [
      { role: "you", text: bread ? "Hydration is the water weight divided by the flour weight, right?" : "I think it goes loss, then gradients, then the optimizer updates the weights." },
      { role: "companion", text: bread ? "Yes. What else might change how two doughs feel?" : "Those are separate stages. What would you check if one stage did not run?" },
      { role: "you", text: bread ? "The flour could be different, or one might have rested longer." : "I would inspect the gradients, then compare the actual weights before and after the optimizer step." },
    ], recap: { text: topics[0].observation, through: 3 } },
  ];
}

function TopicLandscape({ topics, evidence, choose }: { topics: Topic[]; evidence: Evidence[]; choose: (i: number) => void }) {
  return <div className="space-y-3" aria-label="Topic landscape">{topics.map((topic, i) => {
    const items = evidence.filter(e => e.conversation.topic === i);
    const reviewed = items.some(e => e.reviewed);
    return <button key={topic.name} onClick={() => choose(i)} className={`block w-full rounded-[1.6rem] border px-5 py-5 text-left transition hover:border-foreground/40 ${reviewed ? "bg-emerald-50/70 dark:bg-emerald-950/20" : items.length ? "bg-amber-50/60 dark:bg-amber-950/20" : "border-dashed bg-muted/20"}`}><span className="block text-sm font-medium">{topic.name}</span><span className="mt-2 block text-xs leading-5 text-muted-foreground">{reviewed ? "A reviewed observation to build on" : items.length ? "An open thread to explore" : "Not explored in conversation"}</span><span className="mt-3 flex gap-1" aria-hidden="true">{items.map((e, n) => <span key={n} className={`size-2 rounded-full ${e.reviewed ? "bg-emerald-600" : "border border-amber-600"}`} />)}</span></button>;
  })}<p className="text-[11px] leading-5 text-muted-foreground">Each dot is an exchange, not a level. Empty space means unknown, not weak.</p></div>;
}
function ConceptMap({ topics, evidence, choose }: { topics: Topic[]; evidence: Evidence[]; choose: (i: number) => void }) {
  const positions = [{ left: "3%", top: "8%" }, { left: "31%", top: "67%" }, { left: "57%", top: "15%" }];
  return <div><div className="relative h-72" aria-label="Connected concept map"><svg className="absolute inset-0 size-full text-muted-foreground/30" viewBox="0 0 300 288" preserveAspectRatio="none" aria-hidden="true"><path d="M65 55 Q60 155 150 220 M150 220 Q250 175 245 75 M65 55 Q140 0 245 75" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" /></svg>{topics.map((topic, i) => {
    const items = evidence.filter(e => e.conversation.topic === i);
    return <button key={topic.name} style={positions[i]} onClick={() => choose(i)} className={`absolute flex min-h-24 w-[40%] flex-col items-center justify-center rounded-[2rem] border bg-background px-2 py-3 text-center text-xs shadow-sm hover:ring-2 hover:ring-foreground/20 ${items.some(e => e.reviewed) ? "border-emerald-600/50" : items.length ? "border-amber-600/50" : "border-dashed"}`}><span className="font-medium">{topic.name}</span><span className="mt-2 text-[10px] text-muted-foreground">{items.some(e => e.reviewed) ? "Reviewed observation" : items.length ? "In conversation" : "Unexplored"}</span></button>;
  })}</div><p className="text-[11px] leading-5 text-muted-foreground">Links show related ideas, not proven abilities. All nodes are equal size; there is no mastery scale.</p></div>;
}
function EvidenceTrail({ evidence, open }: { evidence: Evidence[]; open: (id: string) => void }) {
  return <div className="space-y-5 border-l pl-4" aria-label="Evidence trail">{evidence.map(e => <button key={e.conversation.id} className="block w-full text-left" onClick={() => open(e.conversation.id)}><span className="text-[10px] uppercase tracking-wide text-muted-foreground">{e.conversation.when} · {e.reviewed ? "Reviewed recap" : "Conversation · tentative"}</span><span className="mt-1 block text-sm font-medium">{e.conversation.title}</span><span className="mt-2 line-clamp-3 block text-xs leading-6 text-muted-foreground">{e.text}</span></button>)}{!evidence.length && <p className="text-xs leading-6 text-muted-foreground">Your exchanges will leave a trail here. Study documents alone do not fill it in.</p>}</div>;
}

export default function LearningProfilePrototype({ variant, subjectId }: { variant: string; subjectId: string }) {
  const router = useRouter();
  const { documents, subjects } = useStudyPrototype();
  const sources = approvedSources(documents, subjectId);
  const subject = subjects.find(s => s.id === subjectId)?.name ?? "Subject";
  const topics = topicsFor(subjectId);
  const eligible = sources.length > 0;
  const [conversations, setConversations] = useState<Conversation[]>(() => seed(subjectId, topics, eligible));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [historyOpen, setHistoryOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [recapEditing, setRecapEditing] = useState(false);
  const [recapDraft, setRecapDraft] = useState("");
  const [notice, setNotice] = useState("");
  const transcript = useRef<HTMLDivElement>(null);
  const selected = conversations.find(c => c.id === selectedId);
  const draftKey = selectedId ?? "new";
  const draft = drafts[draftKey] ?? "";
  const evidence: Evidence[] = conversations.filter(c => c.messages.some(m => m.role === "you")).map(c => ({ conversation: c, text: c.recap?.text ?? c.messages.filter(m => m.role === "you").at(-1)!.text, reviewed: !!c.recap }));
  const reviewedCount = evidence.filter(e => e.reviewed).length;
  useEffect(() => { transcript.current?.scrollTo({ top: transcript.current.scrollHeight, behavior: "smooth" }); }, [selectedId, selected?.messages.length, selected?.proposal]);
  function openConversation(id: string) {
    setSelectedId(id); setHistoryOpen(false); setKnowledgeOpen(false); setRecapEditing(false); setNotice("");
  }
  function newConversation() {
    setSelectedId(null); setHistoryOpen(false); setRecapEditing(false); setNotice("");
  }
  function updateConversation(next: Conversation) {
    setConversations(current => current.map(c => c.id === next.id ? next : c));
  }
  function send() {
    if (!draft.trim()) return;
    // Deliberately tiny routing of synthetic demo prompts; not semantic analysis.
    const topic = selected?.topic ?? (/rate|oscillat|rest/i.test(draft) ? 2 : /gradient|weight|compar|batch/i.test(draft) ? 1 : 0);
    const hasReasoning = !!selected?.messages.some(m => m.role === "you");
    const reply = !eligible ? "There is no approved study material here yet. You can keep this conversation, but this demo will not infer understanding from unapproved notes." : hasReasoning ? `What would you observe to distinguish that explanation from another possibility? ${topics[topic].uncertainty}` : topics[topic].question;
    const next: Conversation = { ...(selected ?? { id: crypto.randomUUID(), title: draft.trim().slice(0, 52), topic, messages: [] }), when: "Just now", messages: [...(selected?.messages ?? []), { role: "you", text: draft.trim() }, { role: "companion", text: reply }], dismissed: false };
    if (eligible && !next.recap && !next.proposal && !selected?.dismissed && next.messages.filter(m => m.role === "you").length >= 2) {
      next.proposal = { text: topics[topic].observation, through: next.messages.length };
    }
    setConversations(current => [next, ...current.filter(c => c.id !== next.id)]);
    setSelectedId(next.id); setDrafts(current => ({ ...current, [draftKey]: "" })); setRecapEditing(false);
    setNotice(selected ? "Conversation continued. Its reviewed recap remains; newer discussion is visible as unreviewed context." : "Conversation added to your trail. No Start or Finish step.");
  }
  function createRecap() {
    if (!selected || !eligible) return;
    updateConversation({ ...selected, proposal: { text: topics[selected.topic].observation, through: selected.messages.length }, dismissed: false });
    setRecapEditing(false); setNotice("A scripted recap is ready in this conversation. It does not end the conversation.");
  }
  function acceptRecap() {
    if (!selected?.proposal) return;
    updateConversation({ ...selected, recap: { ...selected.proposal, text: recapEditing ? recapDraft.trim() : selected.proposal.text }, proposal: undefined });
    setRecapEditing(false); setNotice("Recap updated. This reviewed interpretation now informs the Subject’s understanding view and future practice.");
  }
  const chooseTopic = (i: number) => { setSelectedTopic(i); setKnowledgeOpen(true); };
  const visual = variant === "A" ? <TopicLandscape topics={topics} evidence={evidence} choose={chooseTopic} /> : variant === "C" ? <EvidenceTrail evidence={evidence} open={openConversation} /> : <ConceptMap topics={topics} evidence={evidence} choose={chooseTopic} />;
  const history = <><div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Conversations</h2><Button variant="ghost" size="icon" aria-label="New conversation" onClick={newConversation}><Plus className="size-4" /></Button></div><button onClick={newConversation} className={`mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm ${!selectedId ? "bg-muted" : "hover:bg-muted/50"}`}><Plus className="size-4" />A new thread</button>{conversations.map(c => <button key={c.id} onClick={() => openConversation(c.id)} className={`mb-1 block w-full rounded-lg px-3 py-3 text-left ${c.id === selectedId ? "bg-muted" : "hover:bg-muted/50"}`}><span className="block truncate text-sm font-medium">{c.title}</span><span className="mt-1 block text-xs text-muted-foreground">{c.when} · {c.recap ? "Recap inside" : "Pick up where you left off"}</span></button>)}{!conversations.length && <p className="px-3 text-xs leading-6 text-muted-foreground">Your first message starts a conversation. Return to it whenever you like.</p>}</>;
  return <main className="mx-auto w-full max-w-6xl px-5 pt-6 sm:px-8"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-muted-foreground">{subject}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Pick up a thread.</h1></div><div className="flex gap-1"><Button variant="ghost" className="lg:hidden" aria-label="Conversations" onClick={() => setHistoryOpen(true)}><History /><span className="hidden sm:inline">Conversations</span></Button><Button variant="outline" onClick={newConversation}><Plus /><span className="hidden sm:inline">New conversation</span></Button></div></div>
    <button onClick={() => { setSelectedTopic(null); setKnowledgeOpen(true); }} className="mb-4 flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left lg:hidden"><span><span className="block text-sm font-medium">Understanding, taking shape</span><span className="text-xs text-muted-foreground">{reviewedCount} reviewed recap(s) · {evidence.length} conversation(s)</span></span><ArrowRight className="size-4" /></button>
    <div className="grid items-start gap-7 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="hidden max-h-[calc(100dvh-270px)] space-y-7 overflow-y-auto pr-3 pb-4 lg:block"><section>{history}</section><section className="border-t pt-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-medium">Understanding, taking shape</h2><Sparkles className="size-4 text-muted-foreground" /></div>{visual}<Button className="mt-4 w-full" variant="ghost" onClick={() => { setSelectedTopic(null); setKnowledgeOpen(true); }}>Explore understanding <ArrowRight /></Button></section></aside>
      <section className="flex h-[calc(100dvh-420px)] min-h-[430px] flex-col overflow-hidden rounded-xl border bg-card lg:h-[calc(100dvh-360px)]" aria-label="Subject conversation">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-4"><div className="min-w-0"><h2 className="truncate text-sm font-medium">{selected?.title ?? "What’s on your mind?"}</h2><p className="mt-1 text-[11px] text-muted-foreground">{selected ? "Continue this conversation · no need to reopen or finish it" : "Just start talking. A conversation will appear in your trail."}</p></div><MessageCircle className="size-4 shrink-0 text-muted-foreground" /></div>
        <div ref={transcript} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7" aria-label="Conversation messages" tabIndex={0}>
          {!selected && <div className="py-5"><p className="max-w-md text-xl leading-8 font-medium">Bring a question.<br /><span className="text-muted-foreground">We’ll follow your thinking.</span></p><p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">Your conversations and recaps leave a picture of what’s becoming clearer—and what is still worth exploring.</p><Button variant="outline" className="mt-5 h-auto min-h-11 whitespace-normal text-left" disabled={!eligible} onClick={() => setDrafts(current => ({ ...current, new: subjectId === "bread" ? "Two batches have the same hydration but feel different." : "Can gradients be non-zero without weights changing?" }))}>Try a question from my study material <ArrowRight /></Button>{reviewedCount > 0 && <p className="mt-4 text-xs leading-6 text-muted-foreground">Picking up from your reviewed recap: {evidence.find(e => e.reviewed)?.text} Let’s try a different situation rather than assume it’s settled.</p>}</div>}
          {selected?.messages.map((m, i) => <article key={i} className={m.role === "you" ? "ml-5 rounded-xl bg-muted px-4 py-3 sm:ml-14" : "pr-3"}><p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{m.role === "you" ? "You" : "Companion · scripted"}</p><p className="text-sm leading-7 whitespace-pre-wrap break-words">{m.text}</p></article>)}
          {selected?.recap && <article className="rounded-lg border-l-2 border-emerald-600/50 bg-emerald-50/50 p-4 dark:bg-emerald-950/20"><p className="mb-2 text-xs font-medium">Your reviewed recap {selected.messages.length > selected.recap.through && <span className="font-normal text-muted-foreground">· more conversation since</span>}</p><p className="text-sm leading-7 whitespace-pre-wrap break-words">{selected.recap.text}</p><p className="mt-2 text-xs leading-6 text-muted-foreground">{topics[selected.topic].uncertainty}</p><Button className="mt-2" size="sm" variant="ghost" onClick={() => { updateConversation({ ...selected, proposal: { ...selected.recap! } }); setRecapDraft(selected.recap!.text); setRecapEditing(true); }}>Correct recap</Button></article>}
          {selected?.proposal && <article className="space-y-3 rounded-xl border border-dashed p-4"><p className="text-xs font-medium">A moment to reflect · proposed recap</p><p className="text-[11px] leading-5 text-muted-foreground">Scripted interpretation, not analysis of your answer. Review before it guides later practice.</p>{recapEditing ? <><label htmlFor={`recap-${subjectId}`} className="sr-only">Correct recap</label><Textarea id={`recap-${subjectId}`} value={recapDraft} onChange={e => setRecapDraft(e.target.value)} /></> : <p className="text-sm leading-7">{selected.proposal.text}</p>}<p className="text-xs leading-6 text-muted-foreground">Still uncertain: {topics[selected.topic].uncertainty}</p><div className="flex flex-wrap gap-1"><Button size="sm" onClick={acceptRecap} disabled={recapEditing && !recapDraft.trim()}>{recapEditing ? "Keep my correction" : "Seems fair"}</Button>{!recapEditing && <Button size="sm" variant="outline" onClick={() => { setRecapDraft(selected.proposal!.text); setRecapEditing(true); }}>Correct</Button>}<Button size="sm" variant="ghost" onClick={() => { updateConversation({ ...selected, proposal: undefined, dismissed: true }); setNotice("Recap dismissed. Any earlier reviewed recap is unchanged."); }}>Dismiss</Button></div></article>}
          {selected && !selected.proposal && eligible && <Button size="sm" variant="ghost" onClick={createRecap}><Sparkles />{selected.recap ? selected.messages.length > selected.recap.through ? "Reflect on the newer discussion" : "Revisit this recap" : selected.dismissed ? "Try another recap" : "Recap this conversation"}</Button>}
        </div>
        <form className="shrink-0 border-t p-3 sm:p-4" onSubmit={e => { e.preventDefault(); send(); }}><label htmlFor={`chat-${subjectId}`} className="sr-only">Your message</label><Textarea id={`chat-${subjectId}`} className="min-h-16 max-h-28 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0" placeholder={selected ? "Keep thinking together…" : "Ask a question, test an idea, or tell me what you’re studying…"} value={draft} onChange={e => setDrafts(current => ({ ...current, [draftKey]: e.target.value }))} /><div className="mt-1 flex items-center justify-between gap-2"><span className="text-[10px] leading-5 text-muted-foreground">Scripted AI · in memory only</span><Button type="submit" size="icon" aria-label="Send message" disabled={!draft.trim()}><Send /></Button></div></form>
      </section>
    </div>
    <p role="status" className="mt-3 min-h-5 text-[11px] leading-5 text-muted-foreground">{notice}</p>
    <details className="mt-2 text-xs text-muted-foreground"><summary className="cursor-pointer py-2"><BookOpen className="mr-1 inline size-3" />Context for this Subject · {sources.length} approved sources</summary><div className="space-y-3 py-3">{sources.map(s => <div key={s.id}><p className="font-medium">{s.title}</p><p className="mt-1 leading-6">{s.description}</p></div>)}<p className="leading-6">The scripted AI-engineering and bread scenarios draw on both approved sample sources. Drafts, Reference notes and Personal profile do not count as understanding evidence. A conversation belongs to its Subject, not a document.</p></div></details>
    <details className="mt-2 text-[11px] text-muted-foreground"><summary className="cursor-pointer py-2">Prototype assumptions & current state</summary><p className="py-3 leading-6">Conversation signals appear as tentative context; only reviewed recaps guide later practice. This is a provisional timing rule, not a settled automatic-update policy. No Finish action, no mastery score. Reload resets everything. Conversation deletion and retention policy are intentionally not explored in this revision.</p><pre className="overflow-auto whitespace-pre-wrap break-words">{JSON.stringify({ variant, subjectId, selectedId, conversations, drafts, evidence: evidence.map(e => ({ conversationId: e.conversation.id, reviewed: e.reviewed, text: e.text })), eligibleSourceIds: sources.map(s => s.id), engine: "scripted; no semantic evaluation", persistence: "none" }, null, 2)}</pre></details>
    <Dialog open={historyOpen} onOpenChange={setHistoryOpen}><DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md"><DialogHeader><DialogTitle>Your conversations</DialogTitle><DialogDescription>Pick up any thread. Starting a new one does not end another.</DialogDescription></DialogHeader>{history}</DialogContent></Dialog>
    <Dialog open={knowledgeOpen} onOpenChange={setKnowledgeOpen}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>Understanding, taking shape</DialogTitle><DialogDescription>{subject} · a view of the conversations behind your learning, not a verdict on what you know.</DialogDescription></DialogHeader><div className="flex flex-wrap gap-1" aria-label="Compare visual representations">{["Topic landscape", "Connected concepts", "Evidence trail"].map((name, i) => <Button key={name} size="sm" variant={variant === ["A", "B", "C"][i] ? "secondary" : "ghost"} onClick={() => { const url = new URL(window.location.href); url.searchParams.set("variant", ["A", "B", "C"][i]); router.replace(url.pathname + url.search, { scroll: false }); }}>{name}</Button>)}</div><div className="grid items-start gap-7 sm:grid-cols-2"><section>{visual}</section><section className="space-y-5"><div className="flex flex-wrap gap-2">{topics.map((t, i) => <Button size="sm" key={t.name} variant={selectedTopic === i ? "secondary" : "ghost"} onClick={() => setSelectedTopic(i)}>{t.name}</Button>)}</div><h3 className="text-lg font-medium">{selectedTopic === null ? "Follow an idea back to a conversation" : topics[selectedTopic].name}</h3><p className="text-xs leading-6 text-muted-foreground">{selectedTopic === null ? "Choose an idea to see what supports it, what is tentative, and what remains unknown." : topics[selectedTopic].uncertainty}</p>{evidence.filter(e => selectedTopic === null || e.conversation.topic === selectedTopic).map(e => <article key={e.conversation.id} className="space-y-2 border-t pt-4"><Badge variant="outline">{e.reviewed ? "Reviewed recap · provisional" : "Conversation signal · not reviewed"}</Badge><p className="text-sm leading-7 whitespace-pre-wrap break-words">{e.text}</p>{e.reviewed && e.conversation.messages.length > (e.conversation.recap?.through ?? 0) && <p className="text-xs text-muted-foreground">Newer discussion has not been recapped yet.</p>}<Button size="sm" variant="ghost" onClick={() => openConversation(e.conversation.id)}>Continue “{e.conversation.title.slice(0, 30)}” <ArrowRight /></Button></article>)}{selectedTopic !== null && !evidence.some(e => e.conversation.topic === selectedTopic) && <p className="text-sm leading-7 text-muted-foreground">No conversation evidence yet. Having study material on this idea does not mean you have demonstrated understanding.</p>}</section></div></DialogContent></Dialog>
  </main>;
}
