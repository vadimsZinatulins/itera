# Find the learning companion’s main workflow

Labels: wayfinder:map

## Destination

Find a mobile-friendly main workflow and look-and-feel the user wants to pursue, through throwaway clickable prototypes. The result is a direction for the product, not a production implementation or implementation-ready specification.

## Notes

- Planning effort. PROJECT.md is a source of hypotheses, not definitive requirements. Do not implement the product as part of this map.
- Consult the prototype skill for prototype tickets; consult grilling and domain-modeling for conversation tickets. Read GLOSSARY.md for vocabulary.
- Initial scenario: ten minutes on a train to practise recent learning. AI learning supplies the examples, but the product is not exclusive to AI or one curriculum.
- Compare challenge-first, learning-trail, and conversation-first experiences using the same sample history. All prototypes must work on mobile.
- Prototype the loop: open → accept or choose a challenge → reason through a conversation → inspect and correct the app’s interpretation. Use in-memory sample data and simulated AI; no real tutor integration or backend needed.
- Initial hypothesis to test: suggest one challenge with a short reason and a “Something else” alternative. Include a sample tutor-session summary and uncertain, correctable learning interpretations.
- Reference notes have their own section and must be easy to reach, without mixing them into learning activities. They are for lookup and reuse, never challenge generation or assessment.
- AI must not autonomously modify reference notes. Explore an explicit “Improve with AI” entry point (provisional wording), a cleanup conversation, a before/after preview, and user approval before applying changes. Sidebar on larger screens; full-screen conversation is a mobile option.
- Avoid “Help” in action labels; the user dislikes its connotation. Alternatives offered by the user: “Clean up suggestions”, “Improve with AI”, “Clean up with AI”.
- Commute interaction must support typing and must not depend on voice. Mobile typing is particularly uncomfortable for the user. Explore ways to reduce typing without substituting canned answers for the learner’s reasoning; include Hint, Explain it, and Finish here.
- Vercel + Supabase is a candidate, not a decision. Revisit architecture after exploring the experience; do not let it constrain throwaway prototypes.
- These are starting constraints and prototype hypotheses confirmed during charting, not resolved decision tickets. No prototype verdict has yet been reached.

## Decisions so far

<!-- Add a gist and named link only when a decision ticket is resolved. -->

## Not yet specified

- How the preferred experiences combine into a coherent visual and navigation direction; revisit after reacting to concrete variants.
- How the wider learning history, return to older topics, and corrections should feel beyond the short first session.
- Whether saving and resuming interrupted sessions or offline use is needed, and what that should mean; revisit after exploring the commute interaction.
- What production integration, data boundaries, and implementation planning will require once the experience and architectural direction are clearer.

## Out of scope

- Building or deploying the production app, live AI, real MCP integration, or a production database. This map finds the direction rather than executes it.
- Writing an implementation-ready specification in this effort.
- Using reference notes as learning material or assessment evidence.
- Voice interaction in the commute prototype.
