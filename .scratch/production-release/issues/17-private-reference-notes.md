# 17: Maintain private account-level Reference notes

**What to build:** Let the learner maintain a durable private collection of their own Reference notes for lookup and reuse, independent of Subjects and learning assessment.

**Blocked by:** 01 — Owner sign-in to the production application.

**Status:** ready-for-agent

- [ ] Save learner-authored notes with title, short subtitle and Markdown content; edit with explicit save/cancel and useful validation/error feedback. Do not rely on the prototype's fictional notes as the owner's only content.
- [ ] Provide search and equal-sized title/subtitle cards opening a large Markdown reading dialog. Keep Edit and Improve placement consistent with the accepted direction; do not present unimplemented AI as real assistance before ticket 18.
- [ ] Render readable Markdown/code with copy actions, touch-friendly controls and a large mobile reading/editing experience. Avoid Help action labels.
- [ ] Saved notes survive reload, logout/login and a second session. They belong to the account, not to a Subject, and remain available independently of Subject creation/switching/deletion.
- [ ] Enforce account ownership through public application/data access; anonymous or foreign-account callers cannot retrieve or modify notes.
- [ ] Keep Reference notes out of practice, assessment and Subject-understanding retrieval. Account-level availability never means sharing between accounts or automatic AI context.
- [ ] Public-boundary tests cover authoring/editing/cancel, search, Markdown/code copy, durable return, responsive/keyboard use and direct authorisation attempts with real test persistence.
- [ ] Where practice features already exist, capture outgoing requests to verify no note leakage; preserve this invariant when later features are integrated.
