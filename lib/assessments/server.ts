import 'server-only';
import type { Assessment, AssessmentBudget, Difficulty } from '@/lib/assessment';
import { SettingsError } from '@/lib/openai/server';
import { assessmentTiming } from './timing';

export function requestedMinutes(text: string): number | null {
  const numbers: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, fifteen: 15, twenty: 20, thirty: 30, forty: 40, sixty: 60, ninety: 90 };
  if (/\b(?:a )?quarter (?:of )?(?:an? )?hour\b/i.test(text)) return 15;
  if (/\b(?:a )?half (?:an? )?hour\b/i.test(text)) return 30;
  const match = text.match(/(?:^|\s|\bfor |\bin )(-?\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|forty|sixty|ninety)[ -]?(minutes?|mins?|m|hours?|hrs?|h)\b/i);
  if (!match) return null;
  const amount = numbers[match[1].toLowerCase()] ?? Number(match[1]);
  const minutes = amount * (/^(h|hr|hour)/i.test(match[2]) ? 60 : 1);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) throw new SettingsError('Use a soft assessment budget of 1–240 whole minutes. Your message is saved; no assessment generation was started.', 422);
  return minutes;
}

export function assessmentRequested(text: string) {
  return /\b(assess(?:ment|ments)?|quiz|test (?:me|my)|challenge me)\b/i.test(text) || (requestedMinutes(text) !== null && /\b(on|about|practise|practice|questions?)\b/i.test(text));
}
export function requestedDifficulty(text: string): Difficulty | null {
  const explicit = assessmentRequested(text) ? text.match(/\b(easy|medium|hard)\b/i) : text.match(/^\s*(easy|medium|hard)(?:\s+please)?[.!]?\s*$/i);
  if (explicit) return explicit[1].toLowerCase() as Difficulty;
  const match = text.match(/\b(easy|medium|hard)(?:[- ]level)?\s+(?:questions?|assessment|quiz|difficulty|challenge)\b|\b(?:difficulty|level)\s*(?:of|is|:|to)?\s*(easy|medium|hard)\b|\bmake (?:it|this|them) (easy|medium|hard)\b/i);
  return (match?.slice(1).find(Boolean)?.toLowerCase() as Difficulty | undefined) ?? null;
}
export function assessmentInstructions(state: Assessment | null, text: string) {
  const difficulty = requestedDifficulty(text) ?? state?.requested_difficulty ?? null;
  const minutes = requestedMinutes(text);
  let budget: AssessmentBudget | null = state?.budget ?? null;
  if (minutes !== null && (!budget || !/\b(resume|continue|old|previous|original)\b/i.test(text) || /\b(another|more|reset|restart|extend|set|have|got)\b|\bnew (?:assessment )?(?:time )?budget\b/i.test(text))) budget = { minutes, started_at: new Date(Date.now()).toISOString(), continued: false };
  else if (budget && /\bcontinue\b.*\b(beyond|expired|old time|without.*time)\b/i.test(text)) budget = { ...budget, continued: true };
  const timing = assessmentTiming(budget, Date.now());
  return { state, budget, timing, requested_difficulty: difficulty, instructions: `ADAPTIVE_ASSESSMENT: Return ONLY a JSON object with exactly these fields:
feedback: string (brief feedback, assistance or ordinary chat, no new assessment question here),
question: string or null (exactly ONE new question, never a list),
difficulty: "easy", "medium", "hard" or null (for a NEW question),
topic: string (at most 300 UTF-8 bytes),
action: "answer", "hint", "explanation", "skip", "chat" or "resume" (what the CURRENT learner message does with the CURRENT open question),
checkpoint: boolean,
estimated_minutes: integer 1–60 or null (rough time for a NEW question, not a guarantee).
Soft time budget (authorised pacing data): ${JSON.stringify({ budget, ...timing })}. Consider elapsed/remaining time and whether a substantial next question fits. Near the end or after expiry, offer a recap/checkpoint instead of automatically starting substantial work, unless the learner explicitly continued beyond the old budget. Never interrupt, auto-submit, discard or mark an answer wrong because time elapsed. Supply requested hints/explanations even after expiry. An explicit continuation lifts pacing restraint without resetting the original start; only an explicit new duration starts a new window. No hard question count, exact duration guarantees, timer-based score or hidden idle work. If budget is null, choose activity length freely. Keep explicit difficulty above time-based adaptation. When difficulty is open, vary difficulty per question as appropriate for the remaining time and reviewed context.
Use ONLY current approved sources supplied to this request as subject material; historical questions are not newly eligible sources. Follow the learner's explicit topic and requested difficulty ${difficulty ?? '(open: choose per question)'}. Infer topic from the learner's request, not a fixed topic list. If the requested topic is unsupported, explain the limitation and ask for clarification in feedback; do not invent a syllabus. Use reviewed uncertainty only as provisional revisit context. Never infer mastery from one answer or erase earlier reviewed observations.
An existing open question must be resumed, not replaced: on hint/explanation/chat/resume set question=null. Give requested hints/explanations as assistance, not independent performance; keep the question open. Skip means not assessed, not failed. An answer may receive feedback and one next question, or a checkpoint instead. Opening a question is not evidence. Ordinary chat/topic requests are not answers. When there is no open question, start a question if asked to assess or continue; otherwise converse. No fixed question count, hard three-question limit or fixed topic list. Offer a checkpoint when the activity meaningfully warrants review, not after an arbitrary count. A checkpoint is an optional inline recap offer, never a finish gate; continue on request. Difficulty is AI-estimated task difficulty, not calibrated ability. All progress is tentative until a separate recap is explicitly reviewed. No durable learning judgments or automatic recap acceptance.
Authorised activity state (data, not source material): ${JSON.stringify(state)}` };
}

type Output = { estimated_minutes: number | null; feedback: string; question: string | null; difficulty: Difficulty | null; topic: string; action: 'answer' | 'hint' | 'explanation' | 'skip' | 'chat' | 'resume'; checkpoint: boolean };
export function readAssessmentOutput(raw: string, state: Assessment | null, text: string, plan: ReturnType<typeof assessmentInstructions>) {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new SettingsError('Assessment output was unreadable. Progress was not advanced. Retry explicitly; another generation may incur charges.', 422); }
  const v = value as Output;
  if (!v || typeof v !== 'object' || Object.keys(v).sort().join(',') !== 'action,checkpoint,difficulty,estimated_minutes,feedback,question,topic' || typeof v.feedback !== 'string' || typeof v.topic !== 'string' || !v.topic.trim() || new TextEncoder().encode(v.topic).length > 300 || !(v.question === null || (typeof v.question === 'string' && v.question.trim() && new TextEncoder().encode(v.question).length <= 6000)) || !(v.difficulty === null || ['easy','medium','hard'].includes(v.difficulty)) || !['answer','hint','explanation','skip','chat','resume'].includes(v.action) || typeof v.checkpoint !== 'boolean' || !(v.estimated_minutes === null || (Number.isInteger(v.estimated_minutes) && v.estimated_minutes >= 1 && v.estimated_minutes <= 60))) throw new SettingsError('Assessment output was invalid. Progress was not advanced. Request another reply explicitly.', 422);
  const requested = requestedDifficulty(text) ?? state?.requested_difficulty ?? null;
  // Canonical UI requests cannot be reclassified as answers by the model.
  if (/^(?:please )?give (?:me )?(?:a )?hint\b/i.test(text)) v.action = 'hint';
  else if (/^(?:please )?explain (?:this|the current) (?:assessment )?question\b/i.test(text)) v.action = 'explanation';
  else if (/^skip (?:this|the current) (?:assessment )?question\b/i.test(text)) v.action = 'skip';
  else if (/^(?:resume my assessment|continue my assessment|set a new assessment time budget)\b/i.test(text)) v.action = 'resume';
  if (state?.current_question && !['answer','skip'].includes(v.action)) { v.question = null; v.difficulty = null; }
  // Never silently relabel a question designed at a different difficulty.
  if (v.question && (!v.difficulty || (requested && v.difficulty !== requested))) throw new SettingsError('The generated question did not respect the requested difficulty. Progress was not advanced. Request another reply explicitly.', 422);
  const timing = assessmentTiming(plan.budget, Date.now());
  let pacing = '';
  if (plan.budget && !plan.budget.continued && (timing.phase === 'near_end' || timing.phase === 'expired' || (v.question && (v.estimated_minutes === null || v.estimated_minutes * 60 > (timing.remaining_seconds ?? 0) + 5)))) {
    v.question = null; v.difficulty = null; v.checkpoint = true;
    pacing = timing.phase === 'expired' ? 'The original time budget has expired. Your answer and conversation are not cut off. Review a recap, continue beyond the budget, or set a new budget.' : 'We are near the time budget or another substantial question may not fit. Review a recap, continue beyond the budget, or set a new budget.';
  } else if (plan.budget?.continued && timing.phase === 'expired') pacing = 'The original time window has expired; continuing by your request, without restarting it.';
  const reply = [v.action === 'hint' ? 'Hint · assistance, not independent performance.' : v.action === 'explanation' ? 'Explanation · assistance, not independent performance.' : '', v.feedback, v.question ? `Question · ${v.difficulty} (AI-estimated)\n${v.question}` : '', v.action === 'skip' ? 'Skipped · not assessed, not failed.' : '', pacing, v.checkpoint ? '[recap-checkpoint]' : ''].filter(Boolean).join('\n\n');
  if (!reply.trim() || new TextEncoder().encode(reply).length > 16000) throw new SettingsError('Assessment reply exceeded its limits. Progress was not advanced.', 422);
  return { ...v, budget: plan.budget, requested_difficulty: requested, reply };
}
