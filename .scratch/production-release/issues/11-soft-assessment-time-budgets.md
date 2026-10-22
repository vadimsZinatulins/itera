# 11: Adapt assessment to a soft time budget

**What to build:** Let the learner ask for an assessment within available time, such as 15 minutes on a topic, without turning the conversation into a timed exam.

**Blocked by:** 10 — Run adaptive assessments inside chat.

**Status:** ready-for-human

**Implementation:** `feat/10-11-adaptive-assessment-budgets`, following issue 10 on the same branch. Implemented; awaiting manual acceptance. See [soft-budget behavior and migration notes](../../../docs/conversations.md#soft-assessment-time-budgets).

- [x] Recognise ordinary-language topic/time requests and combinations with explicit difficulty. When difficulty is open, AI can vary it per question while considering remaining time and reviewed context.
- [x] Persist the time-window context needed to resume an assessment. During active requests, consider elapsed time and whether another substantial question fits; no idle background AI analysis is required.
- [x] Near the budget's end, offer a recap/wrap-up rather than automatically starting substantial new work. Do not cut off an answer, auto-submit, force a score or prevent continuation.
- [x] Returning after the window acknowledges expiry and offers continued activity or a new budget rather than silently treating an old duration as fresh.
- [x] Time budgets do not impose a hard question count, guarantee exact answer durations or promote activity completion into demonstrated understanding.
- [x] Respect existing save/retry behaviour and do not run scheduled or hidden AI jobs when the learner is absent.
- [x] Public-boundary tests use a controllable clock and controlled provider responses to verify pacing context, near-expiry offers, return after expiry, explicit difficulty precedence, persisted resumption and unrestricted continuation without long real waits.

## Verification and manual acceptance

- Apply migrations 009 and 010 with `bash scripts/migrate.sh`; no reset required.
- Docker `bash scripts/local.sh check`: typecheck/lint passed. Docker `bash scripts/local.sh test`: production build and full 43-test public-boundary suite passed. Controlled-clock scenarios cover near-end/expired pacing, editable answers, explicit continuation/renewal, unchanged windows on resume/replay, difficulty precedence, persistence and no idle generation.
- Automated tests use controlled question/recap responses and a test-only clock, not live charged provider calls. No deployment performed.
- Manual acceptance: request an assessment on an approved topic with explicit difficulty and a short time budget; answer, request assistance, skip, switch threads/reload and resume. Inspect optional recap qualifications. After the original window expires, check the acknowledgement, keep an answer editable, continue beyond the old budget, then set a new budget. The composer and ordinary chat must remain usable throughout.
- Model topic interpretation, free-form action classification, teaching quality and duration estimates still need real-model judgement; no exact-duration or calibrated-ability claim.
- Left on the requested combined feature branch; not merged into `main`.
