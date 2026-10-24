# TypeScript conformance implementation

Integration branch: `feat/typescript-conformance`, based on local `main` at `fb09920`.

## Approved dependencies

The user explicitly approved direct additions of `zod`, `react-hook-form`, `@hookform/resolvers`, and `dayjs` in this implementation conversation. Verify compatible versions against official documentation before Docker-only installation. No other additions are approved.

## Execution

Follow the issue blocking graph in `issues/`. Each ticket has an isolated implementer branch/worktree based on the current integration tip, TDD at the approved public boundary, Docker validation, and a separate merger handoff. No push or PR is required by the local Markdown tracker. Full integration review follows ticket completion. Merge to `main` only after relevant gates pass.

## Lane board

| Lane | Contract / ownership | Isolation | Gate / handoff | Classification |
| --- | --- | --- | --- | --- |
| 02 | Subject creation: `components/subject-picker*`, `lib/subjects/`, `app/api/subjects/route.ts`, Subject suites; sole dependency-manifest owner | `.local/worktrees/typescript-02`, `feat/typescript-conformance-02` | Candidate `596ea41` ready for independent review; Docker typecheck/lint/build and 10 public tests passed; gate released | Single creation seam; browser/server validation and form ownership are coupled. |
| 07 | Document reads and mechanical workspace ownership: `components/learning-documents*`, `lib/documents/`, GET documents route, document suites | `.local/worktrees/typescript-07`, `feat/typescript-conformance-07` | Prepare RED tests, request Docker gate; preserve editing/save/approval | Single read/workspace seam; no editor form migration. |
| 10 | Conversation reads/transcript: `components/conversations*`, `lib/conversations/`, GET conversations route, conversation suites | `.local/worktrees/typescript-10`, `feat/typescript-conformance-10` | Prepare RED tests, request Docker gate; preserve composer/stream behavior | Single history seam; recap implementation excluded. |
| 15 | Recap/understanding reads: `components/practice-recaps*`, `lib/recaps/`, GET recaps route, recap suites | `.local/worktrees/typescript-15`, `feat/typescript-conformance-15` | Prepare RED tests, request Docker gate; preserve generation/review | Single recap read seam; mutations behavior-frozen. |
| 01 | Settings read operation, validated status and safe outcomes; only shared infrastructure exercised by this consumer | `/Users/vadimszinatulins/Documents/itera/.local/worktrees/typescript-01`, `feat/typescript-conformance-01` (retained for parent cleanup) | Integrated: fast-forward `d8ed531d063cc2a0fafb32795018f7a0067f9851`; independent review OK/no issues; Docker typecheck, lint, build and 10 public-boundary tests passed in candidate handoff | Single vertical seam: schemas, Result and diagnostics are coupled to the settings read consumer; splitting creates artificial handoffs. Exclude settings mutations and unrelated callers. |

Ticket 01 is resolved and integrated into `feat/typescript-conformance` from clean target `53f67e57899a1ac40a5b2aaa2449c26e2c846a9e`. Review and test evidence are recorded in [ticket 01](issues/01-read-ai-settings.md). Merger did not rerun unchanged candidate validation. Full unrelated application suite, deployed real-provider release walkthrough and dedicated misconfigured-deployment browser coverage remain unrun; existing transitive `body-parser` advisory remains.

Active frontier: **02 / 07 / 10 / 15**. Source ownership is exclusive as above. All are based on the same integrated tip. Shared `lib/types/result.ts`, auth, primitives, prototypes, framework composition and harness files stay read-only; request any necessary shared edit. Preserve extensionless component exports. Ticket 10 changes its moved recap import to `@/components/practice-recaps`; ticket 15 retains props unchanged. Only ticket 02 owns dependency manifests.

Docker tooling gate is globally serial: harness tags, fixed Supabase ports and check volumes are shared across worktrees. Current Docker/Node gate owner: **07**, transferred after ticket 02 candidate handoff. Ticket 02 is under independent read-only review. Tickets 10 and 15 are parked at committed test-only checkpoints (`16ec804` and `2a8b191`), not complete. Remaining gate queue: **10 → 15**. Other lanes must receive permission before any Docker build/install/check/test, and must see failing behavior before implementation. No polling or concurrent harness runs. Parent transfers gate ownership explicitly. Merger owns integration tracker/lane changes; workers update only their own ticket evidence, not this board.

Next lowest-numbered ticket: **02**. No other ticket status changed. The full spec and final integration/release gates remain incomplete. Blockers and exact unrun gates must be retained in handoffs; no ticket is complete merely because code is written.
