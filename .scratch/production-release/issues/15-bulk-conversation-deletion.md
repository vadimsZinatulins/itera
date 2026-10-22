# 15: Delete selected or all conversations

**What to build:** Let the learner remove selected conversations, all conversations in a Subject, or all conversations across the account with explicit scope and the same retained-understanding semantics as individual deletion.

**Blocked by:** 14 — Delete a conversation while retaining reviewed understanding.

**Status:** ready-for-agent

- [ ] Select a group of persisted conversations and delete the selected group without removing unrelated threads.
- [ ] Offer distinct all-in-current-Subject and all-across-account actions with clear labels. Counts and deletion cover the complete stated scope, including records not loaded on screen.
- [ ] Before confirmation, show scope/count, permanence, absence of trash and retained reviewed understanding. Account-wide deletion requires typing DELETE before the final action enables; cancelling/dismissing does not delete anything.
- [ ] Revalidate authoritative scope at execution and report the real outcome if conversations changed after the preview. Do not silently expand a selected-group action into another scope or claim partial/failed work fully succeeded.
- [ ] Apply individual-deletion rules to every removed conversation: transcript/pending/tentative/assessment/local-draft cleanup, retained reviewed observations marked source-deleted, and no hidden transcript copies.
- [ ] Preserve documents, profile, Reference notes, credentials and other Subjects' conversations when outside the selected scope. An account-wide action cannot reach another account.
- [ ] Delayed provider work and retries cannot resurrect removed conversations or duplicate retained observations.
- [ ] Public-boundary tests include paginated/unloaded history, selection and both all scopes, typed confirmation/cancel, changed counts, cross-account attacks, retained understanding and in-flight reply completion.
