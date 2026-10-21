# First production release — private learning companion

Status: ready-for-agent

## Problem Statement

The learner wants a private learning companion they can use on their phone during a commute. They need to write down study material, explicitly decide which version is suitable for practice, and use conversation to apply and test their understanding. They also need a separate collection of Reference notes for lookup, not assessment.

The accepted prototypes show the desired interaction, but their authentication, AI, storage and learning interpretations are simulated. Their in-memory state is not a usable product: saved work and unfinished conversations must survive logout, reload and moving between devices.

The learner wants an evolving, inspectable account of Subject understanding without treating authored notes, AI assertions or material encountered as proof of knowledge. Conversations should be disposable and resumable. Reviewed understanding should persist independently, remain correctable, and never depend on a mandatory conversation-ending ceremony.

## Solution

Deliver a deployed, owner-only first release using the accepted mobile-friendly companion workflow. Retain one seamless Learning Trail with automatically registered conversations, suggested open threads, adaptive assessment in the same chat, and a connected-concepts view reached through **Explore understanding**.

Provide durable Subject-scoped Learning Documents with rendered-first Markdown blocks. Saving a Draft never approves it. **Ready to Practice** creates the first approved Practice version; **Update practice version** explicitly replaces it. Practice uses relevant approved material within the current Subject, not Drafts or Reference notes.

Use real OpenAI requests with the learner's own API key and selected supported model. Offer incremental, inline Practice recaps that can be accepted, corrected or dismissed while the conversation continues. Distinguish tentative conversation context from reviewed observations in Subject understanding. Use only reviewed interpretations to guide future practice.

Keep all account content private. Deploy on the agreed free infrastructure, accepting its availability limits. Normal durable saving is required; backups and application-provided disaster recovery are not part of this version.

## User Stories

### Access, privacy and deployment

1. As the owner, I want a deployed application I can open on my phone, so that I can use it during my commute rather than only on a development machine.
2. As the owner, I want to sign in with an email code sent to my provisioned account, so that I do not need to manage another password.
3. As the owner, I want to request another code or correct my email during login, so that a failed attempt does not trap me.
4. As the owner, I want login failures and delivery limits explained without exposing codes or secrets, so that I can recover safely.
5. As the owner, I want no public signup path, so that access remains externally controlled.
6. As the learner, I want my documents, notes, profile, images, conversations and Subject understanding private to my account, so that another account cannot access my personal material.
7. As the learner, I want saved work to survive logout and reload, so that leaving the app does not reset my workspace.
8. As the learner, I want saved work available on another device, so that I can move between my phone and desktop.
9. As the learner, I want logout to clear local personal drafts and account-specific client state, so that a later session does not expose them.
10. As the owner, I want infrastructure to remain on free plans without automatic paid upgrades, so that the pilot does not create unapproved infrastructure costs.
11. As the owner, I want infrastructure limits and possible inactivity restoration to be understood, so that I do not mistake the pilot for a guaranteed-availability service.
12. As the owner, I want the first version to omit backups, so that recovery tooling does not delay this release.

### Subjects and navigation

13. As the learner, I want to create a Subject, so that I can organise a new area of study.
14. As the learner, I want blank and duplicate Subject names rejected, so that the Subject picker remains meaningful.
15. As the learner, I want a discreet Subject picker, so that infrequent switching does not dominate the interface.
16. As the learner, I want each Subject's documents, conversations, practice and understanding separated, so that one study area does not contaminate another.
17. As the learner, I want switching Subjects to preserve saved work and resumable conversations, so that navigation does not end an activity.
18. As the learner, I want a useful empty-Subject state, so that I know how to add and approve study material.
19. As the learner, I want chat available without approved material for goals, organisation and requested authoring assistance, so that I can prepare a new Subject.
20. As the learner, I want the app to explain why source-based assessment is unavailable without approved material, so that it does not invent a syllabus for me.
21. As the learner, I want Subject deletion placed away from routine actions and guarded by exact-name confirmation, so that I do not erase a study area accidentally.
22. As the learner, I want Subject deletion to explain and remove all of that Subject's documents, conversations and understanding, so that the action has a clear scope.
23. As the learner, I want other Subjects and account-level material unaffected by Subject deletion, so that deleting one study area does not damage the rest of my workspace.

### Learning Documents and approval

24. As the learner, I want to create Learning Documents with a title, description and ordered Markdown blocks, so that I can capture my own study material.
25. As the learner, I want to search my current Subject's documents and filter their practice status, so that I can find the material I need.
26. As the learner, I want to read rendered Markdown by default, so that my documents feel like learning material rather than a code editor.
27. As the learner, I want discoverable desktop block actions and visible touch actions, so that editing works with both mouse and phone.
28. As the learner, I want to edit a block and save it with a button or Ctrl/Command+Enter, so that I can work efficiently.
29. As the learner, I want to cancel a block edit, so that I can leave its saved content unchanged.
30. As the learner, I want to insert, reorder and remove blocks, with the accepted immediate block-delete undo, so that I can organise a document without rewriting it.
31. As the learner, I want unsaved edits distinguished from server-saved Draft content, so that I know what will survive leaving the session.
32. As the learner, I want in-app navigation not to silently discard outstanding document edits, so that switching context does not lose my current work.
33. As the learner, I want to save a Draft without approving it, so that incomplete or uncertain material stays out of practice.
34. As the learner, I want **Ready to Practice** to approve a complete saved snapshot, so that only material I explicitly approve can inform practice.
35. As the learner, I want to save or discard outstanding edits before approval, so that I do not approve a mixture of saved and unsaved content.
36. As the learner, I want later edits to form a Draft revision while the previous Practice version remains unchanged, so that writing does not silently change my practice sources.
37. As the learner, I want **Update practice version** to replace the approved snapshot only when I choose, so that publication remains explicit.
38. As the learner, I want to inspect the approved Practice version separately from my Draft, so that I can see what the companion can use.
39. As the learner, I want document status to distinguish Draft, Draft revision and Available for practice, so that eligibility is visible.
40. As the learner, I want an assembled rendered preview and Markdown copy/download, so that I can reuse the complete document in block order.
41. As the learner, I want exports and previews not to approve content, so that reading or copying a Draft does not change its eligibility.
42. As the learner, I want stale document saves rejected while my unsaved text remains available, so that an old device cannot overwrite newer work.
43. As the learner, I want to request writing improvement or correctness review for a block or whole document, so that I can refine material with AI assistance.
44. As the learner, I want to inspect and edit proposed changes before applying them, so that AI never rewrites my content without approval.
45. As the learner, I want applied writing changes to affect only the intended Draft scope, so that AI assistance does not silently publish a Practice version.
46. As the learner, I want correctness reviews presented as uncertain suggestions rather than verification certificates, so that I can judge their limits.
47. As the learner, I want document deletion to remove its Draft and Practice version without deleting conversations or reviewed understanding, so that source material and learning history remain independent.
48. As the learner, I want deleted source references marked clearly and excluded from future source selection, so that the companion does not quietly keep selecting removed material.

### Reference notes

49. As the learner, I want to keep my own Reference notes with titles, subtitles and Markdown content, so that useful lookup material stays close at hand.
50. As the learner, I want to search Reference notes through equal-sized title/subtitle cards, so that the collection is easy to scan.
51. As the learner, I want a large reading dialog with Edit and Improve actions at the top, so that I can read and change a note without hunting for controls.
52. As the learner, I want readable code blocks and a copy action, so that I can reuse reference material conveniently.
53. As the learner, I want saved Reference-note edits to persist across sessions and Subjects, so that my account-level collection is reliable.
54. As the learner, I want to explicitly request AI improvement and inspect the proposed result before applying it, so that I remain the author of the note.
55. As the learner, I want Reference notes excluded from practice, assessments and Subject understanding, so that lookup material never becomes study evidence.

### Conversations and continuity

56. As the learner, I want the first sent message to register a conversation automatically, so that I can begin by talking rather than completing a Start ceremony.
57. As the learner, I want past conversations visible and continuable under their existing identity, so that returning does not create a disconnected copy.
58. As the learner, I want a conversation to draw on multiple relevant approved Practice versions within its Subject, so that it is not tied to one document.
59. As the learner, I want to see which approved sources inform practice, so that I can understand its basis.
60. As the learner, I want proposed open threads with a short reason and another-topic option, so that I can start with less typing without supplying canned evidence of understanding.
61. As the learner, I want my current request to take priority over suggestions, so that the companion follows what I want to explore.
62. As the learner, I want to ask for an explanation or hint inside chat, so that I can continue when stuck.
63. As the learner, I want to leave, switch threads and return without finishing the conversation, so that interruptions fit naturally into a commute.
64. As the learner, I want unsent text recovered per account, Subject and conversation on the current device, so that a brief interruption does not erase what I was typing.
65. As the learner, I want local recovery labelled **Saved on this device**, distinct from server-saved history, so that I do not assume it is available elsewhere.
66. As the learner, I want unsent, sending, saved and failed states distinguished, so that I know whether a message reached the server.
67. As the learner, I want interrupted AI replies labelled incomplete, so that partial output is not mistaken for a finished answer.
68. As the learner, I want retry not to duplicate an already saved message or recap, so that recovery does not corrupt the conversation.
69. As the learner, I want to choose whether to retry a possibly charged AI request, so that the app does not silently spend more money.
70. As the learner, I want desktop trail and transcript scrolling to remain usable with a pinned composer, so that I can inspect history while continuing to type.
71. As the learner, I want mobile Threads/Chat navigation and touch-accessible controls, so that the experience works on a small screen without voice input.

### Adaptive assessment

72. As the learner, I want to start or resume an assessment inside the same chat, so that assessment does not become a separate disconnected workflow.
73. As the learner, I want questions presented one at a time, so that I can concentrate on reasoning through the current question.
74. As the learner, I want to specify a topic in ordinary language, so that practice follows what I want to revisit.
75. As the learner, I want to request easy, medium or hard questions, so that I can choose the intended level of challenge.
76. As the learner, I want the AI to choose difficulty per question when I leave it open, so that practice can adapt without a configuration form.
77. As the learner, I want to give a time budget such as 15 minutes, so that the AI can plan an appropriate activity.
78. As the learner, I want question count to adapt rather than stop at a hard three-question limit, so that the activity fits my request and available time.
79. As the learner, I want a soft time budget that leads to an offered recap rather than a forced cutoff, so that my answer is not interrupted.
80. As the learner, I want an expired time window acknowledged when I return, with an option to continue or set a new budget, so that resumption remains sensible.
81. As the learner, I want hints recorded as assistance rather than independent performance, so that later interpretations do not overstate what I demonstrated.
82. As the learner, I want to skip a question without it counting as failure, so that unassessed material is not confused with poor understanding.
83. As the learner, I want assessment progress and unsent answers preserved when I leave and return, so that I do not need to restart.
84. As the learner, I want a correctable recap after a meaningful assessment checkpoint, so that I can inspect what the companion inferred.
85. As the learner, I want difficulty labels and question progress not to be presented as calibrated ability or mastery scores, so that the interface does not manufacture certainty.

### Practice recaps and Subject understanding

86. As the learner, I want to request a Practice recap at any time, so that I can review the current interpretation without ending a conversation.
87. As the learner, I want the companion to offer recaps at meaningful checkpoints rather than arbitrary message counts, so that review fits the activity.
88. As the learner, I want to accept, correct or dismiss recaps inline, so that I control which interpretations become reviewed observations.
89. As the learner, I want later recap proposals to focus on changes since the last reviewed checkpoint, so that new discussion does not repeatedly replace everything.
90. As the learner, I want to ignore a proposal and keep talking, so that review never blocks the conversation.
91. As the learner, I want tentative conversation context visibly separated from reviewed observations, so that activity is not mistaken for demonstrated understanding.
92. As the learner, I want only accepted or corrected recaps to guide future practice through Subject understanding, so that unreviewed AI conclusions do not become authoritative.
93. As the learner, I want **Explore understanding** to show connected concepts and their tentative/reviewed/unexplored context, so that I can see what has and has not been explored.
94. As the learner, I want concept links to mean related ideas, not proven abilities, so that the map does not imply a hidden mastery scale.
95. As the learner, I want to inspect an observation and open its conversation when that conversation still exists, so that the interpretation has an understandable basis.
96. As the learner, I want difficulty, uncertainty and requested assistance reflected in reviewed observations, so that different kinds of evidence are not flattened into the same conclusion.
97. As the learner, I want to correct or remove a retained observation, so that inaccurate interpretations stop shaping future practice.
98. As the learner, I want to reset a Subject's understanding without deleting its documents or conversations, so that I can start its reviewed interpretation again.
99. As the learner, I want removed observations not to be automatically rebuilt from old conversations, so that my removal remains effective.
100. As the learner, I want stale recap applications, corrections and resets rejected with my proposed text preserved, so that an old tab cannot undo newer decisions.
101. As the learner, I want previous observations not to be erased by one difficult question or upgraded to mastery by one successful answer, so that the record remains appropriately cautious.

### Deletion and retained understanding

102. As the learner, I want to delete one conversation, so that disposable history does not have to accumulate forever.
103. As the learner, I want to select a group of conversations for deletion, so that I do not need to remove them individually.
104. As the learner, I want to delete all conversations in the current Subject or across my account, so that bulk deletion has a useful and explicit scope.
105. As the learner, I want the deletion count to include matching conversations not yet loaded on screen, so that “all” means all of the stated scope.
106. As the learner, I want to type DELETE before account-wide conversation deletion, so that a large destructive action needs deliberate confirmation.
107. As the learner, I want confirmation that conversation deletion is permanent in live app data and has no first-version trash, so that I understand the consequence.
108. As the learner, I want conversation deletion to remove its transcript, pending interpretations and tentative contributions while retaining reviewed observations, so that disposable history and durable understanding have different lifetimes.
109. As the learner, I want the confirmation to disclose retained understanding and retained observations to identify a deleted source conversation, so that the app does not imply everything was erased.
110. As the learner, I want retained understanding not to hide a copy of the deleted transcript, so that deletion has real meaning.
111. As the learner, I want a separate route to remove observations or reset understanding, so that retained learning records remain under my control.
112. As the learner, I want deletion limits explained for provider retention and copies outside the live app, so that the app does not promise impossible erasure guarantees.

### Personal profile and AI settings

113. As the learner, I want optional name, picture and bio fields with explicit Save/Cancel, so that I can personalise my account without mandatory disclosure.
114. As the learner, I want to preview, replace or remove a supported profile image, so that I control what is displayed.
115. As the learner, I want my picture kept private and display-only, so that it is not sent to AI as learning context.
116. As the learner, I want bio use off by default and explicitly toggleable, so that saving a bio does not automatically share it with AI requests.
117. As the learner, I want relevant opted-in bio context to frame examples without overriding my request, so that personalisation stays useful rather than intrusive.
118. As the learner, I want my profile and bio excluded from evidence of understanding and never rewritten autonomously, so that identity is not confused with learning.
119. As the learner, I want to enter my own OpenAI API key through write-only settings, so that setup is simple without later exposing the stored value.
120. As the learner, I want to replace or remove the key without deleting content, so that I can change credentials independently of my work.
121. As the learner, I want to choose a supported model available to my key, including current compatible models, so that I can control the model used.
122. As the learner, I want an unavailable model or missing key explained without silent substitution, so that I know why AI work cannot proceed.
123. As the learner, I want key removal to stop future AI requests while saved work remains accessible, so that AI configuration is not a prerequisite for reading my data.
124. As the learner, I want the app to keep my key out of browser storage, prompts, exports and logs, so that the temporary storage exception does not spread it through the system.
125. As the owner, I want AI costs identified as separate from free infrastructure and ChatGPT subscriptions, so that I understand which account is charged.
126. As the owner, I want AI work bounded to my initiated workflows with request/output limits and no idle analysis, so that the app does not create hidden background spending.
127. As the learner, I want conversations stored by the app with optional provider response storage disabled, so that continuity does not depend on a provider-side conversation feature.
128. As the learner, I want provider retention and temporary plaintext-key risks described accurately, so that I do not mistake these choices for zero retention or secure encrypted-secret storage.

## Implementation Decisions

### Architecture and release boundary

- Follow the accepted managed-pilot ADR: Next.js on Vercel Hobby, Supabase Free for Auth/Postgres/private image Storage, the owner's existing Resend setup for authentication email, and server-side OpenAI requests using the learner's key. No paid infrastructure or automatic plan upgrades.
- First-release access is one externally provisioned owner account. Disable public account creation. Do not implement account administration, billing, invitations or sharing in the application. Preserve account ownership and authorisation rather than building global single-user tables; admitting another real user requires revisiting the credential exception first.
- Prefer compatible European application/database regions where feasible within the selected free plans. This is not strict EU-only processing or a residency guarantee for every provider.
- Replace simulations with production behaviour through normal implementation work. Do not ship demo-login bypasses, displayed OTPs, fabricated histories or scripted assessment results as real behaviour. Preserve the prototype separately as a design source.
- Align the Docker runtime with a currently supported deployment runtime and verify a production build. The existing development runtime is not compatibility evidence. All Node tools, package operations, Next.js start/stop, checks, browser automation and tests run inside Docker; host-side Docker lifecycle commands are allowed. Update the existing Docker setup as needed.
- Free-plan quotas, inactivity pauses/manual service restoration and availability limits are accepted constraints. Detect and explain service failures without claiming a save or AI completion that did not happen.

### Domain responsibilities and persistent model

- Keep responsibilities centred on account access, Subject organisation, Learning Document authoring/approval, account-level Reference notes, conversation/assessment orchestration, reviewed Subject understanding, optional Personal profile and AI settings. These are responsibility boundaries, not a requirement for a separate module or service for every concept.
- Persist owner-linked Subjects, document Drafts and ordered blocks, approved Practice snapshots, Reference notes, profile fields/private image references, conversations/messages, assessment progress, recap proposals/review decisions, and reviewed understanding observations. Maintain the revisions, source identities and coverage checkpoints needed for conflict detection and provenance.
- Supabase is the durable application record. Client state is not the authority for ownership, approval, eligibility or reviewed status. The browser cannot approve material by changing a label or supply another account's identifier to gain access.
- Reference notes belong to the account, not a Subject. Conversations and Subject understanding belong to a Subject, not an individual Learning Document. A conversation can use multiple approved sources. Source provenance must not create document-owned conversation lifetimes or deletion dependencies.
- Represent tentative context separately from reviewed interpretation. Approved material and concepts may establish what is available to explore, but do not establish ability. Unexplored means unknown, not weak.
- Retained reviewed observations must be usable without retaining their originating transcript. Store the observation and necessary qualified context independently, with a source-deleted marker when appropriate, rather than a hidden transcript or full-document archive masquerading as an observation.
- Resolve mutations at the server boundary, with account/Subject scope and revision preconditions. Learning Document changes and Subject-understanding changes must detect stale revisions; a UI-only warning is insufficient. Preserve the attempted text and explain refresh/review rather than silently merging or overwriting.
- Approval, recap acceptance, resets and destructive actions must have durable, coherent outcomes. Retried requests must not duplicate accepted messages, observations or operations. Delayed AI results must not recreate deleted conversations, deleted Subjects or deliberately removed understanding.
- Do not introduce a graph database, vector store or graph engine merely to render connected concepts. The approved interaction does not dictate such infrastructure.

### Authentication, account privacy and profile

- Use Supabase email-code authentication for an externally provisioned account, without public signup or automatic account creation during login. Support email correction, resend and recoverable verification errors. Verify current provider OTP/rate-limit behaviour during implementation rather than copying simulated code generation/invalidation rules.
- Check authenticated account ownership for reads, writes, source selection, AI invocation, bulk actions and private-image access. Enforce data/storage policies as well as server checks where applicable; hiding controls is not access control. Privileged Supabase credentials remain server-only.
- Never expose authentication codes through production UI/logs or rely on the prototype's hard-coded email check as authentication. Account provisioning remains outside the app through provider tools.
- Persist optional picture/name/bio with Save/Cancel. Retain the accepted PNG/JPEG/WebP, up-to-3-MB image interaction, validating uploads at a trusted boundary and storing images privately. The picture is display-only and never AI context.
- Bio personalisation is opt-in and off by default. Include only relevant opted-in bio context in initiated workflows; the current request takes priority. Turning it off stops inclusion in subsequent requests, not retroactive rewriting of messages. Bio/name/picture never constitute study evidence; do not autonomously rewrite the profile.
- Logout preserves server data but clears local personal drafts and account-specific in-memory state. Prevent local-draft recovery from leaking between accounts.

### Learning Document authoring and publication

- Retain rendered-first Markdown blocks, title/description editing, block insertion/reordering/removal and the accepted immediate block-removal undo. Desktop supports hover/focus actions and double-click editing; touch controls remain visible. Save/Cancel and Ctrl/Command+Enter govern block editing.
- Persist successful Draft saves without changing practice eligibility. Show actual save/error state; do not label an optimistic local edit server-saved before persistence succeeds. Retain outstanding in-session edits across ordinary navigation or require a save/discard decision before an action would discard them. Do not promise durable offline document editing or recovery of every unsaved document edit after browser termination.
- A valid first approval requires a nonblank title and substantive saved block content, consistent with the accepted editor. Resolve outstanding edits by saving or discarding before approval. Snapshot the saved title, description, ordered blocks and content as one coherent Practice version.
- **Ready to Practice** approves the first snapshot. **Update practice version** explicitly replaces it. Draft revisions do not mutate the existing snapshot. **View practice version** shows approved content, not the Draft dressed with an approved badge.
- Search/filter and status must account for approved documents with Draft revisions: a document may have an eligible snapshot while its current working copy is excluded. Approval means encountered material, not demonstrated understanding.
- Assemble document preview/copy/download from saved content in block order. Make the selected Draft versus approved version clear. Ordinary Markdown export remains in scope even though account backups are excluded.
- Explicit AI improvement/correctness review may use the selected Draft block or document. Present a scoped before/after proposal and allow review/edit/apply/discard. Apply only authorised changes to the intended Draft and reject stale applications. Applying suggestions never implicitly approves a Practice version.
- AI correctness review is not authoritative verification. Report uncertainty and limitations; an unchanged result is not a correctness certificate. Do not add a research/browsing product as an unstated dependency.

### Reference notes

- Maintain a private account-level Reference collection with title/subtitle cards, search, large Markdown dialogs and Edit/Improve actions at the top. Preserve readable code and copying, adapting dialogs to small screens.
- Save learner-authored changes durably. AI may receive the selected note only for explicitly requested assistance. Present editable proposed changes and require approval before applying them.
- Reference-note assistance is not a learning assessment and must not contribute note content or inferred performance to Subject understanding. Do not automatically retrieve Reference notes for conversations, questions, assessments or recap generation.
- Avoid “Help” as an action label. Use the established direct action vocabulary such as Improve, Review and Edit.

### Conversations, context and continuity

- The first successfully sent/persisted message registers a conversation. No mandatory Start, Finish or Pause ceremony. Past conversations retain identity and history when continued; tab closure, logout, Subject changes and elapsed time do not finish them.
- Keep one Subject-scoped trail/chat experience, including desktop independently scrolling history/transcript with a usable pinned composer and mobile Threads/Chat navigation. Use the configured shadcn/ui/Base UI styling and native tab semantics with icons. Do not ship the prototype's A/B/C comparison switcher as a required product feature.
- Persist ordered user/assistant messages and resumable assessment state. Distinguish unsent, sending, saved, failed and incomplete outcomes. Do not treat unfinished streamed output as a completed reply or reviewed observation.
- LocalStorage may recover unsent chat text on the current device, partitioned by account, Subject and conversation. Label it **Saved on this device**, not server-saved or synchronised. Never store API keys there. Clear local personal drafts on logout and remove drafts belonging to deleted conversations/Subjects.
- Use stable request/message identity and server-side outcome tracking to avoid duplicate saved messages on retry. Distinguish persistence retry from another provider generation: another OpenAI request can incur another charge even if application messages are deduplicated. Do not blindly replay possibly charged interrupted generations in the background.
- Persist conversation history in the application database; do not depend on OpenAI's conversation-storage feature. Disable optional stored-response retrieval. This does not imply zero provider retention: disclose the documented abuse-monitoring retention caveat and recheck applicable terms before release.
- Build task-scoped context at a trusted boundary. Practice sources are relevant approved Practice versions in the current account/Subject. Do not automatically send the entire account, another Subject's material, Reference notes, Draft revisions or secrets. Relevant opted-in bio is framing only. Treat supplied content as material, not authority to override access or eligibility rules.
- Historical messages may discuss deleted material, but removed documents are no longer eligible source inputs for new questions. Retain source identity/version provenance without secretly retaining deleted complete source documents solely for future practice.
- When no approved sources exist, explain the limitation and allow goals/organisation/requested authoring assistance. Do not invent a source-based assessment syllabus or new demonstrated-understanding claims from that unsupported activity. Existing reviewed understanding remains visible.
- Suggested open threads explain why they are proposed and allow another topic/request. They may draw on approved material and reviewed uncertainty; visible tentative activity must not be promoted into an unreviewed judgment of ability. Keep ordinary conversation context distinct from durable learning interpretation.

### Adaptive assessment and Practice recaps

- Support ordinary-language requests combining topic, intended difficulty and available time. Explicit constraints take priority. When unspecified, AI can choose question count and easy/medium/hard difficulty per question using eligible material and reviewed context. Three questions is not a hard rule.
- Present questions one at a time inside the same conversation. Allow hints/explanations and skips; record requested assistance. A skipped question is not assessed, not failed. Simply opening a question is not evidence of understanding.
- Persist progress and unsent-answer recovery. Assessment remains resumable without creating a new conversation or forcing recap acceptance. Activity counters, if shown, represent activity progress, not knowledge level.
- Treat a stated duration as a soft budget. Consider elapsed time and expected remaining work during active requests, offer a recap near the end, and allow continuation. Do not auto-submit, cut off answers, require idle background AI work or promise exact duration predictions. On late return acknowledge the expired window and allow continuation or a new budget.
- Easy/medium/hard are AI-estimated task labels, not validated ability measurements. Reviewed observations describe demonstrated reasoning with intended difficulty, uncertainty and requested hints/scaffolding. Do not infer mastery from one answer or erase earlier observations because of one struggle.
- Recaps are available on request and may be offered at meaningful checkpoints such as after an assessment, not a fixed learner-message count. They appear inline without ending or blocking the conversation.
- Track which activity a proposal covers and the last reviewed checkpoint so subsequent proposals focus on incremental changes. Continuing a conversation leaves newer activity tentative until reviewed. Unreviewed/dismissed proposals do not replace accepted observations or guide future practice as reviewed conclusions.
- Accepting or correcting a recap is the explicit boundary for durable reviewed interpretation. Applying it must check the current Subject-understanding revision; a proposal prepared before a conflicting reset/change cannot silently restore removed observations. Keep the attempted proposal available for fresh review.

### Subject understanding and destructive actions

- Canonical term: **Subject understanding**. **Explore understanding** opens the connected-concepts representation inside the existing experience, not a separate Learning profile workspace.
- Show related concepts with distinguishable tentative, reviewed and unexplored context. Links denote conceptual relatedness, not proven ability; avoid mastery percentages, ranked node sizes or an implied ability scale. Provide inspectable observations and links to existing originating conversations.
- Reviewed observations may guide later practice within the Subject; Drafts, Reference notes, profile data and unreviewed AI interpretations must not become learning evidence. Material authored or approved does not itself demonstrate understanding.
- Allow direct correction/removal of observations and confirmed reset of the Subject's understanding. Removal stops future influence. Reset preserves documents and conversations and must not trigger automatic rebuilding from old history. Newly reviewed recaps may contribute again, with fresh review and conflict checks rather than resurrection of earlier state.
- Conversation deletion is permanent in live app data after confirmation. Support one, selected group, all in Subject and all across account. Count all matching persisted conversations, not just the loaded page. Require typing **DELETE** for account-wide deletion. No trash/restore feature.
- Deleting a conversation removes its transcript, unreviewed/pending interpretations, assessment continuation and tentative contributions, but preserves previously reviewed observations. Explain this before confirmation. Mark retained observations' source conversation deleted and do not retain a hidden transcript to back them. Removing these observations or resetting understanding is separate.
- Deleting a Learning Document removes its Draft and approved Practice content and excludes it from future source selection. Keep conversations resumable and reviewed observations intact. Mark historical references deleted and disclose that past messages may still contain quotations. Deletion does not cascade through a document-owned conversation relation.
- Subject deletion is different: remove its documents/Practice versions, conversations/pending recaps and all Subject understanding, including observations retained after earlier conversation deletions. Use the guarded management/danger-zone interaction and exact Subject-name confirmation. Preserve other Subjects, account-level Reference notes, Personal profile and AI settings.
- Removal must affect future retrieval and delayed work as well as visible lists. Check deletion/scope/revision before applying late provider results. Do not claim deletion erases provider-retained data, external exports or incidental provider recovery copies.
- There is no app-provided backup/recovery facility in this version. Do not build account-backup export/restore, owner backup commands, scheduled backups or a backup-management runbook. Normal document Markdown copy/download is not an account backup and remains available.

### AI credentials, model support, cost and logs

- OpenAI only. Offer a tested text-model catalogue intersected with the learner's key access and include current compatible models when implementing/releasing. Do not treat every listed model identifier as interchangeable or silently substitute a model after an error. Verify actual endpoint/model/streaming compatibility; record concrete supported choices during implementation rather than inventing model IDs in this spec.
- Model IDs and moving aliases need an explicit documented implementation policy; do not claim they are pinned if the selected identifier is a provider-managed alias. This is compatibility work within the approved selection behaviour, not permission for app-side silent fallback.
- Provide write-only API-key entry and replace/remove actions. Never return the full stored key to the browser after entry; use it server-side only after account authorisation. Removing it prevents future requests but leaves saved work readable. Do not promise cancellation of a request already accepted by the provider.
- The user permits temporary plaintext database storage for the owner-only pilot. Isolate credential access from general account-content reads and exclude the key from browser storage, prompts, exports, error bodies and logs. Platform encryption at rest is not application-level recoverable-secret encryption. This exception is not secure-secret-storage approval for other users.
- Preserve the explicitly deferred long-term credential decision. Revisit encryption/key management and trust before admitting other real users; do not block the agreed owner pilot solely to reopen that decision or quietly extend the exception to multiple learners.
- OpenAI usage is billed to the account behind the key, separately from infrastructure and ChatGPT subscriptions. Limit request size/output and run AI only in initiated workflows and associated proposals. No scheduled practice generation, idle analysis or automatic whole-history reprocessing. No guaranteed monthly spending cap.
- When input/provider limits prevent a requested operation, expose the limitation rather than silently claiming a complete review of content that was not processed. Exact limits are implementation verification, not a promise that arbitrary document/history size fits every model.
- Keep application logs operational: request identifiers, statuses, timing, model and usage metadata as needed. Do not deliberately log raw prompts/messages, document contents, bios, keys or login codes. Sanitise provider errors before logging/display. No separate product-analytics service. Provider access/retention practices are not controlled solely by this logging policy.

## Testing Decisions

### Approved seam and test quality

- The user explicitly approved testing the running application's public boundary as the primary seam. Prefer browser workflows and public application/data requests over tests of React state, component internals, reducer structure or database table implementation details.
- Use real test persistence, authentication and private storage behaviour. Use controlled substitutes for OpenAI and email in automated runs, with synthetic data/keys. Substitute external effects at their outgoing boundaries rather than mocking internal domain helpers throughout the application.
- Direct unauthorised/cross-account requests complement browser tests: UI hiding does not prove authorisation. Exercise public data/storage interfaces where applicable, not only server routes that might mask permissive underlying policies.
- Good tests assert observable outcomes, eligible context and privacy invariants: what persists, what is visible, what a caller can access, which authorised material leaves the app, and what future behaviour changes. Do not assert exact live-model wording, a scripted fixed question sequence, a particular component tree or a hard three-question rule.
- Test the production behaviour, not a shipped demo bypass. Keep controlled provider behaviour confined to test environments; the production build must not expose test authentication or provider substitution controls to learners.
- All tooling, test servers, checks and browser automation run inside Docker. Use production-build validation as well as development checks.

### Behaviour coverage

- **Access and privacy:** provisioned-account OTP flow, resend/error handling with controlled delivery, no public account creation, anonymous denial, cross-account read/write/identifier attacks, private-image denial, and server-only credential access. Synthetic test accounts are security fixtures, not permission to launch to additional users.
- **Documents:** create/edit/order/delete-and-undo blocks; assembled Markdown; search/status filters; Draft save without approval; immutable approved content during Draft revisions; unsaved-edit approval guard; atomic snapshot approval/update; explicit AI proposal scope and approval; stale save/proposal rejection with attempted text preserved.
- **Context isolation:** capture outgoing provider requests and prove exclusion of Drafts, Reference notes, another Subject/account, unreviewed conclusions as durable judgments, non-opted-in bio, images and secrets. Include adversarial instructions inside authored content to verify that content cannot grant itself approval or wider access. Explicit authoring assistance is tested separately from practice so its permitted Draft/note scope is not falsely forbidden.
- **Continuity:** reload/logout and two-session recovery of server-saved data; conversation identity when resumed; assessment state; per-thread local unsent recovery and its device-only label; logout clearing; streaming interruption; incomplete replies; idempotent save/retry; explicit potentially charged retry; no duplicate accepted observations.
- **Adaptive assessment:** natural-language topic/difficulty/time constraints, per-question difficulty when unspecified, variable activity length, hints, skips, meaningful recap offers, soft budget expiry/return and continued conversation without a Finish gate. Use a controllable clock for timing scenarios rather than long real waits.
- **Subject understanding:** tentative versus reviewed display, accepted/corrected/dismissed proposals, incremental coverage, qualified assistance/difficulty context, inspected source provenance, correction/removal/reset, no automatic reconstruction of removed observations and stale application after another session's reset.
- **Deletion:** individual/group/all Subject/all account scope including unloaded records; typed account-wide confirmation; retained reviewed observations without retained transcript; removal of pending/tentative contributions; local-draft clearing; document deletion with continued conversations but no future source selection; exact-name Subject cascade including previously retained observations; preservation of other account-level content. Exercise delayed AI completion during deletion/reset so work cannot resurrect removed state.
- **Profile and Reference notes:** durable explicit saves/cancel, private image validation/access, opted-in bio inclusion and subsequent exclusion when disabled, display-only picture, explicit Reference-note assistance with approved apply/discard and no learning-evidence leakage.
- **Failure visibility:** provider/key/model unavailability, quota/network failures, save rejection and request limits must not claim success, silently substitute models, approve material, expose raw secrets or trigger hidden background retry spending.
- **Responsive and accessible interaction:** desktop and narrow-phone layouts, keyboard/focus/tab semantics, touch-visible actions, large Markdown dialogs, pinned composer/scroll behaviour, visible status/errors and no horizontal overflow that blocks core use. Prior prototype widths of 320, 390 and 1440 pixels are useful regression references, not a substitute for a real phone.

### Prior art and release evidence

- The repository currently has prototype flows and lint/type/build commands but no committed automated production test suite. Prior Docker-run temporary browser walkthroughs cover the original login/document/source-isolation flow and the later trail/map/assessment flow; reuse their scenarios, not their assumption of in-memory persistence or scripted evaluation. Add the smallest permanent harness around the approved public seam.
- The responsibilities exercised are account access, document approval/source selection, Reference-note assistance, conversation/assessment continuity, recap review/Subject understanding, deletion and AI credential use. Do not require a separate low-level test seam per responsibility when the public boundary can prove the behaviour.
- Before release, run the real deployed phone flow: receive an actual email code, save/approve a document, practise with the selected real OpenAI model, review a recap, leave, and return with work intact. Verify cross-device continuity in a separate session as well.
- Recheck free-plan eligibility/limits, sender/domain setup and inbox delivery, runtime/deployment compatibility, selected model behaviour and preferred region feasibility. Automated substitutes do not prove these integrations or real AI teaching quality. Inspect the real recap's uncertainty, source grounding and hint qualification rather than calling successful generation proof of correctness.
- Privacy failures, loss of saved work and broken core flows block release. Nonblocking polish or deferred conveniences do not need to expand scope. No backup/restore tests are required because that feature was explicitly excluded.

## Out of Scope

- Public signup, real multi-user launch, shared content/workspaces, billing, owner-funded AI and an in-app account-administration dashboard. Later owner-provisioned users require revisiting the plaintext-key exception first.
- Providers other than OpenAI, arbitrary custom endpoints, and blanket support for every model identifier.
- Final long-term API-key encryption/key-management/trust design. Deferral is not a claim that plaintext is secure.
- Paid infrastructure, automatic paid upgrades or purchases. This spec does not itself authorise provisioning, deployment or secret collection.
- Account backups, backup export/restore, backup commands, scheduled backups and application-provided disaster recovery. Recovery after live-data damage/loss may be impossible. Ordinary document Markdown copy/download remains in scope.
- Full offline editing, offline AI, guaranteed cross-device recovery of unsent device-only text, automatic concurrent merging and guaranteed persistence of unsaved document edits after browser termination.
- Mandatory conversation Start/Finish ceremonies, a separate Learning profile management workspace, a separate quiz product or a fixed three-question assessment rule.
- Mastery scores, calibrated psychometric difficulty, inferred certainty from one answer, sophisticated long-term learning modelling, spaced-repetition scheduling and a graph-engine project. The minimal reviewed Subject-understanding record and connected-concepts UI are in scope.
- Voice interaction, MCP/tutor integration, automatic tutor-summary import, curriculum ingestion, general research/browsing tools, and broad new import/organisation workflows not established by the accepted prototype and interview.
- Autonomous document/note/profile rewrites, automatic approval, automatic promotion of unreviewed interpretations, scheduled AI analysis and automatic whole-history reprocessing.
- First-version trash/restore for deleted conversations; exact erasure guarantees for provider retention or copies outside live app data.
- Strict EU-only processing, guaranteed uptime, zero provider retention, guaranteed monthly AI spending caps and paid-plan recovery promises.
- Product analytics, a notification/reminder system and rebuilding every prototype variation as production UI.

## Further Notes

### Authority and primary sources

- This spec synthesises the confirmed [production planning discussion](planning.md), the root [domain glossary](../../GLOSSARY.md), and [ADR-0001](../../docs/adr/0001-free-tier-managed-pilot.md). The user's confirmation of the testing seam is part of this spec's basis.
- The accepted runnable design source is branch **`prototype/main-workflow`**, including Subject-understanding merge **`09d31d9`**. The original companion prototype remains available at **`51db7f8`**; detour source **`prototype/subject-learning-profile`** ends at **`d22800b`**. Later branch commits may update agent instructions; do not describe the branch as frozen at the original prototype.
- [Prototype feedback and walkthrough](learning-profile-prototype.md) records the rejected separate-workspace version and preferred seamless B direction. Its historical fixed question counts, two-source/two-Subject restrictions, fixed concept positions, synthetic history and scripted outcomes are not production requirements. Later confirmed planning rounds settle policies previously marked open in that artifact.
- [Earlier workflow exploration](../main-workflow/map.md) is supporting context only. Older references to shared Reference notes, prototype logout reset, a mandatory Finish step, candidate-only architecture or unresolved prototype ticket statuses do not override later decisions. The original project idea is not the first-release specification.

### Verification and transition

- Existing [managed-stack research](research/vercel-supabase-feasibility.md) and [email/OpenAI research](research/free-email-and-openai.md) are evidence, not current-limit guarantees. Verify changing facts when implementing/configuring; do not invent exact model IDs, production-runtime support, OTP limits, plan quotas or region availability in advance.
- Select concrete supported model/API configuration and document alias handling through compatibility work. Respect the accepted model-selection/no-silent-fallback rules; this is not another product interview prerequisite.
- The first useful vertical milestone is provisioned-owner login → durable Learning Document → explicit Practice approval → real conversation/assessment → reviewed observation → successful return with data intact. The full release still includes the remaining user stories and privacy/deletion/conflict gates.
- This is a local issue-tracker spec with `ready-for-agent` status, not an implementation commit or permission to execute every operational step immediately. Ticket breakdown, implementation and any provisioning proceed only under subsequent user instructions. No secrets belong in the spec, tickets, logs or repository.
