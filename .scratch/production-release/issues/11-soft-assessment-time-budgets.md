# 11: Adapt assessment to a soft time budget

**What to build:** Let the learner ask for an assessment within available time, such as 15 minutes on a topic, without turning the conversation into a timed exam.

**Blocked by:** 10 — Run adaptive assessments inside chat.

**Status:** ready-for-agent

- [ ] Recognise ordinary-language topic/time requests and combinations with explicit difficulty. When difficulty is open, AI can vary it per question while considering remaining time and reviewed context.
- [ ] Persist the time-window context needed to resume an assessment. During active requests, consider elapsed time and whether another substantial question fits; no idle background AI analysis is required.
- [ ] Near the budget's end, offer a recap/wrap-up rather than automatically starting substantial new work. Do not cut off an answer, auto-submit, force a score or prevent continuation.
- [ ] Returning after the window acknowledges expiry and offers continued activity or a new budget rather than silently treating an old duration as fresh.
- [ ] Time budgets do not impose a hard question count, guarantee exact answer durations or promote activity completion into demonstrated understanding.
- [ ] Respect existing save/retry behaviour and do not run scheduled or hidden AI jobs when the learner is absent.
- [ ] Public-boundary tests use a controllable clock and controlled provider responses to verify pacing context, near-expiry offers, return after expiry, explicit difficulty precedence, persisted resumption and unrestricted continuation without long real waits.
