# 08: Create and save a Learning Document Draft

**What to build:** The learner creates and saves a Draft without losing block edits, navigation buffers or proposed text when another device has saved a newer version.

**Blocked by:** 02 — Create a Subject with validated form ownership; 07 — Read Learning Documents through a validated workspace.

Status: ready-for-agent

- [ ] Migrate create/save field ownership to RHF/Zod with no duplicate authoritative field store. Preserve per-Subject session buffers and deliberate saved-versus-edited snapshots.
- [ ] Validate nested block submissions at the trusted boundary, consume parsed output and return shared expected-failure outcomes. Preserve field policy, unique block IDs, revision rules, Unicode/byte limits and independent SQL validation.
- [ ] Preserve local block save/cancel, rendered-first editing, IME-safe submission, unsaved-work guards, Back/Forward behavior and visible pending/errors.
- [ ] Stale or failed saves retain proposed text and do not overwrite newer persisted work. Saving never implicitly approves a Practice version.
- [ ] Keep schema/types, events, operations and owned editor subcomponents local; separate validation/persistence phases with multiline control flow without changing order.
- [ ] Public editor/history/save/privacy/large-document tests cover successful creation/save, malformed blocks, exact boundaries, IME, navigation, outages and stale-write recovery; approval remains functional.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration; no unapproved dependencies or schema redesign.

## Test-only checkpoint — BLOCKED awaiting explicit tooling gate

- Preparation only on `feat/typescript-conformance-08`, verified initially clean at `cb89696751312fd9eaa36d67924d8f0b83643eef` (also the integration tip at inspection). No production implementation or observed RED; acceptance checkboxes remain open. Ticket 07 read prefactor is integrated and not repeated.
- Approved seam: running browser Draft submission plus public `/api/documents` POST/GET, with existing real local OTP/account provisioning and Supabase persistence. One tracer test in new isolated `tests/document-submission.spec.ts`: a 301-codepoint title must be corrected locally with visible/accessibly marked invalid state and focus, retaining description/local block content; the corrected 300-codepoint astral-Unicode title saves once, survives reload, and has no Practice version. Request observation does not mock submission; persisted results are checked through public GET, not direct database inspection.
- Prepared command (NOT RUN): `bash scripts/local.sh test tests/document-submission.spec.ts --grep 'Draft title correction'`. Predicted RED, not observed: current workspace sends the invalid title to POST/SQL and displays the SQL-limit error, but has no local field validation, `aria-invalid` or correction focus. The first expected failing assertion is title `aria-invalid="true"`; zero invalid POSTs and correction focus are also currently unmet. Do not implement until an authorized run observes a meaningful RED.
- Inspected coupled ownership: `components/learning-documents/index.tsx` retains per-Subject session snapshots; `components/learning-documents/components/document-workspace/index.tsx` owns Draft/saved/open-block buffers and save submission; `app/api/documents/route.ts` POST currently checks the envelope, then delegates nested validation to `save_learning_document`. SQL independently enforces title/description codepoints, block shape/unique IDs, count/UTF-8 limits and compare-and-swap revisions. Preserve blank Draft titles, existing extra-field policy and SQL checks; approval substantive-content rules must not leak into Draft saving.
- Future implementation is limited to the editor subtree, POST submission and owner-local contracts. Keep GET/read APIs from 07, shared boundaries and approval behavior frozen; 09 remains separate. Main risk: replacing field ownership must not collapse intentional saved-versus-edited snapshots, per-Subject buffers/history, local block save/cancel/IME rules or stale attempted text. The first tracer is not coverage of all those invariants.
- Read spec, lane board, ticket 07 evidence, domain guide/glossary/accepted ADR, TDD skill plus tests/mocking guidance and TypeScript skill. Worktree has no installed `node_modules`; read relevant installed Next 16.4.2 route-handler/reference guides from `/Users/vadimszinatulins/Documents/itera/node_modules/next/dist/docs/` without invoking tooling. No dependency additions or changes.
- Gate owner remains 10; queue **15 → 03 → 05 → 08**. No Docker, Node, application checks, builds or tests executed; Git-only whitespace/scope/cleanliness checks are permitted checkpoint validation. Required future gates: observed RED; incremental GREEN/implementation; Docker typecheck/lint/build and affected document editor/history/save/privacy/large-document/Practice approval/outage regressions; independent review and authorized integration. Full conformance/release gates and deployed real-provider walkthrough remain unrun. Only this ticket and the new test changed; shared board/harness/auth/fixtures/manifests/primitives/prototypes/other lanes stayed read-only. Checkpoint is not ticket completion or integration permission.

## Context

Parent: [conformance spec](../spec.md). Do not combine this form migration with new offline editing, automatic merge or a document data-model rewrite.
