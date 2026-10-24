# 11: Recover and submit an unsent message

**What to build:** The learner's unsent message survives the existing supported interruptions and submits with a stable identity, without duplicate sends or automatic charged retries.

**Blocked by:** 02 — Create a Subject with validated form ownership; 10 — Load and resume a conversation trail.

Status: ready-for-agent

- [ ] Migrate composer field ownership to RHF/Zod while keeping independent view state outside the form. Recovery snapshots synchronize externally without becoming a second authoritative field store.
- [ ] Validate local-storage data from unknown and model corrupt, absent or unavailable storage as explicit supported outcomes; preserve mode/text/operation relationships and account/Subject scope.
- [ ] Validate submission at the server boundary, consuming parsed values while retaining the bounded reader, byte limits, field policy, UUID/revision rules and auth checks.
- [ ] Use shared expected-failure outcomes for recovery/send preparation. Preserve operation identity across explicit retry, saved-message reconciliation, unsent text and visible sending/saved/failed feedback; existing streaming continues working.
- [ ] Preserve logout cleanup and no implicit retry. Do not add deletion functionality to activate an unwired cleanup seam; remove obsolete code only after reference/planning checks.
- [ ] Public chat-recovery/conversation/limit tests cover corrupted storage, storage access failure, interruption, duplicate prevention, malformed submission and retained input.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration. Apply owner-local types/helpers/events and touched-code readability rules.

## Context

Parent: [conformance spec](../spec.md). Provider stream/finalization migration is separate; this slice must land with current generation behavior green.
