# 10: Load and resume a conversation trail

**What to build:** The learner loads and resumes saved conversations through validated history contracts and a clearly owned transcript, including honest incomplete-reply states.

**Blocked by:** 01 — Read AI settings through validated outcomes.

Status: blocked — prepared RED checkpoint; awaiting exclusive Docker gate

- [ ] Prefactor transcript ownership before composer/generation migration; organize associated CSS, explicit types, helpers and owned subcomponents while preserving working sends.
- [ ] Validate history/read responses at relevant boundaries and consume parsed output. Establish typed persistence contracts without repeatedly revalidating trusted downstream records.
- [ ] Use shared Result/public-error mapping for expected read failures and sanitized reporting for unexpected defects; preserve public HTTP behavior and account/Subject scoping.
- [ ] Preserve selected thread, saved partial replies, resumability, scroll behavior and visible loading/empty/failure states. Keep legitimate synchronization effects and unsent drafts intact.
- [ ] Public conversation/privacy/outage tests cover history, resume, malformed response, incomplete replies and unavailable data without silently treating failure as an empty successful trail.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration; server-only imports must remain outside client-safe representations.

## Checkpoint evidence

- Start verified: `4686dc5925fabeedbc14f96c02974da64a95de7a`, branch `feat/typescript-conformance-10`, clean worktree before edits.
- Added `tests/conversation-trail.spec.ts`: public browser transport malformed-trail rejection and honest unavailable display; recovery through real local authenticated saved incomplete history. No production edits.
- RED pending, not executed: `bash scripts/local.sh test tests/conversation-trail.spec.ts`. Expected first failure: malformed numeric thread title is accepted instead of displaying `Could not load your trail. Try reloading.`
- Supervisor gate decision: ticket 02 retains exclusive Docker gate; queue 07 → 10 → 15. Stop at durable test-only checkpoint; resume only on explicit authorization. No Docker/Node executed, no RED/GREEN or runtime conformance claim.
- Remaining: execute meaningful RED before production changes; migrate read contracts/ownership; add incremental selected-history malformed/unavailable coverage and refresh/duplicate read-path coverage; preserve all mutation behavior. Docker typecheck/lint/build plus conversation, chat-recovery, limits, approved-practice, adaptive-assessment and outage regressions remain unrun. Merge latest integration, validate and commit final candidate only after authorization/implementation.

## Context

Parent: [conformance spec](../spec.md). No new conversation lifecycle or deletion behavior; later slices migrate composer and streaming separately.
