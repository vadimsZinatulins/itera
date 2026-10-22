# 07: Practise using approved Subject material

**What to build:** Let a conversation ask useful practice questions using relevant approved Practice versions in the current Subject, with inspectable source provenance and strict context boundaries.

**Blocked by:** 04 — Explicitly approve and update Practice versions; 06 — Start and resume durable AI conversations.

**Status:** implemented — awaiting owner manual acceptance

**Implementation:** `feat/07-approved-source-practice`. Opt-in practice shares durable conversations, uses trusted approved-snapshot selection and persists per-reply source identity/version provenance. See [`docs/conversations.md`](../../../docs/conversations.md#approved-source-practice) for selection policy, limits and migration instructions. Docker typecheck, lint, production build and the full public-boundary suite passed (33/33 tests). Controlled outgoing provider streams verified scoped multi-document snapshots, adversarial-content boundaries, foreign source-ID denial, Draft exclusion, historical/current revision provenance, reload/hint continuation and empty/oversized source failures. Existing tests cover key/model/provider failures and anonymous/direct-data denial; the service-only context RPC has explicit anonymous/foreign denial coverage. No deployment or live charged provider request performed.

## Manual acceptance

1. Apply migration `202603010007_practice_context.sql` after 006 without resetting data (`bash scripts/migrate.sh`).
2. Approve two Learning Documents in one Subject; save a different Draft revision of one. In a new thread enable **Use approved sources**, request a connecting practice question, and inspect the source titles/revisions. This real provider request may incur charges.
3. Ask for a hint/explanation, verify assistance is qualified rather than independent performance, reload and continue the same thread. Update a Practice version; the next reply should show its new revision while older provenance stays unchanged.
4. Try an empty Subject with practice enabled, then switch practice off for goals/organisation chat. Verify no invented source-based syllabus, clear authoring/approval guidance and honest missing-key/provider/size-limit outcomes.
5. Check source disclosure, mode control, pinned composer and Threads/Chat on a real phone. Automated controlled output does not establish live teaching quality or model resistance to every source injection.

- [x] A learner can request practice in an existing or new conversation and receive a real provider-backed question grounded in relevant current eligible material. Multiple approved Learning Documents may contribute; the conversation is not owned by one document.
- [x] Display understandable approved-source provenance. Draft-only documents and Draft revisions do not replace approved content or become practice inputs.
- [x] Build and validate context at the trusted boundary for the authenticated account/current Subject. Never automatically retrieve Reference notes, another Subject/account, secrets or profile images.
- [x] Material content, including adversarial instructions, cannot grant itself approval, alter ownership or request wider account access. A client-supplied source ID is not proof of eligibility.
- [x] With no approved sources, explain the limitation and route the learner toward authoring/approval while keeping ordinary goals/organisation chat available. Do not invent an assessment syllabus or infer understanding from approved/authored content.
- [x] Support an explanation or hint within the conversation without presenting assisted reasoning as independent performance. Structured assessment and reviewed understanding are subsequent slices.
- [x] Missing key/model, provider limits and overlarge context produce honest errors/limitations, not silent model fallback or false claims to have processed omitted content.
- [x] Public-boundary tests capture controlled outgoing provider requests to verify approved-only, multi-document, account/Subject-scoped selection; approved snapshots remain unchanged by Draft saves.
- [x] Exercise foreign source IDs, adversarial source text, empty sources, save/reload and source-version provenance with real test persistence. Extend leakage tests when later account-content features land.
