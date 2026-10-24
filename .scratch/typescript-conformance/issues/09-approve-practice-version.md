# 09: Approve a saved Practice version

**What to build:** The learner explicitly approves the complete saved Learning Document for practice, with safe recovery when edits are unsaved or the persisted version has changed.

**Blocked by:** 08 — Create and save a Learning Document Draft.

Status: ready-for-agent

- [ ] Validate approval input at the trusted boundary and consume schema output; use shared Result outcomes for expected approval failures and retain HTTP/RPC contracts.
- [ ] Require saving or discarding outstanding edits before Ready to Practice or Update practice version. Snapshot the complete successfully saved document, not mixed saved/unsaved state.
- [ ] Preserve existing Practice version availability during Draft editing, explicit approval confirmation, pending/failure feedback and stale-version rejection with proposed edits retained.
- [ ] Preserve ownership/RLS checks, source eligibility and SQL protections. No implicit approval on save or new automatic merging.
- [ ] Keep approval types/actions/events and dialog composition under the workspace owner without modifying official primitives. Apply readability and safe diagnostics rules.
- [ ] Public Practice-version/approval-guard/privacy tests cover first approval, update, unsaved blocks, stale saves, service failure and approved-only source selection.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration.

## Context

Parent: [conformance spec](../spec.md). Draft save and Practice approval remain distinct operations and learner decisions.
