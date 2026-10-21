# Subject knowledge base — Learning Trail iteration

Status: v1 rejected; user prefers **B (connected concepts)** in v2. V3 restores proposed open threads and quick assessment. Assessment behaviour and automatic update timing still await reaction. Not a production implementation or spec.

## Primary source

- Branch: `prototype/subject-learning-profile`, based on planning checkpoint `3da2541`.
- Rejected v1 is preserved at commit `f821379` on this branch.
- Frozen UI reference `prototype/main-workflow` at `51db7f8` is unchanged.
- Main artifact: `app/learning-profile.prototype.tsx`, inside the existing Subject shell.
- Original main-workflow study: `?study=workflow&variant=B` (original simulated login).
- The detour opens directly without credentials. This is a design-study affordance, not real authentication.

## Live feedback on v1

The user rejected **all three v1 layouts** as too disjointed. They expected:

- Just **Learning Trail**, not a separate Learning profile workspace.
- Talking immediately registers a conversation; no separate Start action.
- Past conversations are visible and can be continued.
- Conversations plus recaps affect the Subject knowledge base.
- Some visual representation of the knowledge base; the user is not yet sure what that should be.

This validates the requested interaction direction, **not** v1's Finish gate, manual observation-management workflow, provisional name, deletion defaults or first-release scope. No v1 layout won.

## Live feedback on v2 and the v3 addition

The user most likes **B**, but points out that the knowledge-assessment entry points were lost: they want proposed open threads plus a quick-assessment button, and are happy for assessment to happen in the chat window.

V3 keeps B as the default and adds:

- Two suggested open threads in the new-chat view, with reasons derived from approved material and reviewed/unreviewed evidence. Open threads is also reachable beside the composer while a conversation is selected.
- **Quick assessment**, always reachable beside the composer: a scripted three-question check-in, one question at a time, across the three sample concepts. It uses the two approved sample sources in AI engineering or Bread making; other Subjects have ordinary chat but this scripted assessment is disabled.
- The button becomes **Continue assessment** if one is unfinished. Switching away and returning preserves question progress and unsent text in memory; there is still no mandatory Finish action.
- An optional Hint recorded with that answer. Opening a question alone adds no understanding evidence; answering contributes tentative context.
- After three answers, an inline recap is proposed. Accept/correct/dismiss works as in ordinary conversation. A reviewed recap connects to each concept covered by the answers, and explicitly avoids treating hinted reasoning as independent evidence.
- The question counter shows activity progress, not knowledge level. Interpretation remains scripted, not real answer evaluation; no scores.

## Run v3

```sh
bash scripts/learning-profile.prototype.sh
```

Open **http://localhost:3001/?variant=B**. All Node commands, dependencies and the server run inside Docker. Port 3000's original server is not replaced.

**B is the user's preferred representation.** The conversation shell is identical across variants. Only the knowledge-base representation changes:

- `?variant=A` — **Topic landscape**: equal-status areas with individual conversation dots; no progress bars or mastery levels.
- `?variant=B` — **Connected concepts**: related Subject ideas with reviewed/tentative/unexplored markers. Links denote conceptual relatedness, not proven ability.
- `?variant=C` — **Evidence trail**: chronological exchanges and recaps, with direct routes back to the conversation.

Use the floating bottom arrows, or the view buttons inside Explore understanding. Layout switches and Subject switches retain in-memory conversations. Reload resets them.

## Try v2

1. Open Learning Trail. Type immediately or insert the study-material example and send it. The first sent message creates a conversation in the history.
2. Send another message. A small scripted recap appears inline after two learner turns; you can also request one earlier. No Finish or Pause step.
3. Accept, correct or dismiss the recap inside the conversation. Keep talking in the same thread afterward.
4. Select a seeded past conversation (Conversations button on mobile) and continue it. Its identity/history remains; it is not copied into a new thread.
5. Start a new thread, then return to the older one. Unsent text stays with its thread in memory.
6. Explore understanding from the compact visual beside the trail, or its mobile entry point. Choose an idea, inspect reviewed recaps versus tentative conversation quotes, and jump back to continue an originating conversation.
7. Compare the three visual forms without resetting the conversation or reopening the modal.
8. Switch to Bread making for another synthetic scenario. Mathematics starts with no evidence or approved sources; chatting there does not enable a scripted learning recap.
9. Expand Prototype assumptions & current state to inspect conversation IDs, drafts, recaps, proposals, evidence and approved source IDs.

## Provisional interpretation rules

Conversation contributions appear immediately as **tentative direct quotes**, not inferred mastery. Reviewed recaps form the correctable interpretation used as context for later practice. An unreviewed recap does not replace a reviewed one or guide practice. New discussion after a reviewed recap is identified as newer unreviewed context.

This conservatively preserves the prior reviewed-recap boundary while making the conversation's existence visible in the knowledge-base view. It does **not** settle whether/how automatic conversation analysis should update durable understanding. The user's request that conversations plus recaps affect the record still needs reaction to this concrete version.

## Boundaries and shortcuts

- Scripted replies, recap observations and topic routing only. Arbitrary typed answers/corrections are not semantically evaluated. Seeded history is fictional.
- Sources provide content; authored or approved material is not evidence of understanding. Drafts, Reference notes and Personal profile remain excluded.
- No mastery score, graph engine, scheduler, real AI/authentication/backend, persistence or production provisioning.
- No separate Learning profile tab, Start, Pause, Finish or Apply-observation workflow.
- No deletion controls in v2: retention/deletion policies remain open, not implicitly settled by their omission. Confirmed individual/group/all production deletion requirements remain.
- Conversations remain Subject-scoped, never children of a document.

## Validation

Docker-run TypeScript and ESLint checks pass. A temporary browser smoke walkthrough (not added as a test suite) exercised first-message creation, continued past history, automatically offered inline recap, recap acceptance, switching knowledge visualisations without closing/resetting the modal, and mobile conversation selection. No browser runtime errors or mobile horizontal overflow were observed. Desktop and mobile screenshots were inspected. V3's temporary browser smoke also covered suggested-thread entry, three-question assessment, hint tracking, no evidence from simply opening an assessment, continuation after switching away, correction of the resulting recap, and reviewed evidence appearing across the connected concepts.

## Return to planning

B (connected concepts) is the preferred visual direction. Get reactions to the restored open threads, quick-assessment entry and question/recap flow. Resolve automatic update timing, scope/name and deletion separately. Do not treat assessment defaults or evidence semantics as accepted merely because the requested entry points were restored.
