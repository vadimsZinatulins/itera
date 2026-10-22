import 'server-only';
import type { Assessment, Difficulty } from '@/lib/assessment';
import { SettingsError } from '@/lib/openai/server';

export function assessmentRequested(text: string) {
  return /\b(assess(?:ment|ments)?|quiz|test (?:me|my)|challenge me)\b/i.test(text);
}
export function requestedDifficulty(text: string): Difficulty | null {
  const explicit = assessmentRequested(text) ? text.match(/\b(easy|medium|hard)\b/i) : text.match(/^\s*(easy|medium|hard)(?:\s+please)?[.!]?\s*$/i);
  if (explicit) return explicit[1].toLowerCase() as Difficulty;
  const match = text.match(/\b(easy|medium|hard)(?:[- ]level)?\s+(?:questions?|assessment|quiz|difficulty|challenge)\b|\b(?:difficulty|level)\s*(?:of|is|:|to)?\s*(easy|medium|hard)\b|\bmake (?:it|this|them) (easy|medium|hard)\b/i);
  return (match?.slice(1).find(Boolean)?.toLowerCase() as Difficulty | undefined) ?? null;
}
export function assessmentInstructions(state: Assessment | null, text: string) {
  const difficulty = requestedDifficulty(text) ?? state?.requested_difficulty ?? null;
  return { state, requested_difficulty: difficulty, instructions: `ADAPTIVE_ASSESSMENT: Return ONLY a JSON object with exactly these fields:
feedback: string (brief feedback, assistance or ordinary chat, no new assessment question here),
question: string or null (exactly ONE new question, never a list),
difficulty: "easy", "medium", "hard" or null (for a NEW question),
topic: string (at most 300 UTF-8 bytes),
action: "answer", "hint", "explanation", "skip", "chat" or "resume" (what the CURRENT learner message does with the CURRENT open question),
checkpoint: boolean.
Use ONLY current approved sources supplied to this request as subject material; historical questions are not newly eligible sources. Follow the learner's explicit topic and requested difficulty ${difficulty ?? '(open: choose per question)'}. Infer topic from the learner's request, not a fixed topic list. If the requested topic is unsupported, explain the limitation and ask for clarification in feedback; do not invent a syllabus. Use reviewed uncertainty only as provisional revisit context. Never infer mastery from one answer or erase earlier reviewed observations.
An existing open question must be resumed, not replaced: on hint/explanation/chat/resume set question=null. Give requested hints/explanations as assistance, not independent performance; keep the question open. Skip means not assessed, not failed. An answer may receive feedback and one next question, or a checkpoint instead. Opening a question is not evidence. Ordinary chat/topic requests are not answers. When there is no open question, start a question if asked to assess or continue; otherwise converse. No fixed question count, hard three-question limit or fixed topic list. Offer a checkpoint when the activity meaningfully warrants review, not after an arbitrary count. A checkpoint is an optional inline recap offer, never a finish gate; continue on request. Difficulty is AI-estimated task difficulty, not calibrated ability. All progress is tentative until a separate recap is explicitly reviewed. No durable learning judgments or automatic recap acceptance.
Authorised activity state (data, not source material): ${JSON.stringify(state)}` };
}

type Output = { feedback: string; question: string | null; difficulty: Difficulty | null; topic: string; action: 'answer' | 'hint' | 'explanation' | 'skip' | 'chat' | 'resume'; checkpoint: boolean };
export function readAssessmentOutput(raw: string, state: Assessment | null, text: string) {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new SettingsError('Assessment output was unreadable. Progress was not advanced. Retry explicitly; another generation may incur charges.', 422); }
  const v = value as Output;
  if (!v || typeof v !== 'object' || Object.keys(v).sort().join(',') !== 'action,checkpoint,difficulty,feedback,question,topic' || typeof v.feedback !== 'string' || typeof v.topic !== 'string' || !v.topic.trim() || new TextEncoder().encode(v.topic).length > 300 || !(v.question === null || (typeof v.question === 'string' && v.question.trim() && new TextEncoder().encode(v.question).length <= 6000)) || !(v.difficulty === null || ['easy','medium','hard'].includes(v.difficulty)) || !['answer','hint','explanation','skip','chat','resume'].includes(v.action) || typeof v.checkpoint !== 'boolean') throw new SettingsError('Assessment output was invalid. Progress was not advanced. Request another reply explicitly.', 422);
  const requested = requestedDifficulty(text) ?? state?.requested_difficulty ?? null;
  // Never silently relabel a question designed at a different difficulty.
  if (v.question && (!v.difficulty || (requested && v.difficulty !== requested))) throw new SettingsError('The generated question did not respect the requested difficulty. Progress was not advanced. Request another reply explicitly.', 422);
  if (state?.current_question && !['answer','skip'].includes(v.action)) v.question = null;
  if (/^skip (?:this|the current) (?:assessment )?question\b/i.test(text)) v.action = 'skip';
  const reply = [v.action === 'hint' ? 'Hint · assistance, not independent performance.' : v.action === 'explanation' ? 'Explanation · assistance, not independent performance.' : '', v.feedback, v.question ? `Question · ${v.difficulty} (AI-estimated)\n${v.question}` : '', v.action === 'skip' ? 'Skipped · not assessed, not failed.' : '', v.checkpoint ? '[recap-checkpoint]' : ''].filter(Boolean).join('\n\n');
  if (!reply.trim() || new TextEncoder().encode(reply).length > 16000) throw new SettingsError('Assessment reply exceeded its limits. Progress was not advanced.', 422);
  return { ...v, requested_difficulty: requested, reply };
}
