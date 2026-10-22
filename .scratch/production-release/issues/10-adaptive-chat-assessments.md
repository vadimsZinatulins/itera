# 10: Run adaptive assessments inside chat

**What to build:** Let the learner start or continue assessment in the same conversation, answering one question at a time while topic, difficulty and activity length adapt to their request.

**Blocked by:** 09 — Review incremental recaps into Subject understanding.

**Status:** ready-for-human

**Implementation:** `feat/10-11-adaptive-assessment-budgets`, created from `main`. Adaptive assessment implemented first; soft-budget pacing follows in issue 11 on the same branch. Manual acceptance pending.

- [x] Quick assessment is reachable from the existing chat experience and resumes an unfinished activity rather than silently creating another conversation. Support ordinary-language assessment requests as well as the entry action.
- [x] Respect an explicitly requested topic and easy/medium/hard difficulty. When unspecified, AI may choose each question's difficulty and number of questions; do not enforce a hard three-question sequence or a fixed topic list.
- [x] Use current eligible approved Subject material and reviewed uncertainty. Do not assess an empty/unapproved syllabus or use Drafts, Reference notes, other Subjects/accounts or unreviewed judgments of ability.
- [x] Present one question at a time with optional hints/explanations and skip. Record requested assistance with the answer; skipped means not assessed, not failed. Opening a question alone is not evidence.
- [x] Persist activity/question/answer progress across thread switches, reload, logout/login and another session. Use existing per-thread unsent recovery when available; do not add another competing recovery mechanism.
- [x] Offer an inline correctable recap at a meaningful checkpoint. Qualify observations with intended difficulty, uncertainty and hints/scaffolding; assisted answers are not presented as independent performance.
- [x] Easy/medium/hard are AI-estimated task labels, not calibrated ability measurements. Activity progress is not a mastery score; one hard answer does not establish mastery or erase earlier observations.
- [x] Conversation can continue before/after assessment or recap review, with no Finish ceremony. Time-aware pacing is delivered by ticket 11, not a forced timer in this slice.
- [x] Public-boundary tests use controlled question/recap responses and real persisted activity to verify explicit difficulty constraints, variable length, hints/skips, resumption, qualified reviewed observations and account/source isolation. Do not assert exact live-model wording.

## Verification

Docker typecheck/lint and production build passed. Focused adaptive-assessment/conversation suite passed (5 tests); recap regression also exercised during implementation. Controlled provider responses only; no live charged requests or deployment. Apply migration 009 with the Docker migration runner. Final combined full-suite evidence is recorded with issue 11.
