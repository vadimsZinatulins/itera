# 15: Load Subject understanding and pending recaps

**What to build:** The learner reads reviewed Subject understanding and pending Practice recaps through validated contracts, with clear empty and unavailable states.

**Blocked by:** 01 — Read AI settings through validated outcomes.

Status: ready-for-agent

- [ ] Prefactor recap/observation read ownership before generation and mutation migrations. Place explicit representations, response schemas and helpers with their narrowest owners; retain client-safe contracts.
- [ ] Validate read payloads at relevant boundaries and consume parsed values. Type established persistence invariants without duplicating checks throughout consumers.
- [ ] Use shared Result outcomes and safe public mapping for expected read failures; unexpected defects receive only sanitized reporting.
- [ ] Preserve account/Subject scoping, proposal status, coverage/provenance, deleted-source indicators and the distinction between tentative conversation context and reviewed observations.
- [ ] Keep accessible loading, empty and failure states; do not turn failed loads into fabricated empty success. Existing generation and review flows remain functional during migration.
- [ ] Public reviewed-recap/privacy/outage scenarios cover valid and malformed reads, empty state, inaccessible content and retained reviewed observations.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration. Apply readable control flow and preserve official primitives.

## Context

Parent: [conformance spec](../spec.md). No new understanding workspace, map behavior or deletion policy is introduced.
