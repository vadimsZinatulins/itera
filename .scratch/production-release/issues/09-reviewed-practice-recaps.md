# 09: Review incremental recaps into Subject understanding

**What to build:** Let the learner inspect inline Practice recaps, accept/correct/dismiss them and carry only reviewed interpretations into future practice without ending the conversation.

**Blocked by:** 07 — Practise using approved Subject material.

**Status:** ready-for-agent

- [ ] Offer a recap on explicit request and at meaningful activity checkpoints, not an arbitrary fixed learner-message count. Ignoring a proposal never blocks continued chat.
- [ ] Present editable/correctable proposals inline with accept and dismiss actions. Unreviewed or dismissed proposals do not become reviewed understanding or replace earlier accepted observations.
- [ ] Persist accepted/corrected observations independently of the transcript, with Subject/account ownership, covered activity, provenance and qualified uncertainty. The learner can see the reviewed outcome before the map slice is available.
- [ ] Track the last reviewed coverage checkpoint so later proposals describe new changes instead of repeatedly replacing everything. New discussion after a reviewed recap remains tentative.
- [ ] Subsequent practice can use reviewed observations as provisional learning context, while approved Practice versions remain the source of subject material. Do not treat authored content, a bio, unreviewed AI assertions or one answer as mastery.
- [ ] Preserve intended difficulty and requested assistance where available; later assessment can supply richer qualification without changing the approval boundary.
- [ ] Authorise recap generation/application and check the current understanding revision. Reject stale applications with proposed text preserved; retries cannot duplicate observations. Later reset/removal must be able to invalidate an older proposal.
- [ ] Do not retain a secret copy of the full transcript/source document inside reviewed observations. Model provenance so source deletion can be marked without cascading deletion of the observation.
- [ ] Public-boundary tests cover accept/correct/dismiss, continued conversation, incremental coverage, persistence, reviewed-only outgoing practice context, stale/replayed applications and foreign-account denial using controlled AI proposals.
