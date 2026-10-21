# 08: Recover interrupted chat without duplicate messages

**What to build:** Let the learner leave or lose connectivity while typing/sending and return with clear device-only draft recovery, truthful reply status and safe explicit retry.

**Blocked by:** 06 — Start and resume durable AI conversations.

**Status:** ready-for-agent

- [ ] Recover unsent chat text on the current device, partitioned by account, Subject and conversation, including a not-yet-created thread. Switching threads does not mix drafts.
- [ ] Label local recovery Saved on this device and distinguish it from server-saved history. Do not claim local drafts synchronise to another device or provide offline AI.
- [ ] Distinguish unsent, sending, saved and failed states through disconnects, slow responses and navigation. Preserve successfully saved history independently of pending text.
- [ ] Persist incomplete reply status and any available partial content so interrupted output cannot appear to be a finished answer. Opening another session shows an honest persisted outcome.
- [ ] Retrying persistence or recovering an uncertain send does not duplicate an already saved message. Another provider generation is an explicit action and warns when the previous request may already have incurred charges.
- [ ] Do not automatically replay possibly charged requests in the background or promise provider-side billing deduplication.
- [ ] Logout clears local personal drafts and account-specific in-memory state. Keys never enter localStorage; drafts cannot leak into another account's session.
- [ ] Establish cleanup behaviour for thread/Subject drafts so later deletion slices can remove them without recovery resurrecting deleted content.
- [ ] Public-boundary tests simulate failure before/after save acknowledgement, interrupted streaming, reload, thread/Subject switching and separate sessions. Assert message identity, persisted status, local labels, explicit retry and logout clearing rather than internal state shape.
