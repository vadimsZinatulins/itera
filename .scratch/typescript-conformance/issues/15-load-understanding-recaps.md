# 15: Load Subject understanding and pending recaps

**What to build:** The learner reads reviewed Subject understanding and pending Practice recaps through validated contracts, with clear empty and unavailable states.

**Blocked by:** 01 — Read AI settings through validated outcomes.

Status: blocked — prepared RED checkpoint; awaiting globally serialized Docker gate

- [ ] Prefactor recap/observation read ownership before generation and mutation migrations. Place explicit representations, response schemas and helpers with their narrowest owners; retain client-safe contracts.
- [ ] Validate read payloads at relevant boundaries and consume parsed values. Type established persistence invariants without duplicating checks throughout consumers.
- [ ] Use shared Result outcomes and safe public mapping for expected read failures; unexpected defects receive only sanitized reporting.
- [ ] Preserve account/Subject scoping, proposal status, coverage/provenance, deleted-source indicators and the distinction between tentative conversation context and reviewed observations.
- [ ] Keep accessible loading, empty and failure states; do not turn failed loads into fabricated empty success. Existing generation and review flows remain functional during migration.
- [ ] Public reviewed-recap/privacy/outage scenarios cover valid and malformed reads, empty state, inaccessible content and retained reviewed observations.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration. Apply readable control flow and preserve official primitives.

## Context

Parent: [conformance spec](../spec.md). No new understanding workspace, map behavior or deletion policy is introduced.

## Execution evidence — prepared checkpoint

- Branch `feat/typescript-conformance-15` started clean at required integration `4686dc5925fabeedbc14f96c02974da64a95de7a`.
- Added `tests/recap-reads.spec.ts`: public browser malformed-read scenario with real local authentication and persisted Subject/conversation, controlled provider effects and browser response interception. Wrong-shaped coverage must produce a safe unavailable status, not fabricated reviewed coverage or an empty observation count.
- Planned first RED command: `bash scripts/local.sh test tests/recap-reads.spec.ts`. **Not run**: ticket02 owns the global Docker gate; parent queued 07 → 10 → 15. No Docker/Node execution or production edits permitted until explicit transfer and meaningful RED.
- Read spec, lane board, assigned ticket, exploration handoff, glossary, managed-pilot ADR, TDD/TypeScript skills and installed Next Route Handler/`use client` guides (root installation; worktree has no `node_modules`).
- Pending after gate: execute RED; preserve full public persisted-row contracts while introducing owner-local read schemas/Result operations and honest loading/unavailable states; add incremental public read/privacy/recovery/provenance coverage; run Docker typecheck/lint/build and recap/approved-practice/adaptive-assessment regressions. Merge latest integration and produce a validated durable production candidate only after those gates. No completion claim.
