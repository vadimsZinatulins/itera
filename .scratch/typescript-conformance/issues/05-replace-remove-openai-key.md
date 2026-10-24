# 05: Replace and remove an OpenAI key safely

**What to build:** The learner replaces or removes their OpenAI key with clear pending and failure states while the credential remains write-only and server-only after submission.

**Blocked by:** 02 — Create a Subject with validated form ownership.

Status: ready-for-agent

- [ ] Migrate key entry to RHF/Zod, validate again at the trusted boundary, consume parsed values and preserve accepted field policies, limits and HTTP behavior.
- [ ] Replace expected mutation throws with shared Result outcomes and safe public mapping. Keep persistence/provider-native results inside integrations and unexpected defects observable through sanitized reporting.
- [ ] Preserve transient key clearing, replace/remove semantics, existing failure recovery and authorization. Never return the stored full key or place it in browser storage, prompts or logs.
- [ ] Removal stops future requests without deleting saved work. Do not redesign the accepted owner-only plaintext exception.
- [ ] Keep types, schemas, operations and form behavior owner-local; preserve server/client boundaries and generated primitives. Model actual exclusive submission states clearly.
- [ ] Public settings/privacy tests cover replace/remove success, malformed submissions, pending/network/persistence failure, key clearing and absence of secrets in responses/diagnostics.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration. Dependencies require their separately recorded approvals.

## Context

Parent: [conformance spec](../spec.md). Model discovery/selection/check migration is a separate slice and must continue working meanwhile.

## Test-only checkpoint — BLOCKED awaiting Docker gate

- Clean start confirmed: `0355be0190d125be9269e18d3afc43ba33da38c2`, branch `feat/typescript-conformance-05`; initial working tree and index empty.
- Prepared one tracer in `tests/openai-credential-mutations.spec.ts`: an authenticated `PUT /api/settings/openai` with JSON `[]` must return 400, expose only a safe error, leave saved credential status/model unchanged and make no additional OpenAI request. Uses existing account provisioning, real browser email-code sign-in, local persistence, public settings reads and existing synthetic OpenAI controls; no internal mocks or harness changes.
- Static RED rationale only: `saveSettings` currently accepts arrays through its object guard. With an existing key, `[]` has no unsupported keys, so the request lists models, rewrites settings and returns 200. The first expected failure is `Expected: 400; Received: 200`. This is an invalid-input/public-effect contract, not a decomposition assertion. RED has **not** been observed.
- Prepared command, **not run**: `bash scripts/local.sh test tests/openai-credential-mutations.spec.ts`. The wrapper runs Node tooling inside Docker. Do not run until the parent explicitly grants the global tooling gate and revalidate the starting source first.
- Gate owner remains 07; queue `10 → 15 → 03 → 05`. No Docker, Node, package-manager, lint, typecheck, build or test command executed for this checkpoint. No polling or additional gate request. Ticket is **not complete**; all acceptance checkboxes remain open.
- Read spec, implementation board, this ticket, TDD/TypeScript skills, domain/tracker instructions, glossary and accepted ADR-0001. Worktree dependencies are absent; read installed Next 16.4.2 route-handler and relevant server/client component guidance from `/Users/vadimszinatulins/Documents/itera/node_modules/next/dist/docs/`, matching the pinned version. Recheck installed library/framework guidance before production edits.
- Future exclusive scope: `components/openai-settings*`, mutation branches of `app/api/settings/openai/route.ts`, narrow owner-local credential contracts under `lib/openai/settings`, and mutation helpers in `lib/openai/server.ts`. Start implementation only after observed RED. Preserve write-only entry clearing, replacement/removal, safe errors, authorization and saved work. Settings reads (01), model discovery/selection/check (06), generation, shared Result/auth/primitives, manifests, fixtures/harness, existing settings suites and other lanes stay read-only. No new dependencies, grants, schema or production fault API are authorized.
- Remaining risks/gates: unexecuted test may need runtime adjustment; the single malformed-root slice does not yet prove RHF ownership, removal, pending/network/persistence recovery or diagnostic redaction. Docker typecheck/lint/build and affected regressions remain unrun. Independent review required before any integration.
