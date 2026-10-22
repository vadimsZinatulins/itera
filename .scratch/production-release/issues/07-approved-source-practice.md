# 07: Practise using approved Subject material

**What to build:** Let a conversation ask useful practice questions using relevant approved Practice versions in the current Subject, with inspectable source provenance and strict context boundaries.

**Blocked by:** 04 — Explicitly approve and update Practice versions; 06 — Start and resume durable AI conversations.

**Status:** ready-for-agent

- [ ] A learner can request practice in an existing or new conversation and receive a real provider-backed question grounded in relevant current eligible material. Multiple approved Learning Documents may contribute; the conversation is not owned by one document.
- [ ] Display understandable approved-source provenance. Draft-only documents and Draft revisions do not replace approved content or become practice inputs.
- [ ] Build and validate context at the trusted boundary for the authenticated account/current Subject. Never automatically retrieve Reference notes, another Subject/account, secrets or profile images.
- [ ] Material content, including adversarial instructions, cannot grant itself approval, alter ownership or request wider account access. A client-supplied source ID is not proof of eligibility.
- [ ] With no approved sources, explain the limitation and route the learner toward authoring/approval while keeping ordinary goals/organisation chat available. Do not invent an assessment syllabus or infer understanding from approved/authored content.
- [ ] Support an explanation or hint within the conversation without presenting assisted reasoning as independent performance. Structured assessment and reviewed understanding are subsequent slices.
- [ ] Missing key/model, provider limits and overlarge context produce honest errors/limitations, not silent model fallback or false claims to have processed omitted content.
- [ ] Public-boundary tests capture controlled outgoing provider requests to verify approved-only, multi-document, account/Subject-scoped selection; approved snapshots remain unchanged by Draft saves.
- [ ] Exercise foreign source IDs, adversarial source text, empty sources, save/reload and source-version provenance with real test persistence. Extend leakage tests when later account-content features land.
