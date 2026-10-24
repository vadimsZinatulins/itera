# 07: Read Learning Documents through a validated workspace

**What to build:** The learner lists, opens and previews Learning Documents through a clearer workspace with validated read contracts, while existing editing continues working.

**Blocked by:** 01 — Read AI settings through validated outcomes.

Status: blocked — prepared RED checkpoint; awaiting exclusive Docker gate

- [ ] Prefactor workspace ownership around the working list/open/preview flow before later editor-state migration. Move associated CSS, explicit types, helpers and owned subcomponents into the required component layout without changing routes.
- [ ] Establish runtime read schemas and inferred contracts; validate once at relevant boundaries and consume parsed output. Type trusted records where invariants are established rather than scattering redundant guards.
- [ ] Use shared expected-failure outcomes and safe public error mapping for read operations; retain independent auth and data isolation.
- [ ] Preserve rendered Markdown through the installed library, empty/loading/error states, filtering, selected document, existing editor buffers and browser-history behavior. No competing editor owner or RHF migration yet.
- [ ] Public document/privacy/history tests verify list/open/preview, malformed read responses, outage recovery and account/Subject isolation; existing save/approval flows remain green.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration. Check import case sensitivity and server-only boundaries after moves.

## Execution evidence — prepared RED checkpoint

- Branch `feat/typescript-conformance-07`; verified initial HEAD exactly `4686dc5925fabeedbc14f96c02974da64a95de7a` and clean before edits.
- Added `tests/document-reads.spec.ts`: real local auth and persisted Subject/Draft, corrupt only the browser HTTP read response (`revision` string), require safe unavailable state rather than false empty/list success, then reload real data and preview rendered Markdown.
- RED command prepared, **not run**: `bash scripts/local.sh test tests/document-reads.spec.ts`. Ticket02 owns global Docker gate; supervisor requires test-only checkpoint and paused execution. No Node/Docker commands or production edits performed.
- Remaining: execute meaningful RED with gate permission; implement schemas/Result and workspace ownership; additional malformed refresh/outage coverage; Docker GREEN/typecheck/lint/build plus document editor/history/privacy and Practice approval/large-document/privacy regressions. Merge latest integration before final candidate validation/commit. This checkpoint is not an implementation completion.

## Context

Parent: [conformance spec](../spec.md). Retain Draft versus Practice version terminology and behavior; no schema or data-model redesign.
