# 19: Improve and review Learning Documents with AI

**What to build:** Let the learner request writing improvement or correctness review for a block or whole Learning Document, then inspect/edit and explicitly apply scoped suggestions to the Draft only.

**Blocked by:** 04 — Explicitly approve and update Practice versions; 05 — Configure an OpenAI key and supported model.

**Status:** ready-for-agent

- [ ] Provide block- and document-scoped Improve/Review actions consistent with the rendered-first editor. Resolve outstanding edits before requesting review of a saved target, so the intended input is clear.
- [ ] Explicitly requested authoring assistance may receive the selected Draft content, including a Draft revision. This permission is specific to the request and does not make Drafts eligible for practice or understanding interpretation.
- [ ] Send only authorised target/request context, with bounded server-side OpenAI invocation and the selected supported model. Do not add unrelated account content, Reference notes or secrets automatically.
- [ ] Present findings and understandable before/after suggestions with an editable proposed result and explicit apply/discard. The original is unchanged until approval; apply affects only the intended Draft blocks.
- [ ] Preserve the approved Practice version and its eligibility until a separate explicit Update practice version action. Writing review is never evidence of understanding.
- [ ] Check target identity/revision before application. Reject stale or deleted-target proposals with attempted text preserved, rather than silently overwriting, widening scope or recreating material.
- [ ] Correctness review communicates uncertainty and limitations; unchanged content is not certified correct. Do not fabricate sources or require an unstated browsing/research integration.
- [ ] Failure/interruption/input limits never claim a complete review, leak raw secrets, silently substitute a model or trigger hidden charged retries.
- [ ] Public-boundary tests cover both scopes/review modes, allowed Draft context versus practice exclusion, edited proposal apply/discard, approved-snapshot isolation, stale/deleted targets, real persistence and account denial using controlled provider responses.
