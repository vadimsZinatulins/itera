# Subject understanding record — runnable design detour

Status: built for reaction; **no user-validated findings yet**. Not a production implementation or spec.

## Primary source

- Branch: `prototype/subject-learning-profile`, based on planning checkpoint `3da2541`.
- Frozen UI reference `prototype/main-workflow` at `51db7f8` is unchanged.
- Main artifact: `app/learning-profile.prototype.tsx`, mounted in the existing Subject shell.
- Planning frontier: [Round 6 and unanswered Q22/Q23](planning.md#round-6--document-coupling-rejected-understanding-layer-proposed).
- The original main-workflow layout study remains reachable with `?study=workflow&variant=B` (its simulated login still applies). The learning-profile detour opens directly without credentials; this bypass is only a design-study affordance.

## Run

From the repo root:

```sh
bash scripts/learning-profile.prototype.sh
```

Open **http://localhost:3001/?variant=B**. All Node commands, dependencies and the server run inside Docker. The existing server on port 3000 is not replaced.

- `?variant=A` — Record first: retained understanding leads, exchange sits alongside.
- `?variant=B` — Conversation + review: exchange and proposed/current record side by side.
- `?variant=C` — Learning trail: a sequential source → exchange → review → retained-record story.
- Floating bottom arrows or keyboard left/right switch layouts. Input, textareas and component navigation keep their own arrow behaviour.
- Layout changes retain in-memory state. Subject switching retains each Subject’s state. Reload/logout resets the demo; this is not production recovery behaviour.

## Try this

1. Start in AI engineering, or switch to Bread making. Each has two synthetic approved sources and a fictional earlier reviewed observation. Mathematics starts without sources or observations.
2. Open Study material to inspect both approved sources. Drafts, Reference notes and Personal profile are excluded.
3. Start a short conversation. Type reasoning, or insert the clearly labelled example answer and send it. Replies and proposed interpretations are scripted, **not analysis of typed answers**.
4. Pause: under the default policy there is no proposal and no retained-record change. Resume, then Finish: completion exposes a proposal but does not apply it.
5. Compare current and proposed understanding. Correct wording, apply it, or dismiss it. Inspect the retained record and preview later practice. Retained observations can also be corrected, marked uncertain or removed independently.
6. Delete the conversation using the disclosed confirmation. Default experiment: reviewed observations survive with a transcript-unavailable label; pending proposals do not.
7. Reset scenario, select the alternate deletion policy in Policy lab, repeat, then delete. This time only observations derived from that conversation disappear. Earlier observations and documents remain.
8. Optionally compare proposal-on-Pause with proposal-only-on-Finish. Both still require explicit application. Defaults are hypotheses, not approvals.
9. Expand full relevant state to inspect the exact record, transcript, policies, proposal and eligible/used source IDs.

## Boundaries and deliberate shortcuts

- Proposed name “Learning profile” remains tentative, distinct from Personal profile.
- No mastery scores, automatic understanding claims, graph, scheduler, real AI, authentication, storage, services or persistence.
- Source provenance does not imply document ownership of a conversation or document-coupled cascades.
- This is one exchange at a time, not a prototype of bulk conversation selection/deletion. Confirmed production bulk-deletion requirements are not withdrawn.
- Later practice uses a small scripted branch based on retained observations and approved sources; arbitrary correction text is passed visibly as context, not semantically evaluated.
- This comparison does not settle deletion/privacy/export, evidence retention, completion, first-release scope or timing policies.

## Return to planning after live reaction

Record which layout/elements the user prefers; whether this layer belongs in the first release; its name; the meaning of completion; when proposals appear; whether applying is independent; what deletion should retain; and whether correction/uncertainty controls feel sufficient. Bring those reactions back to `planning.md` before production specification. Do not infer approval from use of demo defaults.
