# 01: Read AI settings through validated outcomes

**What to build:** The learner can load AI settings through validated contracts and explicit failure outcomes, without exposing their stored key. Establish shared patterns with this working consumer rather than creating unused infrastructure.

**Blocked by:** None (can start immediately).

Status: resolved
Implementation: reviewed and integrated into `feat/typescript-conformance` via fast-forward of `d8ed531d063cc2a0fafb32795018f7a0067f9851`.

- [x] Obtain explicit approval for direct Zod adoption before installing it; select compatible versions using official documentation. This ticket's approval is not dependency approval.
- [x] Validate settings status at its relevant boundaries and consume parsed output; establish configuration validation for the settings integration where needed. Preserve presence/model-only responses and existing HTTP behavior.
- [x] Introduce one shared readonly error-first Result type and recovery-oriented public error mapping, consumed by the settings read operation. Keep native integration results internal and pure functions ordinary.
- [x] Explicitly serialize only safe public fields. Establish minimal sanitized reporting of unexpected failures without logging credentials, private content or raw upstream error objects; no new reporting service.
- [x] Organize touched settings code, explicit types and helpers under their narrowest owners; preserve server-only boundaries and framework filenames. Use multiline braced control flow.
- [x] Extend existing public settings/privacy/outage tests for valid, malformed and unavailable status responses; verify no key or diagnostic leakage.
- [x] Relevant typecheck, lint, build and public-boundary tests pass inside Docker before integration. Follow the feature-branch workflow; report blockers and unrun checks accurately.

## Context

Parent: [conformance spec](../spec.md). This establishes patterns reused by later slices; unrelated callers remain working. All Node tooling runs only in Docker. Product behavior, credential policy and provider choice are unchanged.

## Implementation evidence

- Branch started exactly at integration `53f67e57899a1ac40a5b2aaa2449c26e2c846a9e`, clean before test edits. No mutation or unrelated caller migration.
- User dependency approval recorded in `../implementation.md`. Added only direct `zod@4.6.7` (already locked transitively). Official [requirements](https://zod.dev/) support TypeScript 5.5+ and require strict mode; installed TypeScript 5.9.3 and `strict: true` meet these. Consulted official [API](https://zod.dev/api), [basics](https://zod.dev/basics), and installed Next 16.4.2 route/client/server/redirect/rethrow guides before implementation. No resolver, form or date dependency needed here.
- Settings read now validates real RPC rows and service-client configuration, consumes parsed output, returns shared readonly Result, and explicitly serializes presence/model only. Page and GET handle reauthentication/retry. Native RPC results remain inside the integration. Diagnostics contain only fixed operation/stage/kind metadata.
- Public harness still uses real local authentication and persistence. Only the outgoing RPC response is corrupted after a real read; stderr is observed by the test-only transport. Added seven malformed status variants, safe-extra-field handling, RPC failure diagnostics, Auth/Data outage recovery, no-provider-call assertions and privacy checks.
- TDD RED: `bash scripts/local.sh test tests/openai-settings.spec.ts --grep 'malformed stored settings'` observed HTTP 200 instead of required 503. GREEN after validated read: 1 passed. Initial green attempt exposed an incorrect test copy expectation; corrected it to the existing `Account service unavailable` heading, without changing UI copy.
- Second RED: `bash scripts/local.sh test tests/openai-settings.spec.ts --grep 'settings persistence failures'` observed no operational report. GREEN after fixed-metadata RPC failure reporting: final affected suite includes this test.
- Final Docker checks: `bash scripts/local.sh check` passed (`next typegen && tsc --noEmit`, ESLint). `bash scripts/local.sh test tests/openai-settings.spec.ts tests/outage.spec.ts tests/policies.spec.ts` built optimized Next production and standalone/test images; **10 passed (42.3s)**. `git diff --check` passed.
- Resolved infrastructure blocker: original `/tmp` worktree was not Docker-daemon shared; supervisor relocated it to `/Users/vadimszinatulins/Documents/itera/.local/worktrees/typescript-01` and restored `/tmp` as a symlink. First launch failed before tests with `MODULE_NOT_FOUND` for `scripts/local-env.mjs`; no false RED claim. All subsequent runs use canonical shared path. An intermediate lint failure from CommonJS `require` was fixed using Node 24's documented `process.getBuiltinModule`.
- Residual: npm audit reports one high-severity transitive `body-parser` advisory; no unrelated dependency remediation. Full application suite and deployed real-provider release walkthrough not run for this read-only ticket. Invalid/missing service configuration has runtime validation but no dedicated misconfigured-deployment browser test. Retained failed-run diagnostics stay ignored/private under `.local`; no test containers left running.

## Comments

- Completion: ticket 01 only is resolved. Independent review approved exact candidate `d8ed531d063cc2a0fafb32795018f7a0067f9851` with **no issues found; merge verdict OK**. Review: `.picastle/agent/sessions/--Users-vadimszinatulins-Documents-itera--/subagent-artifacts/outputs/fc3eb797-7c87-472a-9b9d-eee25065e606/typescript/01-review.md`. Implementation/test handoff: `.picastle/agent/sessions/--Users-vadimszinatulins-Documents-itera--/subagent-artifacts/outputs/4f805d9b-47bb-4285-b519-0198474514d2/typescript/01-handoff.md`.
- Merger verified clean target at `53f67e57899a1ac40a5b2aaa2449c26e2c846a9e` and clean candidate worktree at the reviewed hash, then successfully ran `git merge --ff-only feat/typescript-conformance-01` on `feat/typescript-conformance`. Candidate-range whitespace check passed. Acceptance checklist above is complete; Docker typecheck/lint/build and 10 passing public-boundary tests are inherited from the unchanged reviewed candidate, not rerun by merger.
- Unrun gates remain disclosed above: full unrelated application suite, deployed real-provider release walkthrough, and dedicated misconfigured-deployment browser coverage. Existing transitive advisory remains. This closure does not claim the full conformance spec or final integration/release gates complete. No push, merge to `main`, or worktree cleanup performed.
