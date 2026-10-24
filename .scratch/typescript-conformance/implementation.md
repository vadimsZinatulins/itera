# TypeScript conformance implementation

Integration branch: `feat/typescript-conformance`, based on local `main` at `fb09920`.

## Approved dependencies

The user explicitly approved direct additions of `zod`, `react-hook-form`, `@hookform/resolvers`, and `dayjs` in this implementation conversation. Verify compatible versions against official documentation before Docker-only installation. No other additions are approved.

## Execution

Follow the issue blocking graph in `issues/`. Each ticket has an isolated implementer branch/worktree based on the current integration tip, TDD at the approved public boundary, Docker validation, and a separate merger handoff. No push or PR is required by the local Markdown tracker. Full integration review follows ticket completion. Merge to `main` only after relevant gates pass.

## Lane board

| Lane | Contract / ownership | Isolation | Gate / handoff | Classification |
| --- | --- | --- | --- | --- |
| 02 | Subject creation: `components/subject-picker*`, `lib/subjects/`, `app/api/subjects/route.ts`, Subject suites; sole dependency-manifest owner for this completed lane | `.local/worktrees/typescript-02`, `feat/typescript-conformance-02` (retained) | Resolved: reviewed candidate `596ea41` integrated via merge `e2d06a3`; review OK/no findings; Docker typecheck/lint/build and 10 public tests inherited, not rerun; gate remains with 07 | Single creation seam; browser/server validation and form ownership are coupled. |
| 03 | Request/resend sign-in code; newly unblocked by 02 | Unassigned | Ready for assignment; no Docker gate granted | Preserve verification during partial login migration. |
| 05 | Replace/remove OpenAI key; newly unblocked by 02 | Unassigned | Ready for assignment; no Docker gate granted | Preserve write-only credential handling and recovery. |
| 07 | Document reads and mechanical workspace ownership: `components/learning-documents*`, `lib/documents/`, GET documents route, document suites | `.local/worktrees/typescript-07`, `feat/typescript-conformance-07` | Active Docker gate owner; preserve editing/save/approval | Single read/workspace seam; no editor form migration. |
| 10 | Conversation reads/transcript: `components/conversations*`, `lib/conversations/`, GET conversations route, conversation suites | `.local/worktrees/typescript-10`, `feat/typescript-conformance-10` | Queued after 07 at test-only checkpoint `16ec804`; preserve composer/stream behavior | Single history seam; recap implementation excluded. |
| 15 | Recap/understanding reads: `components/practice-recaps*`, `lib/recaps/`, GET recaps route, recap suites | `.local/worktrees/typescript-15`, `feat/typescript-conformance-15` | Queued after 10 at test-only checkpoint `2a8b191`; preserve generation/review | Single recap read seam; mutations behavior-frozen. |
| 01 | Settings read operation, validated status and safe outcomes; only shared infrastructure exercised by this consumer | `/Users/vadimszinatulins/Documents/itera/.local/worktrees/typescript-01`, `feat/typescript-conformance-01` (retained for parent cleanup) | Integrated: fast-forward `d8ed531d063cc2a0fafb32795018f7a0067f9851`; independent review OK/no issues; Docker typecheck, lint, build and 10 public-boundary tests passed in candidate handoff | Single vertical seam: schemas, Result and diagnostics are coupled to the settings read consumer; splitting creates artificial handoffs. Exclude settings mutations and unrelated callers. |

Ticket 01 is resolved and integrated into `feat/typescript-conformance` from clean target `53f67e57899a1ac40a5b2aaa2449c26e2c846a9e`. Review and test evidence are recorded in [ticket 01](issues/01-read-ai-settings.md). Merger did not rerun unchanged candidate validation. Full unrelated application suite, deployed real-provider release walkthrough and dedicated misconfigured-deployment browser coverage remain unrun; existing transitive `body-parser` advisory remains.

Ticket 02 is resolved: clean reviewed candidate `596ea41fbba531ea6617f0470d31e7966a8653f3` merged without conflicts into clean target `cc51d8c04d84b097cc139882fbffbb559dfa43f1` via `e2d06a36bcea259ffc02bb03f6c6b90dcf2f283e`. Target-only advancement since common base `4686dc5` was confined to this board. Source, manifests and tests exactly match the reviewed candidate. See [ticket 02](issues/02-create-subject.md) for review, inherited Docker evidence and residual risks; merger ran Git-only checks, not Docker gates.

Frontier: **03 / 05 newly unblocked; 07 active; 10 / 15 queued**. Source ownership remains exclusive for assigned lanes; 03 and 05 are unassigned. Existing lane worktrees retain their checkpoints; no rebases or cleanup performed. Shared `lib/types/result.ts`, auth, primitives, prototypes, framework composition and harness files stay read-only; request any necessary shared edit. Preserve extensionless component exports. Ticket 10 changes its moved recap import to `@/components/practice-recaps`; ticket 15 retains props unchanged. Ticket 02's approved dependency changes are integrated; no new dependency-manifest ownership is assigned here.

Docker tooling gate is globally serial: harness tags, fixed Supabase ports and check volumes are shared across worktrees. Current Docker/Node gate owner: **07**, transferred after ticket 02 candidate handoff. Ticket 02 review and integration are complete; merger inherited its unchanged candidate validation and did not use the gate. Tickets 10 and 15 are parked at committed test-only checkpoints (`16ec804` and `2a8b191`), not complete. Remaining gate queue: **10 → 15**. Other lanes must receive permission before any Docker build/install/check/test, and must see failing behavior before implementation. No polling or concurrent harness runs. Parent transfers gate ownership explicitly. Merger owns integration tracker/lane changes; workers update only their own ticket evidence, not this board.

Next lowest-numbered unblocked ticket: **03**, with **05** also newly unblocked. Only ticket 02 status changed; 07 remains active and 10/15 remain queued. The full spec and final integration/release gates remain incomplete. Blockers and exact unrun gates must be retained in handoffs; no ticket is complete merely because code is written.
