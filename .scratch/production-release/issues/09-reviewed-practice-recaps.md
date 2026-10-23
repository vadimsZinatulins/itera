# 09: Review incremental recaps into Subject understanding

**What to build:** Let the learner inspect inline Practice recaps, accept/correct/dismiss them and carry only reviewed interpretations into future practice without ending the conversation.

**Blocked by:** 07 — Practise using approved Subject material.

**Status:** closed — implemented and manually accepted

**Implementation:** `feat/09-reviewed-practice-recaps` (created from `main`). Implemented and manually accepted by the owner. See [reviewed recap workflow and migration notes](../../../docs/conversations.md#reviewed-practice-recaps).

- [x] Offer a recap on explicit request and at meaningful activity checkpoints, not an arbitrary fixed learner-message count. Ignoring a proposal never blocks continued chat.
- [x] Present editable/correctable proposals inline with accept and dismiss actions. Unreviewed or dismissed proposals do not become reviewed understanding or replace earlier accepted observations.
- [x] Persist accepted/corrected observations independently of the transcript, with Subject/account ownership, covered activity, provenance and qualified uncertainty. The learner can see the reviewed outcome before the map slice is available.
- [x] Track the last reviewed coverage checkpoint so later proposals describe new changes instead of repeatedly replacing everything. New discussion after a reviewed recap remains tentative.
- [x] Subsequent practice can use reviewed observations as provisional learning context, while approved Practice versions remain the source of subject material. Do not treat authored content, a bio, unreviewed AI assertions or one answer as mastery.
- [x] Preserve intended difficulty and requested assistance where available; later assessment can supply richer qualification without changing the approval boundary.
- [x] Authorise recap generation/application and check the current understanding revision. Reject stale applications with proposed text preserved; retries cannot duplicate observations. Later reset/removal must be able to invalidate an older proposal.
- [x] Do not retain a secret copy of the full transcript/source document inside reviewed observations. Model provenance so source deletion can be marked without cascading deletion of the observation.
- [x] Public-boundary tests cover accept/correct/dismiss, continued conversation, incremental coverage, persistence, reviewed-only outgoing practice context, stale/replayed applications and foreign-account denial using controlled AI proposals.

## Verification

- Docker `bash scripts/local.sh check`: typecheck + lint passed.
- Docker `bash scripts/local.sh test`: production build + all 39 public-boundary tests passed.
- Automated verification used controlled OpenAI proposals/streams; no live charged calls or deployment performed by the agent.
- The owner confirmed manual testing passed and accepted the implementation. Checkpoint offers depend on semantic model judgement, not a fixed activity count.
- Later reset/removal must bump the Subject-understanding revision and preserve coverage checkpoints (ticket 13). Observation provenance already supports independent transcript/document deletion; deletion controls remain tickets 14–16.
- Integrated into `main` after automated checks and owner acceptance; implementation branch deleted.
