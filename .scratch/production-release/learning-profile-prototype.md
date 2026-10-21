# Subject knowledge base — Learning Trail iteration

Status: v1 rejected; v2 built for reaction. **The new visual representations and update timing are not user-validated.** Not a production implementation or spec.

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

## Run v2

```sh
bash scripts/learning-profile.prototype.sh
```

Open **http://localhost:3001/?variant=B**. All Node commands, dependencies and the server run inside Docker. Port 3000's original server is not replaced.

The conversation shell is identical across variants. Only the knowledge-base representation changes:

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

Docker-run TypeScript and ESLint checks pass. A temporary browser smoke walkthrough (not added as a test suite) exercised first-message creation, continued past history, automatically offered inline recap, recap acceptance, switching knowledge visualisations without closing/resetting the modal, and mobile conversation selection. No browser runtime errors or mobile horizontal overflow were observed. Desktop and mobile screenshots were inspected.

## Return to planning

Get reactions to the seamless trail, continued conversations, inline recap behaviour and the three visual representations. Ask which representation (if any) makes understanding legible without overstating evidence. Resolve automatic update timing, scope/name and deletion separately after that reaction. Do not treat the revised prototype as accepted just because it was built.
