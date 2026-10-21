# 21: Manage a private display-only profile picture

**What to build:** Let the learner preview, save, replace or remove an optional private profile image that is available across devices but never sent to AI.

**Blocked by:** 20 — Save a Personal profile and opt into bio framing.

**Status:** ready-for-agent

- [ ] Integrate image selection/preview and removal with the Personal profile's explicit Save/Cancel interaction. Cancelling does not publish a changed image or lose the saved one.
- [ ] Accept valid PNG/JPEG/WebP images up to the accepted 3-MB limit, validating actual allowed uploads and size at a trusted boundary rather than relying solely on browser MIME/accept hints.
- [ ] Store image data privately with account-scoped references/access. Anonymous/foreign-account requests, including direct public storage requests, cannot read or replace it.
- [ ] Saved/replaced/removed images render correctly after reload, logout/login and another session. A failed upload/save has honest feedback and does not claim the new picture is saved.
- [ ] Profile images remain display-only regardless of bio permission and never enter provider prompts, assessment or Subject-understanding evidence.
- [ ] Keep image content and private access secrets out of deliberate operational logs; do not make the storage collection public to simplify rendering.
- [ ] Public-boundary tests use real test private storage to cover valid/invalid uploads, size rejection, save/cancel, replacement/removal, cross-session display, direct authorisation attempts and outgoing AI-context exclusion.
