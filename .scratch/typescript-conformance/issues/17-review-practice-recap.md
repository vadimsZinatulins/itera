# 17: Accept, correct or dismiss a Practice recap

**What to build:** The learner reviews a recap, retains proposed corrections after a conflict and controls which observations contribute to Subject understanding.

**Blocked by:** 02 — Create a Subject with validated form ownership; 15 — Load Subject understanding and pending recaps.

Status: ready-for-agent

- [ ] Migrate recap correction field ownership to RHF/Zod without duplicate field-state mirrors. Simple accept/dismiss action buttons need no artificial form infrastructure.
- [ ] Validate correction/review submissions at the trusted boundary and consume parsed output; preserve field/byte constraints and independent SQL/RPC validation.
- [ ] Use shared expected-failure outcomes for review mutations and safe public mapping, preserving current public contracts and account/Subject authorization.
- [ ] Preserve accept/correct/dismiss semantics and reviewed-only contributions to future practice. Ignored proposals do not block conversation; no automatic approval or overwrite of earlier reviewed observations.
- [ ] Stale review and persistence failure retain proposed text, explain recovery and never restore deliberately removed observations or silently merge concurrent understanding changes.
- [ ] Organize review types, schemas, events and actions locally; preserve accessible pending/validation/failure states, generated primitives and sanitized diagnostics.
- [ ] Public recap/privacy/conflict scenarios verify accept, correction, dismissal, wrong types, byte limits, stale revisions and input retention. Test through existing proposal production; ticket 16 is not a prerequisite.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration.

## Context

Parent: [conformance spec](../spec.md). No new recap policy, understanding reset workflow or deletion semantics are introduced.
