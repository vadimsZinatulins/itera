# 14: Delete a conversation while retaining reviewed understanding

**What to build:** Let the learner permanently delete a disposable conversation while previously reviewed observations remain visible and separately removable in Subject understanding.

**Blocked by:** 08 — Recover interrupted chat without duplicate messages; 12 — Explore Subject understanding through connected concepts.

**Status:** ready-for-agent

- [ ] Provide confirmed individual conversation deletion with a clear statement that live-app deletion is permanent, there is no first-version trash, and reviewed understanding is retained.
- [ ] Remove the transcript, pending/unreviewed recap interpretations, assessment continuation and tentative contributions. Remove the conversation's local unsent draft so recovery cannot restore it.
- [ ] Preserve reviewed observations independently and show that the originating conversation was deleted. They remain inspectable/useful for later practice; do not keep a hidden transcript or offer a broken source-conversation link.
- [ ] Do not delete documents or other conversations merely because they supplied related material. Reviewed-observation removal/reset remains a separate action.
- [ ] Server-authorise deletion and ensure all persisted/live views agree after reload or a second session. Retried deletion cannot recreate state or produce a misleading retained transcript.
- [ ] In-flight generation, late streaming completion, recap proposals and stale local recovery cannot resurrect the deleted conversation or its tentative contributions. Do not claim already accepted provider work is cancellable or unbilled.
- [ ] Explain the boundary between live-app deletion and provider-retained data/external copies; do not promise immediate erasure outside app control.
- [ ] Public-boundary tests cover confirmed deletion, retained reviewed details and future practice context, absent transcript/pending/tentative data through direct requests, local cleanup, late provider completion and account/Subject isolation.
