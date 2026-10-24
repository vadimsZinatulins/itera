# 10: Load and resume a conversation trail

**What to build:** The learner loads and resumes saved conversations through validated history contracts and a clearly owned transcript, including honest incomplete-reply states.

**Blocked by:** 01 — Read AI settings through validated outcomes.

Status: ready-for-agent

- [ ] Prefactor transcript ownership before composer/generation migration; organize associated CSS, explicit types, helpers and owned subcomponents while preserving working sends.
- [ ] Validate history/read responses at relevant boundaries and consume parsed output. Establish typed persistence contracts without repeatedly revalidating trusted downstream records.
- [ ] Use shared Result/public-error mapping for expected read failures and sanitized reporting for unexpected defects; preserve public HTTP behavior and account/Subject scoping.
- [ ] Preserve selected thread, saved partial replies, resumability, scroll behavior and visible loading/empty/failure states. Keep legitimate synchronization effects and unsent drafts intact.
- [ ] Public conversation/privacy/outage tests cover history, resume, malformed response, incomplete replies and unavailable data without silently treating failure as an empty successful trail.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration; server-only imports must remain outside client-safe representations.

## Context

Parent: [conformance spec](../spec.md). No new conversation lifecycle or deletion behavior; later slices migrate composer and streaming separately.
