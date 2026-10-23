import type { AssessmentBudget } from '@/lib/assessment';

// A display/pacing calculation, never an answer-submission timer.
export function assessmentTiming(budget: AssessmentBudget | null | undefined, now: number) {
  if (!budget) return { phase: 'unlimited' as const, elapsed_seconds: 0, remaining_seconds: null };
  const elapsed = Math.max(0, (now - Date.parse(budget.started_at)) / 1000);
  const remaining = budget.minutes * 60 - elapsed;
  const phase = remaining <= 0 ? 'expired' : remaining <= Math.min(90, budget.minutes * 12) ? 'near_end' : 'open';
  return { phase, elapsed_seconds: Math.floor(elapsed), remaining_seconds: Math.floor(remaining) };
}
