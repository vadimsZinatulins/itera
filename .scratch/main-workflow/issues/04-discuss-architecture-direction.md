# Is Vercel plus Supabase a suitable architecture direction for this experience?

Labels: wayfinder:grilling
Type: grilling
Status: open
Blocked by: 01, 02, 03, 05, 06, 07, 08

Also revisit after [Does a rendered-first block editor make Learning Documents natural to write and revisit?](05-learning-documents.md), so document ownership and editing needs inform the discussion.

Also revisit after [Do drafts, approved practice versions, and discreet Subjects make study boundaries clear?](06-drafts-and-subjects.md), including durable draft storage and isolation of working drafts from approved practice sources.

Also revisit guarded Subject deletion and [Do two-step login and an optional personal profile fit the companion?](08-login-and-personal-profile.md): pre-approved account provisioning, email OTP delivery, server-side authorisation, private profile/image storage, and the boundaries of bio personalisation are production concerns, not implemented by the browser simulation.

## Question

Once the practice and reference-note interactions have been explored, should Vercel plus Supabase remain the preferred production architecture direction, or is there a concrete reason to pursue another approach?

Revisit after [Which main workflow makes a ten-minute practice session feel natural?](01-compare-main-workflows.md), [How can commute practice minimise typing without doing the reasoning for the learner?](02-reduce-mobile-typing.md), and [How should reference notes stay immediately accessible and user-controlled?](03-reference-notes-and-ai-suggestions.md).

Discuss the needs actually revealed by the prototypes: tutor integration, separation of reference notes from learning evidence, user-approved note changes, mobile use, and any discovered continuity requirements. Distinguish known needs from assumptions. This is a direction-setting discussion, not infrastructure provisioning or a production implementation plan.

Consult grilling and domain-modeling. Any external facts needed to compare options must be verified through separately scoped research rather than assumed. Vercel plus Supabase is the user’s current inclination, not a settled choice.
