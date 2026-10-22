# 04: Explicitly approve and update Practice versions

**What to build:** Let the learner choose exactly when a complete saved Learning Document becomes eligible for practice, inspect that approved version, and keep later Draft revisions separate.

**Blocked by:** 03 — Author and save Learning Documents.

**Status:** ready-for-human

**Implementation:** `feat/04-approve-practice-versions`; implemented, pending owner manual acceptance. Original scope from `docs/production-plan`.

- [x] Ready to Practice creates the first coherent saved snapshot, including title, description and ordered block content. Require a nonblank title and substantive saved content.
- [x] Outstanding edits must be saved or discarded before approval. A failed save or stale approval cannot publish mixed or unconfirmed content.
- [x] Draft saves after approval leave the existing Practice version unchanged. Update practice version explicitly replaces the snapshot only after current saved content is reviewed/approved.
- [x] View practice version displays the approved snapshot rather than the current Draft. Snapshot content/status persists across reload and another session.
- [x] Show Draft, Draft revision and Available for practice accurately. Search/status filters allow an eligible approved version to coexist with excluded Draft changes.
- [x] Approval is a server-authorised coherent operation; client labels cannot grant eligibility, foreign accounts cannot publish material, and retries cannot create inconsistent outcomes.
- [x] Clearly state that approval means material encountered, not demonstrated understanding. Preview, download, ordinary save and later AI suggestions do not approve content.
- [x] Public-boundary tests cover first approval, revision isolation, replacement, saved/unsaved guards, stale/racing requests, approved-version inspection and cross-account access denial.

## Acceptance notes

Apply `supabase/migrations/202603010004_practice_versions.sql` after existing migrations without resetting data. Save a Draft; review and confirm Ready to Practice. Change/save the Draft and inspect the unchanged approved version; review and confirm Update practice version. Check reload and another session. Conversations/AI/practice activities remain later slices.

**Verification:** Docker typecheck/lint and production build passed; full public-boundary suite: 23/23 passed. Document and Practice-version multi-session workflows also passed three repeated runs (9/9 tests). Commands are documented in `docs/learning-documents.md`. The desktop multi-session tests explicitly hover blocks before using hover-only actions; this removes the observed automation timeout without changing production interaction behavior.

Independent review found a large-document regression: the editor resent the approved snapshot with Draft mutations, doubling request size. A 310 KB browser regression reproduced HTTP 413 before the fix and passed after limiting the payload to Draft fields. Shared successful-save/approval state synchronization was also deduplicated.
