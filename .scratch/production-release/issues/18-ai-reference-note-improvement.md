# 18: Improve Reference notes with explicitly approved AI changes

**What to build:** Let the learner ask AI to improve a selected Reference note, inspect/edit the proposal and apply or discard it without turning the note or assistance into study evidence.

**Blocked by:** 05 — Configure an OpenAI key and supported model; 17 — Maintain private account-level Reference notes.

**Status:** ready-for-agent

- [ ] Improve opens requested assistance on the selected note, takes the learner's instruction and uses server-side OpenAI with the chosen model/key. No note is sent automatically merely because it was opened.
- [ ] Scope outgoing context to the authorised selected note and request, not the entire collection/account, other Subjects or credentials. Account-owned content cannot instruct the app to widen access.
- [ ] Keep the original unchanged while showing understandable before/after Markdown and an editable proposed result. Apply requires explicit approval; discard leaves the note unchanged.
- [ ] Persist only approved changes to the intended note. If the note changed or disappeared before application, explain the conflict and preserve the proposal rather than silently overwriting or recreating content.
- [ ] Note assistance is not assessment: note content, AI suggestions and the improvement interaction do not contribute to Practice versions, challenge generation or Subject understanding.
- [ ] Missing/unavailable model/key, interrupted generation and input limits produce safe honest status without hidden charged retries, silent fallback or a false complete-review claim.
- [ ] Public-boundary tests capture controlled outgoing context and cover proposal edit/apply/discard, unchanged originals before approval, persistence, conflicts, cross-account denial and absence of learning-evidence leakage.
- [ ] No autonomous note rewrites, external research product, scheduled analysis or new provider integration is included.
