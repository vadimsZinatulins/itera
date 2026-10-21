# Learning Document Draft authoring

Ticket: `docs/production-plan:.scratch/production-release/issues/03-author-learning-documents.md` (planning branch; inspect with `git show`).

- `components/learning-documents.tsx`: rendered-first ordered Markdown blocks. Save block commits to the local working Draft; Save as Draft persists the complete aggregate. Save/Cancel and Ctrl/Command+Enter are composition-aware. Hover/focus actions on desktop, visible actions on touch. Immediate latest-removal undo.
- `GET /api/documents?subject=<uuid>`: authenticated, account/Subject-scoped saved Drafts. Search runs over that Subject's returned titles, descriptions and block content.
- `POST /api/documents`: same-origin authenticated Draft save. Accepts `id`, `subjectId`, expected `revision` (0 creates), `title`, `description`, ordered `blocks: [{id, markdown}]`. Ownership comes from the live authenticated session, never the payload.
- `save_learning_document` is the sole public data write boundary. SQL compare-and-swap atomically replaces the aggregate and increments revision. Direct table writes are revoked. RLS scopes reads to live account sessions. Apply migration `202603010003_learning_documents.sql` after the account and Subject migrations.
- Conflict returns 409 without changing the saved record. Attempted text remains in the editor. Refresh/review displays the latest saved version alongside it; replacing attempted edits requires confirmation. No automatic merge or force-overwrite.
- Draft limits at the database boundary: 300 title characters, 5000 description characters, 200 blocks and 500 KB serialized block content. API also limits request size.
- Preview/copy/download use the selected successfully saved Draft, not outstanding edits. Markdown rendering does not allow raw HTML. These exports are document reuse, not account backups.
- Leaving through the document list, Subject picker or logout requires discarding unsaved changes or cancelling to save. Subject Back/Forward history retains outstanding Draft and open-block buffers in the mounted account page. Browser unload warns while dirty. No browser-termination recovery or offline editing guarantee. Logout clears the client through full navigation; saved Drafts remain in Supabase.
- Draft saving never approves practice material or records understanding. No Practice approval or AI action is exposed in this slice.

## Verification

Run all tooling in Docker:

```sh
bash scripts/local.sh check
bash scripts/local.sh test tests/documents.spec.ts
bash scripts/local.sh test tests/document-editor.spec.ts tests/document-privacy.spec.ts
bash scripts/local.sh test
```

The approved seam is the running production application's public browser/application/data boundary with real local Supabase auth/persistence and controlled outgoing email. Tests cover two sessions and stale attempts, reload/logout/login persistence, editing/composition/touch, insertion/order/removal/undo, saved output/download/search including indentation-sensitive code, browser Back/Forward buffers, save failure/in-progress states and access denial. Production builds are exercised by the test wrapper. Local substitutes do not prove deployed email delivery or actual cross-device infrastructure availability.
