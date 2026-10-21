# 03: Author and save Learning Documents

**What to build:** Let the learner author, find and reuse durable Subject-scoped Learning Documents through the accepted rendered-first Markdown-block editor, with honest save states and protection from stale saves.

**Blocked by:** 02 — Create and switch private Subjects.

**Status:** closed — implemented and manually accepted

**Evidence:** `feat/03-author-learning-documents`, commits `8211f0f`, `da46f7f` and `5c719ea`; Docker typecheck/lint, production build and all 18 public-boundary tests passed. Independent Standards/Spec review findings addressed: preserve indentation-sensitive Markdown, retain Subject-history edit buffers, and guard inactive-Subject unsaved edits on logout/unload. Regression coverage added. Owner completed manual testing and confirmed everything works after the missing local document migration was applied without resetting or deleting existing data.

**Scope note:** Draft authoring and ordinary Markdown reuse only. Practice approval, AI assistance and demonstrated-understanding interpretation remain separate later slices.

- [x] Create a Learning Document with title, description and ordered Markdown blocks in the current Subject. Search titles/content and open saved documents without crossing account/Subject boundaries.
- [x] Render saved Markdown by default. Provide desktop hover/focus actions and double-click editing, visible touch actions, Save/Cancel and Ctrl/Command+Enter without interfering with text composition.
- [x] Insert, reorder and remove blocks; provide the accepted immediate block-removal undo. Persist saved block order and content, not only the rendered view.
- [x] Successfully saved Drafts survive reload, logout/login and another device/session. Saving never represents approval or demonstrated understanding.
- [x] Distinguish unsaved local edits, saves in progress, confirmed server saves and failures. Navigation preserves outstanding in-session edits or requires save/discard before losing them; do not promise offline document editing or recovery after browser termination.
- [x] An older session cannot overwrite a newer saved document. Reject the stale write at the trusted boundary, retain attempted text and explain refresh/review instead of silently merging.
- [x] Assemble rendered preview and Markdown copy/download from the selected saved document in block order. Exports are ordinary document reuse, not account backups or approval.
- [x] Public-boundary tests cover editing, keyboard/touch actions, insertion/order/delete/undo, search, assembled output, save failures, two-session persistence and stale-save rejection with preserved attempted text.
- [x] Verify anonymous and foreign-account/Subject access denial through public requests. Do not expose scripted AI or Practice approval as implemented functionality in this slice.
