# 03: Request and resend a sign-in code

**What to build:** The learner requests or resends an email sign-in code through validated form submissions with safe, accessible recovery feedback.

**Blocked by:** 02 — Create a Subject with validated form ownership.

Status: blocked — test-only TDD checkpoint prepared; awaiting explicit Docker gate transfer

- [ ] Migrate email entry to the established RHF/Zod pattern and trusted request/resend input validation; consume normalized output and preserve existing limits and HTTP responses.
- [ ] Use shared explicit application outcomes for expected request failures, retaining native auth-provider results within the integration and sanitized diagnostics for unexpected defects.
- [ ] Preserve account-enumeration resistance, email correction, resend behavior, pending controls, visible notices/errors and focus transitions. Verification remains functional during this partial migration.
- [ ] Prefactor the login owner only as needed before migration; place explicit types and associated handlers/helpers with their owner and keep framework control flow intact.
- [ ] Existing public sign-in/access tests plus malformed-input and controlled-email scenarios verify normalization, request/resend, correction and outages without exposing codes or secrets.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration. Do not introduce new dependencies without approval.

## Context

Parent: [conformance spec](../spec.md). This slice does not require completing verification migration or redesigning authentication.

## Test-only checkpoint evidence

- Clean assigned branch `feat/typescript-conformance-03` started exactly at integration `0355be0190d125be9269e18d3afc43ba33da38c2`; initial `git status --short` was empty. No integration/main edits, push, production edits or dependency changes. Checkpoint is the commit containing this section and `tests/sign-in-request.spec.ts`; its exact hash is recorded in the external `03-checkpoint.md` handoff (or resolve with `git log -1 --format=%H -- tests/sign-in-request.spec.ts`).
- Read spec, shared implementation board (read-only), this ticket, TDD skill and test/mocking guides, TypeScript skill, domain instructions, glossary, accepted ADR-0001, authentication documentation, existing sign-in/recovery/access/expiry/outage tests and read-only fixtures/harness. Read installed Next **16.4.2** route-handler, forms and server/client-component guides from the ancestor checkout's `node_modules/next/dist/docs/`; this worktree has no own `node_modules`. No runtime/package-manager command was used to inspect them.
- Approved seam: browser `/login` and public `/api/auth/request`, followed by unchanged verification and `/api/account`. New isolated suite uses existing real local account provisioning, Supabase persistence/cookies and Mailpit OTP delivery via unchanged fixtures. No internal imports/mocks, synthetic app responses, new harness controls, production fault API, grants or schema changes.
- One focused first test: invalid email retains its value, receives visible announced correction feedback associated with the field, exposes `aria-invalid`, focuses the field and sends no request. Correcting to an uppercase provisioned address produces a normalized request, preserves the enumeration-safe notice and code focus, then signs in through real delivered OTP and public account identity. It asserts behavior, not RHF/Result/file decomposition.
- **Prepared RED, not observed:** `bash scripts/local.sh test tests/sign-in-request.spec.ts`. Expected first failure: `getByRole('alert')` never displays `Enter a valid email address.` after submitting `not-an-email`; current `type="email"` native constraint validation prevents submission but the application renders neither an announced field error nor `aria-invalid`/an associated description. No test was run and no passing/failing runtime result is claimed.
- **BLOCKED, not complete:** lane 07 owns the global Docker/Node gate; queue **10 → 15 → 03 → 05**. No Docker, Node, test, lint, typecheck, build or dependency tooling executed. Git whitespace/scope/clean-index checks only. Wait for parent transfer; do not poll. After transfer, observe meaningful RED before any production implementation; if the test fails only on environment/setup, repair/resolve that before claiming RED.
- Future exclusive production boundary: `app/login/sign-in*`, request/resend branch of `app/api/auth/[operation]/route.ts`, and request-owner-local contracts. Reuse approved RHF/resolver/Zod and shared Result unchanged. Verification remains functional and behavior-frozen until 04; shared auth, fixtures/harness, primitives, dependency manifests, other lanes and shared board remain read-only. Preserve correction/resend, focus, pending controls, notices, enumeration resistance, normalization, origin checks, HTTP status/messages and the current **2048 UTF-16-unit** request limit / **254-character** normalized email limit; do not silently convert to bytes or stricter email semantics.
- Remaining work after observed RED: implement the narrow request form/operation slice, then add sequential public-boundary cases for malformed API input, limits, pending/resend and controlled email/auth failures as needed. Run relevant Docker typecheck/lint/build and affected existing sign-in/access/recovery/expiry/outage suites before review/integration. No other ticket requirements are marked complete by this checkpoint. New test has not been typechecked or executed; full runtime/release evidence remains outstanding.
