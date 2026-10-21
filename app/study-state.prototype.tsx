"use client";

// Throwaway, in-memory study state. Practice receives approved snapshots only.
import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

export type Subject = { id: string; name: string };
const initialSubjects: Subject[] = [{ id: "ai", name: "AI engineering" }, { id: "bread", name: "Bread making" }, { id: "math", name: "Mathematics" }];
export type Block = { id: string; markdown: string };
export type DocumentContent = { title: string; description: string; blocks: Block[] };
export type LearningDocument = DocumentContent & { id: string; subjectId: string; updated: string; practice: DocumentContent | null };
export type PracticeSource = DocumentContent & { id: string; subjectId: string };
export function contentSnapshot(document: DocumentContent): DocumentContent {
  return { title: document.title, description: document.description, blocks: document.blocks.map(b => ({ ...b })) };
}
export function hasDraftRevision(document: LearningDocument) {
  return !!document.practice && JSON.stringify(contentSnapshot(document)) !== JSON.stringify(document.practice);
}
export function documentStatus(document: LearningDocument) {
  return !document.practice ? "Draft" : hasDraftRevision(document) ? "Draft revision" : "Available for practice";
}
export function approvedSources(documents: LearningDocument[], subjectId: string): PracticeSource[] {
  return documents.flatMap(d => d.subjectId === subjectId && d.practice ? [{ id: d.id, subjectId: d.subjectId, ...contentSnapshot(d.practice) }] : []);
}
const training: DocumentContent = { title: "Training loop fundamentals", description: "A short, approved starting point for practice.", blocks: [{ id: "training-loop", markdown: "## A training loop\n\nA neural network learns by computing a loss, calculating gradients, and updating its parameters. The learning rate scales each update.\n\nIf training stalls, inspect the gradients and the actual parameter changes before changing the model." }] };
const hydration: DocumentContent = { title: "Bread hydration basics", description: "An approved explanation of baker’s percentages.", blocks: [{ id: "hydration-basics", markdown: "## Baker’s percentages\n\nHydration expresses water weight relative to flour weight. With 500 g of flour and 350 g of water, hydration is 70%. Different flours can absorb water differently, so the same hydration does not always feel the same." }] };
const initialDocuments: LearningDocument[] = [
  { id: "gradient-descent", subjectId: "ai", title: "Making sense of gradient descent", description: "My unfinished self-study notes. Not available for practice yet.", updated: "Yesterday", practice: null, blocks: [
    { id: "idea", markdown: "## The basic idea\n\nGradient descent adjusts parameters in the direction opposite to the gradient of the loss. The learning rate controls how large a step we take.\n\nI want to connect the formula to what actually happens in a training loop." },
    { id: "update", markdown: "## A single update\n\n```python\nweights = weights - learning_rate * gradient\n```\n\n- Compute the loss.\n- Work backward to get gradients.\n- Update the parameters.\n- Repeat and inspect what changes." },
    { id: "question", markdown: "## My current assumption\n\nA smaller learning rate always fixes training.\n\n> I’m not sure about this yet. Try **Review correctness** on this block to explore the review interaction." },
  ] },
  { id: "training-basics", subjectId: "ai", ...contentSnapshot(training), updated: "Yesterday", practice: contentSnapshot(training) },
  { id: "bread", subjectId: "bread", title: "What I learned about bread dough", description: "Unfinished notes on resting and comparing batches.", updated: "3 days ago", practice: null, blocks: [
    { id: "hydration", markdown: "## Hydration\n\nBaker’s percentages express water relative to flour weight. For 500 g of flour and 350 g of water, the hydration is **70%**.\n\nThe same percentage can feel different with different flours." },
    { id: "rest", markdown: "## What I want to try next\n\nCompare two small batches with the same ingredients, but give one a longer rest before shaping. Record what changes instead of assuming one result proves a rule." },
  ] },
  { id: "hydration-basics", subjectId: "bread", ...contentSnapshot(hydration), updated: "3 days ago", practice: contentSnapshot(hydration) },
];

type StudyState = { subjects: Subject[]; subjectId: string; setSubjectId: Dispatch<SetStateAction<string>>; documents: LearningDocument[]; setDocuments: Dispatch<SetStateAction<LearningDocument[]>>; addSubject: (name: string) => string | null; deleteSubject: (id: string, confirmation: string) => boolean };
const StudyContext = createContext<StudyState | null>(null);
export function StudyPrototypeProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [subjectId, setSubjectId] = useState("ai");
  const [documents, setDocuments] = useState(initialDocuments);
  function addSubject(input: string) {
    const name = input.trim();
    if (!name || subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) return null;
    const id = crypto.randomUUID();
    setSubjects(current => [...current, { id, name }]);
    setSubjectId(id);
    return id;
  }
  function deleteSubject(id: string, confirmation: string) {
    const target = subjects.find(s => s.id === id);
    if (!target || confirmation !== target.name) return false;
    setSubjects(current => current.filter(s => s.id !== id));
    setDocuments(current => current.filter(d => d.subjectId !== id));
    if (subjectId === id) setSubjectId(subjects.find(s => s.id !== id)?.id ?? "");
    return true;
  }
  return <StudyContext.Provider value={{ subjects, subjectId, setSubjectId, documents, setDocuments, addSubject, deleteSubject }}>{children}</StudyContext.Provider>;
}
export function useStudyPrototype() {
  const state = useContext(StudyContext);
  if (!state) throw new Error("Study prototype requires its in-memory provider.");
  return state;
}

export function practiceCandidate(sources: PracticeSource[], selection: number) {
  const source = sources[Math.floor(selection / 2) % sources.length];
  if (!source) return null;
  const excerpt = source.blocks.map(b => b.markdown).join("\n\n").slice(0, 900);
  const alternate = selection % 2 === 1;
  return {
    source,
    title: `${alternate ? "Question an assumption" : "Put an idea to work"}: ${source.title}`,
    topic: source.title,
    time: alternate ? "6 min" : "8 min",
    reason: "Picked from an approved practice version in this subject. Drafts and draft revisions are excluded.",
    prompt: `From your approved practice version:\n\n${excerpt}\n\n${alternate ? "Pick a claim here. Under what conditions could a broad interpretation of it fail? Explain a concrete example." : "Choose one idea here and apply it to a concrete situation. What would you expect to happen, and what would you inspect if it didn’t?"}`,
    hint: "Start with one claim, describe a small example, and name an assumption you are making.",
    followup: "Now change one assumption in your example. Would your conclusion still hold? What observation could distinguish the two cases?",
    explanation: "The aim is to connect a claim to its assumptions and observable consequences, not just repeat the wording. This scripted demo cannot evaluate your explanation.",
  };
}
export type PracticeCandidate = NonNullable<ReturnType<typeof practiceCandidate>>;
