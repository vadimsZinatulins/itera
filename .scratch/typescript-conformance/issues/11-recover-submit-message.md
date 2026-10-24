# 11: Recover and submit an unsent message

**What to build:** The learner's unsent message survives the existing supported interruptions and submits with a stable identity, without duplicate sends or automatic charged retries.

**Blocked by:** 02 — Create a Subject with validated form ownership; 10 — Load and resume a conversation trail.

Status: blocked — test-only checkpoint prepared; awaiting explicit Docker/Node gate transfer and observed RED

- [ ] Migrate composer field ownership to RHF/Zod while keeping independent view state outside the form. Recovery snapshots synchronize externally without becoming a second authoritative field store.
- [ ] Validate local-storage data from unknown and model corrupt, absent or unavailable storage as explicit supported outcomes; preserve mode/text/operation relationships and account/Subject scope.
- [ ] Validate submission at the server boundary, consuming parsed values while retaining the bounded reader, byte limits, field policy, UUID/revision rules and auth checks.
- [ ] Use shared expected-failure outcomes for recovery/send preparation. Preserve operation identity across explicit retry, saved-message reconciliation, unsent text and visible sending/saved/failed feedback; existing streaming continues working.
- [ ] Preserve logout cleanup and no implicit retry. Do not add deletion functionality to activate an unwired cleanup seam; remove obsolete code only after reference/planning checks.
- [ ] Public chat-recovery/conversation/limit tests cover corrupted storage, storage access failure, interruption, duplicate prevention, malformed submission and retained input.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration. Apply owner-local types/helpers/events and touched-code readability rules.

## Context

Parent: [conformance spec](../spec.md). Provider stream/finalization migration is separate; this slice must land with current generation behavior green.

## Comments

### Durable test-only checkpoint

- Confirmed initially clean worktree/index on `feat/typescript-conformance-11`, exact HEAD `c92f58e7999b8a2c24a21485010672868ecbaeaa`. Target `feat/typescript-conformance` and common base both equal that exact hash at preparation. No production edits, integration/main edits, pushes or dependency additions.
- Read spec, implementation/lane board, this ticket, resolved 10 evidence, TDD skill + tests/mocking guidance, TypeScript skill, issue-tracker/domain instructions, glossary, accepted ADR-0001 and production interruption-recovery decisions. Read installed Next **16.4.2** Playwright, Route Handlers and forms guides from `/Users/vadimszinatulins/Documents/itera/node_modules/next/dist/docs/` (this isolated worktree has no `node_modules`). Inspection only; no installation or execution.
- New isolated suite: `tests/composer-recovery.spec.ts`, one public browser/API test: **a corrupt pending operation cannot lock device recovery into an invalid same-send retry**. Uses real provisioned account/email OTP, application Subject/settings endpoints, real persistence and existing controlled OpenAI reset/call observation. Only fault injection is a malformed operation UUID in the account/Subject `new` localStorage slot. No internal imports/mocks, production test API, harness or fixture edits.
- Observable contract: after reload and explicit new-thread restoration, the invalid pending identity must not lock the composer or expose same-send retry; no automatic conversation POST, saved thread or provider generation. The learner can then explicitly send corrected input, producing one complete persisted message with valid UUID identity and exactly one generation. Does not prescribe whether independently valid text is salvaged from a corrupt snapshot.
- **Predicted RED, NOT observed:** `lib/chat-recovery.ts:12` accepts any string operation ID, including `not-a-uuid`; `components/conversations/index.tsx:51-58` restores it as pending, and `:335-336` disables the text field and offers Retry same send. Expected first behavioral failure: `await expect(composer).toBeEditable()` after restoration. A new-thread click ensures restoration has occurred rather than accidentally checking the pre-hydration empty field. No test has been executed and no RED/GREEN result is claimed.
- Prepared first command, **not run**: `bash scripts/local.sh test tests/composer-recovery.spec.ts`. Run only after explicit parent gate transfer, confirm a meaningful behavioral RED before any production implementation; do not treat auth/setup/build failure as RED.
- **BLOCKED:** 15 owns the exclusive Docker/Node/shared-harness gate; remaining queue **03 → 05 → 08 → 11**. No polling or repeated gate requests. Parent resumes this same lane after explicit transfer; checkpoint is not ticket completion or integration approval.

### Resume constraints / unrun gates

- Future production ownership only: composer field/form/send-preparation state within `components/conversations/`, `lib/chat-recovery.ts`, POST submission validation and owner-local contracts. Ticket 10 history/read/transcript prefactor is already integrated; do not redo it. Ticket 12 provider stream/finalization behavior remains frozen. Shared Result/auth, harness/fixtures, manifests, generated primitives, assessments, other tickets and the shared lane board remain read-only without new authorization.
- Preserve account/Subject/thread/new-slot isolation, logout cleanup, supported mode/text/operation relations, valid UUID/revision rules, stable identity across uncertain sends and explicit retries, retained unsent text and saved-message reconciliation. Recovery snapshots synchronize externally and must not compete with RHF field ownership. Do not invent deletion features to activate the unwired cleanup seam.
- Preserve bounded POST reader, 12,000-byte envelope / 8,000-byte UTF-8 text limits, established field policy, server auth/ownership and SQL protections. Preserve sending/saved/failed feedback, saved partial/incomplete replies, explicit charge warnings and no automatic generation retry.
- All runtime gates unrun by instruction: focused RED above; subsequent GREEN; `bash scripts/local.sh check`; `docker build --target production -t itera-owner-production .`; affected public regressions. Prepared core regression command: `bash scripts/local.sh test tests/composer-recovery.spec.ts tests/chat-recovery.spec.ts tests/conversations.spec.ts tests/conversation-limits.spec.ts tests/conversation-trail.spec.ts tests/conversation-reads.spec.ts tests/approved-practice.spec.ts tests/adaptive-assessments.spec.ts tests/outage.spec.ts`. Expand only as actual changes require. Full unrelated suite, independent review, integration and deployed real-provider release walkthrough remain outstanding.
- Static-only evidence: scoped Git branch/hash/status/ancestry and whitespace checks. Commit uses command-scoped `safe.directory` and disabled hooks to avoid accidental host Node execution; no staged files are to remain after checkpoint commit. Exact checkpoint hash is recorded in the external handoff artifact, not self-referentially in this commit.
- Residual risks: test syntax/type/lint/runtime and setup remain unverified; current predicted bug remains in unchanged production; one tracer does not cover all corrupt shapes/storage access failures. Existing recovery/conversation/privacy/assessment regressions are preservation obligations, not inherited proof for future 11 changes. No completion boxes are checked.
