# Find the learning companion’s main workflow

Labels: wayfinder:map

## Destination

Find a mobile-friendly main workflow and look-and-feel the user wants to pursue, through throwaway clickable prototypes. The result is a direction for the product, not a production implementation or implementation-ready specification.

## Notes

- Planning effort. PROJECT.md is a source of hypotheses, not definitive requirements. Do not implement the product as part of this map.
- Run the project and all Node tooling exclusively through Docker using the existing Dockerfile. Never run Node commands directly on the host.
- Consult the prototype skill for prototype tickets; consult grilling and domain-modeling for conversation tickets. Read GLOSSARY.md for vocabulary.
- Initial scenario: ten minutes on a train to practise recent learning. AI learning supplies the examples, but the product is not exclusive to AI or one curriculum.
- Compare challenge-first, learning-trail, and conversation-first experiences using the same sample history. All prototypes must work on mobile. Latest feedback favours learning trail B with C’s chat entry; the combined iteration is awaiting reaction.
- Use the repo’s configured shadcn/ui components and styling, including native top-level Tabs with icons. The latest trail prototype scrolls threads independently while chat stays in view; mobile Threads/Chat tabs are a proposed adaptation awaiting reaction. Reference-note previews should use equal-sized title/subtitle cards opening a large Markdown dialog with Edit and Improve actions at the top.
- Prototype the loop: open → accept or choose a challenge → reason through a conversation → inspect and correct the app’s interpretation. Use in-memory sample data and simulated AI; no real tutor integration or backend needed.
- Initial hypothesis to test: suggest one challenge with a short reason and a “Something else” alternative. Include a sample tutor-session summary and uncertain, correctable learning interpretations.
- Reference notes have their own section and must be easy to reach, without mixing them into learning activities. They are for lookup and reuse, never challenge generation or assessment.
- AI must not autonomously modify reference notes. Explore an explicit “Improve with AI” entry point (provisional wording), a cleanup conversation, a before/after preview, and user approval before applying changes. Sidebar on larger screens; full-screen conversation is a mobile option.
- Avoid “Help” in action labels; the user dislikes its connotation. Alternatives offered by the user: “Clean up suggestions”, “Improve with AI”, “Clean up with AI”.
- Commute interaction must support typing and must not depend on voice. Mobile typing is particularly uncomfortable for the user. Explore ways to reduce typing without substituting canned answers for the learner’s reasoning; include Hint, Explain it, and Finish here.
- Vercel + Supabase is a candidate, not a decision. Revisit architecture after exploring the experience; do not let it constrain throwaway prototypes.
- Learning Documents are distinct from Reference notes. New documents are Drafts excluded from learning; “Ready to Practice” approves an eligible Practice version. Subsequent edits are a Draft revision; only “Update practice version” replaces the previous approved content. Explicit AI assistance remains available on drafts. Approval means encountered material, never demonstrated understanding.
- Subjects scope documents, learning trails, and practice, with infrequent switching behind a discreet dropdown near the app name. Reference notes remain shared and excluded from learning.
- User requests adding Subjects and guarded deletion: deletion must be away from routine actions and require typing the Subject’s name before the final button enables. Prototype uses Add subject in the picker and Manage subjects → subject settings → Danger zone → exact-name confirmation. Deleting associated documents/practice versions is a visibly disclosed prototype assumption awaiting reaction; shared Reference notes and other Subjects are retained.
- Login is an email → simulated OTP flow for the single pre-approved demo email, vadimz2@hotmail.com, with no signup. Real email delivery, account provisioning, and server authentication remain deferred.
- The Personal profile has an optional picture, name, and open-ended bio. Bio personalisation is explicitly toggleable; relevant interests may frame examples and stated goals may guide small suggestions, never override current requests or count as study material/mastery evidence. The companion must never rewrite the bio autonomously. The prototype demonstrates a few disclosed scripted matches rather than interpreting arbitrary biographies.
- The prototype remains in-memory. Returning to drafts across reloads, days, or devices is a production persistence requirement, not implemented by the demo.
- Learning Documents use rendered-first Markdown blocks. Hover/focus actions on desktop, explicit actions on touch, double-click to edit, and Save or Ctrl/Command+Enter to return to rendered mode. Explore AI improvement and correctness review at block and document scope, always requiring approval. Block insertion is available at separators before/between blocks: hover/focus reveal on desktop, faint always-visible touch targets on mobile (proposed, awaiting reaction).
- These are starting constraints and prototype hypotheses, not closed decision tickets. Prototype verdicts are recorded only on ticket resolution.

## Decisions so far

<!-- Add a gist and named link only when a decision ticket is resolved. -->

## Not yet specified

- How navigation and document access fit together as the experience grows beyond the promising trail-plus-chat direction.
- How the wider learning history, return to older topics, and corrections should feel beyond the short first session.
- How tutor-provided detailed summaries should become Learning Documents, including what processing and learner review are appropriate. Manual authoring is explored first; conversion is not yet decided.
- Whether saving and resuming interrupted sessions or offline use is needed, and what that should mean; revisit after exploring the commute interaction.
- What production integration, data boundaries, and implementation planning will require once the experience and architectural direction are clearer, especially durable drafts, approved-version storage, login/account provisioning, and profile privacy across sessions/devices.
- How open-ended bio context should be interpreted and made transparent with live AI, including how relevant hints differ from unsolicited steering. See [Do two-step login and an optional personal profile fit the companion?](issues/08-login-and-personal-profile.md).
- What Subject reorganisation is needed beyond creation and guarded deletion, including renaming and moving documents. Creation and deletion are being explored in [Can Subject creation and guarded deletion stay secondary and safe?](issues/07-manage-subjects.md).

## Out of scope

- Building or deploying the production app, live AI, real MCP integration, or a production database. This map finds the direction rather than executes it.
- Writing an implementation-ready specification in this effort.
- Using reference notes as learning material or assessment evidence.
- Voice interaction in the commute prototype.
