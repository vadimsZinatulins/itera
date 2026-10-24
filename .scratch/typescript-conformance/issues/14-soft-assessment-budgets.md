# 14: Preserve soft assessment budgets with shared dates

**What to build:** The learner keeps the same soft, resumable assessment budget while date creation, parsing and timing calculations use a shared supported integration.

**Blocked by:** 13 — Advance an assessment through validated progress.

Status: ready-for-agent

- [ ] Obtain explicit Day.js dependency approval before installation and verify selected-version APIs/plugin requirements using official documentation. No approval is implied by ticket publication.
- [ ] Introduce the shared Day.js integration through budget creation, instant serialization, parsing, comparison/arithmetic and existing timestamp display; preserve unambiguous instant semantics.
- [ ] Keep domain-specific natural-language budget parsing local where appropriate, with validated submissions and explicit outcomes for user-correctable durations.
- [ ] Preserve stable initial rendering, post-mount current-time computation, regular refresh, relevant-input recomputation and timer cleanup. Existing ISO display does not require localized formatting.
- [ ] Expiry remains nonblocking: no automatic answer submission, generation or forced completion. Continuing retains the old window; setting a new budget preserves the unanswered question according to existing behavior.
- [ ] Public adaptive-assessment tests control browser clock and server harness offset and cover near-end, expiry, continuation, reset and resume. Do not label operational stream throttling as a timezone bug.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration. Apply owner-local types and readability rules.

## Context

Parent: [conformance spec](../spec.md). Localized timestamp presentation is out of scope unless separately approved; if added later it requires explicit timezone/hydration tests.
