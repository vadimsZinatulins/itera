# 13: Advance an assessment through validated progress

**What to build:** The learner continues a resumable assessment whose progress advances only after valid output and successful persistence, with recoverable conflicts and honest assistance context.

**Blocked by:** 12 — Generate and persist an ordinary practice reply.

Status: ready-for-agent

- [ ] Replace unchecked assessment-output assumptions with schema-validated unknown input, retaining semantic validation after structural parsing.
- [ ] Establish the opaque persisted snapshot invariant at its boundary and typed downstream contracts; do not rely on a revision-presence assertion or scatter speculative revalidation.
- [ ] Migrate expected assessment parsing/progress failures to shared Result outcomes and safe public mapping. Keep model output rejection separate from unexpected defects.
- [ ] Preserve difficulty labels, hint/explanation assistance, skips as not-assessed, open-question continuity, adaptive length, pacing and stale-revision rejection.
- [ ] Malformed output, rejected progress commits and interrupted replies do not incorrectly advance progress, overwrite concurrent state or automatically retry charged requests. Retain proposed learner input.
- [ ] Colocate assessment types/schemas and meaningful validation/commit responsibilities, preserving server/client boundaries and readable control flow.
- [ ] Public adaptive-assessment/conversation/recovery tests cover wrong-shaped valid JSON, semantic rejection, conflict, interrupted persistence, assistance and resume; current budget behavior stays green.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration.

## Context

Parent: [conformance spec](../spec.md). Budget date-library migration is the next slice; no fixed question count, scoring engine or new assessment policy.
