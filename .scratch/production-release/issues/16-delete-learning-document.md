# 16: Delete a Learning Document without deleting learning history

**What to build:** Let the learner remove a Learning Document and its Practice content without ending its related conversations or erasing reviewed Subject understanding.

**Blocked by:** 12 — Explore Subject understanding through connected concepts.

**Status:** ready-for-agent

- [ ] Explain before deletion that the Draft and approved Practice content will be removed, while past messages may still quote/discuss the material and reviewed observations remain.
- [ ] Remove Draft/block/approved source content from live eligible document storage and future source selection. Do not retain a complete deleted source snapshot solely to keep generating future practice from it.
- [ ] Keep conversations resumable and reviewed observations intact. Mark historical source references as deleted instead of using document-owned conversation cascades or blocking continuation.
- [ ] Future practice uses remaining current approved sources. If none remain, preserve ordinary chat and reviewed understanding while explaining that source-based assessment requires new approved material.
- [ ] Do not delete unrelated documents, account-level content or another account's material. An old client-selected source ID cannot make the deleted source eligible again.
- [ ] Stale saves/approvals and late provider work cannot recreate the deleted document or apply changes as if its source still exists. Preserve honest history without manufacturing a hidden archive.
- [ ] Public-boundary tests delete Draft-only and approved/revised documents, inspect absent eligible source content through public requests, continue existing conversations, verify retained observations/source markers and capture future provider requests with/without remaining sources.
- [ ] Verify account/Subject authorisation, reload/two-session outcomes and delayed work. Do not treat ordinary Markdown copies outside the app as remotely erasable.
