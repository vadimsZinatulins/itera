# 08: Recover interrupted chat without duplicate messages

**What to build:** Let the learner leave or lose connectivity while typing/sending and return with clear device-only draft recovery, truthful reply status and safe explicit retry.

**Blocked by:** 06 — Start and resume durable AI conversations.

**Status:** implemented

- [x] Recover unsent chat text on the current device, partitioned by account, Subject and conversation, including a not-yet-created thread. Switching threads does not mix drafts.
- [x] Label local recovery Saved on this device and distinguish it from server-saved history. Do not claim local drafts synchronise to another device or provide offline AI.
- [x] Distinguish unsent, sending, saved and failed states through disconnects, slow responses and navigation. Preserve successfully saved history independently of pending text.
- [x] Persist incomplete reply status and any available partial content so interrupted output cannot appear to be a finished answer. Opening another session shows an honest persisted outcome.
- [x] Retrying persistence or recovering an uncertain send does not duplicate an already saved message. Another provider generation is an explicit action and warns when the previous request may already have incurred charges.
- [x] Do not automatically replay possibly charged requests in the background or promise provider-side billing deduplication.
- [x] Logout clears local personal drafts and account-specific in-memory state. Keys never enter localStorage; drafts cannot leak into another account's session.
- [x] Establish cleanup behaviour for thread/Subject drafts so later deletion slices can remove them without recovery resurrecting deleted content.
- [x] Public-boundary tests simulate failure before/after save acknowledgement, interrupted streaming, reload, thread/Subject switching and separate sessions. Assert message identity, persisted status, local labels, explicit retry and logout clearing rather than internal state shape.

## Implementation notes

- `lib/chat-recovery.ts`: versioned account/Subject/thread storage, including the `new` slot. Only composer text, source-mode selection and stable pending operation identity are retained. Storage failures show **Device recovery unavailable**, not a false save claim.
- Persist operation identity before sending; clear recovery only after confirmed save or a definitive rejection (which retains editable text). No background replay. Explicit same-send retry warns it may start a chargeable generation if the message was not saved; an existing operation never generates again.
- Existing issue-06 server transactions/checkpoints already persist message identity and incomplete/partial outcomes. Reused unchanged. **Request another reply** explicitly prepares a distinct follow-up message, with a possible prior/additional-charge warning; the learner still chooses **Send message**. It does not silently regenerate or duplicate the original message.
- Logout/session invalidation clears namespaced storage and signals mounted chat to abort and discard account state. Other tabs receive the existing session broadcast.
- Deletion integration contract for issues 14/15/23: after confirmed deletion, call `clearChatRecovery(accountId, subjectId?, conversationId?)` before navigating. Thread cleanup also removes an uncertain first-send operation still in the `new` slot. The helper signals mounted chat to abort pending work and discard matching recovery. Account/Subject scopes clear all descendant slots. A 404 on opening a thread discards its stale recovery; outages do not. Later deletion implementations must also retain their server-side no-resurrection guarantees; this helper is not a substitute for deletion authorization/tombstones.

## Validation

Docker-only `scripts/local.sh check` (typecheck + lint), production build via the test harness, and `scripts/local.sh test tests/chat-recovery.spec.ts tests/conversations.spec.ts tests/approved-practice.spec.ts`: **10 passed**. Covers reload, thread/Subject switching, logout, uncertain sends before/after acknowledgement, provider interruption, navigation during a slow reply, separate-session persisted partial output, explicit charge-warning recovery, stable message identity and no automatic generation replay.
