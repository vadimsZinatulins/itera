# 03: Author and save Learning Documents

**What to build:** Let the learner author, find and reuse durable Subject-scoped Learning Documents through the accepted rendered-first Markdown-block editor, with honest save states and protection from stale saves.

**Blocked by:** 02 — Create and switch private Subjects.

**Status:** ready-for-agent

- [ ] Create a Learning Document with title, description and ordered Markdown blocks in the current Subject. Search titles/content and open saved documents without crossing account/Subject boundaries.
- [ ] Render saved Markdown by default. Provide desktop hover/focus actions and double-click editing, visible touch actions, Save/Cancel and Ctrl/Command+Enter without interfering with text composition.
- [ ] Insert, reorder and remove blocks; provide the accepted immediate block-removal undo. Persist saved block order and content, not only the rendered view.
- [ ] Successfully saved Drafts survive reload, logout/login and another device/session. Saving never represents approval or demonstrated understanding.
- [ ] Distinguish unsaved local edits, saves in progress, confirmed server saves and failures. Navigation preserves outstanding in-session edits or requires save/discard before losing them; do not promise offline document editing or recovery after browser termination.
- [ ] An older session cannot overwrite a newer saved document. Reject the stale write at the trusted boundary, retain attempted text and explain refresh/review instead of silently merging.
- [ ] Assemble rendered preview and Markdown copy/download from the selected saved document in block order. Exports are ordinary document reuse, not account backups or approval.
- [ ] Public-boundary tests cover editing, keyboard/touch actions, insertion/order/delete/undo, search, assembled output, save failures, two-session persistence and stale-save rejection with preserved attempted text.
- [ ] Verify anonymous and foreign-account/Subject access denial through public requests. Do not expose scripted AI or Practice approval as implemented functionality in this slice.
