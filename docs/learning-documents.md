# Learning Document authoring and Practice versions

Ticket: `docs/production-plan:.scratch/production-release/issues/03-author-learning-documents.md` (planning branch; inspect with `git show`).

- `components/learning-documents.tsx`: rendered-first ordered Markdown blocks. Save block commits to the local working Draft; Save as Draft persists the complete aggregate. Save/Cancel and Ctrl/Command+Enter are composition-aware. Hover/focus actions on desktop, visible actions on touch. Immediate latest-removal undo.
- `GET /api/documents?subject=<uuid>`: authenticated, account/Subject-scoped saved Drafts. Search runs over that Subject's saved Draft and approved snapshot titles, descriptions and block content. Status filters distinguish Drafts, Draft revisions and documents available for practice (including those with excluded Draft revisions).
- `POST /api/documents`: same-origin authenticated Draft save. Accepts `id`, `subjectId`, expected `revision` (0 creates), `title`, `description`, ordered `blocks: [{id, markdown}]`. Ownership comes from the live authenticated session, never the payload.
- `save_learning_document` is the sole public data write boundary. SQL compare-and-swap atomically replaces the aggregate and increments revision. Direct table writes are revoked. RLS scopes reads to live account sessions. Apply migration `202603010003_learning_documents.sql` after the account and Subject migrations.
- Conflict returns 409 without changing the saved record. Attempted text remains in the editor. Refresh/review displays the latest saved version alongside it; replacing attempted edits requires confirmation. No automatic merge or force-overwrite.
- Draft limits at the database boundary: 300 title characters, 5000 description characters, 200 blocks and 500 KB serialized block content. API also limits request size.
- Preview/copy/download use the selected successfully saved Draft, not outstanding edits. Markdown rendering does not allow raw HTML. These exports are document reuse, not account backups.
- Leaving through the document list, Subject picker or logout requires discarding unsaved changes or cancelling to save. Subject Back/Forward history retains outstanding Draft and open-block buffers in the mounted account page. Account-level logout/Subject-navigation and browser-unload guards include dirty buffers in inactive Subjects, not only the visible editor. No browser-termination recovery or offline editing guarantee. Logout clears the client through full navigation; saved Drafts remain in Supabase.
- Draft saving never approves practice material or records understanding. No AI action or practice conversation is exposed yet.

## Explicit Practice approval (ticket 04)

- Apply `202603010004_practice_versions.sql` after the Draft migration, without resetting existing data. Existing documents remain unapproved Drafts.
- `POST /api/documents/approve` takes `id`, `subjectId` and the expected saved `revision`; it accepts no replacement content. The same-origin authenticated route calls `approve_learning_document`. The public RPC independently checks live session, ownership, Subject, revision, nonblank title and substantive block content (at least one letter/number, not only whitespace/Markdown punctuation).
- Approval locks the document row and snapshots its saved title, description and ordered blocks atomically into `practice_version`, together with its source revision. Draft saves do not change this snapshot. Concurrent saves either follow the approved snapshot or cause stale approval rejection; repeated approval of the same saved revision is a no-op. Direct table writes remain revoked and snapshot reads use the same account/session RLS.
- Ready to Practice / Update practice version opens a rendered saved-snapshot review before explicit confirmation. Unsaved title/description/order/block changes, including open block buffers, disable approval until saved or discarded. Failed saves do not enable approval. A stale approval preserves the reviewed text and offers refresh/review, never silent publication of newer content.
- View practice version reads the approved snapshot independently of outstanding local or saved Draft revisions. Its copy/download also uses that selected snapshot; ordinary preview/export continues to use the saved Draft and never approves it. Snapshot revision equal to Draft revision means Available for practice; a later saved Draft is a Draft revision while the prior approved version remains eligible.
- Approval means material encountered, not demonstrated understanding. This slice establishes eligibility only; future practice must select approved snapshots, never Draft content.

## Verification

Run all tooling in Docker:

```sh
bash scripts/local.sh check
bash scripts/local.sh test tests/documents.spec.ts
bash scripts/local.sh test tests/document-editor.spec.ts tests/document-privacy.spec.ts
bash scripts/local.sh test tests/practice-versions.spec.ts tests/practice-approval-guards.spec.ts tests/practice-privacy.spec.ts
bash scripts/local.sh test
```

The approved seam is the running production application's public browser/application/data boundary with real local Supabase auth/persistence and controlled outgoing email. Tests cover two sessions and stale attempts, reload/logout/login persistence, editing/composition/touch, insertion/order/removal/undo, saved output/download/search including indentation-sensitive code, browser Back/Forward buffers, save failure/in-progress states and access denial. Production builds are exercised by the test wrapper. Local substitutes do not prove deployed email delivery or actual cross-device infrastructure availability.
