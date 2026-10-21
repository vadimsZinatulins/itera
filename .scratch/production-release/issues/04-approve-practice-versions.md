# 04: Explicitly approve and update Practice versions

**What to build:** Let the learner choose exactly when a complete saved Learning Document becomes eligible for practice, inspect that approved version, and keep later Draft revisions separate.

**Blocked by:** 03 — Author and save Learning Documents.

**Status:** ready-for-agent

- [ ] Ready to Practice creates the first coherent saved snapshot, including title, description and ordered block content. Require a nonblank title and substantive saved content.
- [ ] Outstanding edits must be saved or discarded before approval. A failed save or stale approval cannot publish mixed or unconfirmed content.
- [ ] Draft saves after approval leave the existing Practice version unchanged. Update practice version explicitly replaces the snapshot only after current saved content is reviewed/approved.
- [ ] View practice version displays the approved snapshot rather than the current Draft. Snapshot content/status persists across reload and another session.
- [ ] Show Draft, Draft revision and Available for practice accurately. Search/status filters allow an eligible approved version to coexist with excluded Draft changes.
- [ ] Approval is a server-authorised coherent operation; client labels cannot grant eligibility, foreign accounts cannot publish material, and retries cannot create inconsistent outcomes.
- [ ] Clearly state that approval means material encountered, not demonstrated understanding. Preview, download, ordinary save and later AI suggestions do not approve content.
- [ ] Public-boundary tests cover first approval, revision isolation, replacement, saved/unsaved guards, stale/racing requests, approved-version inspection and cross-account access denial.
