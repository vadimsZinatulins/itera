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

## Context

Parent: [conformance spec](../spec.md). Do not combine this form migration with new offline editing, automatic merge or a document data-model rewrite.
