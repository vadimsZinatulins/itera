'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { AssessmentBudget } from '@/lib/assessment';
import { assessmentTiming } from '@/lib/assessments/timing';

export default function AssessmentBudgetStatus({ budget, disabled, prepare }: { budget: AssessmentBudget | null | undefined; disabled: boolean; prepare: (text: string) => void }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const first = window.setTimeout(() => setNow(Date.now()), 0);
    // Display only: no submission, generation or network request on this timer.
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, []);
  const timing = now === null ? null : assessmentTiming(budget, now);
  return <section aria-label="Assessment time budget" className="space-y-2">
    <p>{budget ? `Soft budget · ${budget.minutes} minutes · original window started ${new Date(budget.started_at).toISOString()}` : 'No time budget set. Activity length remains open.'}</p>
    {timing?.phase === 'expired' && <p role="status">The original time budget has expired. {budget?.continued ? 'Continuing by your request; the original window has not restarted.' : 'Your answer is not cut off. Continue beyond the budget or set a new budget; a recap is optional.'}</p>}
    {timing?.phase === 'near_end' && !budget?.continued && <p>Near the end of your soft budget. You can review a recap or keep talking.</p>}
    <div className="flex flex-wrap gap-2">
      {budget && !budget.continued && <Button type="button" className="min-h-11" variant="outline" disabled={disabled} onClick={() => prepare('Continue my assessment beyond the old time budget; keep its original window and any unanswered question.')}>Continue beyond budget</Button>}
      <Button type="button" className="min-h-11" variant="outline" disabled={disabled} onClick={() => prepare('Set a new assessment time budget of 15 minutes; keep any unanswered question.')}>Set new time budget</Button>
    </div>
    <p className="text-xs text-muted-foreground">A pacing guide, not a timed exam or a duration guarantee. No automatic submission, score or idle AI work.</p>
  </section>;
}
