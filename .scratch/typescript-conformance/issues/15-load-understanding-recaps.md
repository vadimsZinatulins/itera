# 15: Load Subject understanding and pending recaps

**What to build:** The learner reads reviewed Subject understanding and pending Practice recaps through validated contracts, with clear empty and unavailable states.

**Blocked by:** 01 — Read AI settings through validated outcomes.

Status: implemented — Docker gates passed; awaiting independent review and merger

- [x] Prefactor recap/observation read ownership before generation and mutation migrations. Place explicit representations, response schemas and helpers with their narrowest owners; retain client-safe contracts.
- [x] Validate read payloads at relevant boundaries and consume parsed values. Type established persistence invariants without duplicating checks throughout consumers.
- [x] Use shared Result outcomes and safe public mapping for expected read failures; unexpected defects receive only sanitized reporting.
- [x] Preserve account/Subject scoping, proposal status, coverage/provenance, deleted-source indicators and the distinction between tentative conversation context and reviewed observations.
- [x] Keep accessible loading, empty and failure states; do not turn failed loads into fabricated empty success. Existing generation and review flows remain functional during migration.
- [x] Public reviewed-recap/privacy/outage scenarios cover valid and malformed reads, empty state, inaccessible content and retained reviewed observations.
- [x] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration. Apply readable control flow and preserve official primitives.

## Context

Parent: [conformance spec](../spec.md). No new understanding workspace, map behavior or deletion policy is introduced.

## Execution evidence — prepared checkpoint

- Branch `feat/typescript-conformance-15` started clean at required integration `4686dc5925fabeedbc14f96c02974da64a95de7a`.
- Added `tests/recap-reads.spec.ts`: public browser malformed-read scenario with real local authentication and persisted Subject/conversation, controlled provider effects and browser response interception. Wrong-shaped coverage must produce a safe unavailable status, not fabricated reviewed coverage or an empty observation count.
- Planned first RED command: `bash scripts/local.sh test tests/recap-reads.spec.ts`. **Not run**: ticket02 owns the global Docker gate; parent queued 07 → 10 → 15. No Docker/Node execution or production edits permitted until explicit transfer and meaningful RED.
- Read spec, lane board, assigned ticket, exploration handoff, glossary, managed-pilot ADR, TDD/TypeScript skills and installed Next Route Handler/`use client` guides (root installation; worktree has no `node_modules`).
- Pending after gate: execute RED; preserve full public persisted-row contracts while introducing owner-local read schemas/Result operations and honest loading/unavailable states; add incremental public read/privacy/recovery/provenance coverage; run Docker typecheck/lint/build and recap/approved-practice/adaptive-assessment regressions. Merge latest integration and produce a validated durable production candidate only after those gates. No completion claim.

## Resumed implementation / review evidence

- Parent transferred exclusive global Docker gate 10 → 15. Merged `cb89696` before executing the checkpoint RED (merge `2b41e29`), then merged `c92f58e7999b8a2c24a21485010672868ecbaeaa` including independently reviewed conversation lane before touching the parent-approved additive recap harness seam. Final `git merge feat/typescript-conformance` reported already up to date at `c92f58e`.
- Browser RED: `bash scripts/local.sh test tests/recap-reads.spec.ts` failed 1/1: malformed coverage produced no safe unavailable status. After owner-local browser schema/Result loading, the same command passed 1/1. Intermediate reruns included the unchanged failure after unavailable host Python editing utility (no Node fallback) and an ambiguous duplicate status-region assertion; both corrected before GREEN.
- Server RED: `bash scripts/local.sh test tests/recap-persistence-reads.spec.ts` failed 1/1, malformed persisted proposal returned 200 instead of 503. After server read migration, `bash scripts/local.sh test tests/recap-persistence-reads.spec.ts tests/recap-reads.spec.ts tests/reviewed-recaps.spec.ts` passed 3/3.
- Implemented client-safe schema-inferred full-row contracts under `lib/recaps/`; retained all persisted recap/observation fields, nullable proposal/source conversation, coverage, provenance and deleted-source augmentation. Read operations use the existing readonly Result. Safe error serialization preserves 400/401/404/503 and no-store; diagnostics contain only closed stage/kind metadata and framework control flow is rethrown.
- Moved component to stable `components/practice-recaps/index.tsx` with owner-local props/read action. Initial/activity and post-mutation reloads consume parsed values. Loading/unavailable do not fabricate zero coverage or empty reviewed observations; correction buffers, operation identity, abort behavior and generation/review remain behavior-frozen. POST route body is unchanged. No conversations/settings/auth/shared Result/primitives/prototypes/manifests edits.
- Parent authorized only additive `tests/auth-upstream.mjs` recap read controls after real GET/RLS/persistence. Tests reset controls in finally. Existing stderr observer required no change. New suites cover malformed browser/opaque persisted JSON, safe diagnostics, loading/empty/unavailable/recovery, malformed post-review reload without charged replay, full public fields, ownership/scope, Auth/Data outages and Subject-wide reviewed observations.
- Real fixture-only source deletion was explicitly approved but failed with existing service_role table privilege 42501. No grants/SQL/schema changes made. Actual deletion lifecycle remains unverified here; nullable conversation/deleted-source rendering is exercised at the approved browser response seam, and retained Subject-wide observations/coverage are checked against real persistence.
- `bash scripts/local.sh check`: passed Docker `npm ci`, `next typegen && tsc --noEmit`, ESLint. npm reported one existing high-severity dependency advisory; no dependency changes by this lane.
- `bash scripts/local.sh test` first full run: production build passed, 67/68 tests passed; document-history timed out opening Document title. Unchanged isolated `bash scripts/local.sh test tests/document-history.spec.ts` passed 1/1. Final unchanged `bash scripts/local.sh test` passed **68/68 (6.1m)**, including recap/reviewed-recap, approved-practice, adaptive-assessment, outage, integrated document/conversation/Subject suites, auth/settings/privacy/expiry regressions. No unrelated fixes or test weakening.
- Independent review and merger still required; this ticket is not resolved by worker. Real-provider deployed walkthrough remains outside this local gate. Full detailed candidate/hash/clean-tree and explicit gate release are recorded in the worker handoff artifact.
