# 02: Create and switch private Subjects

**What to build:** Let the learner create durable Subjects and switch between separate study areas through a discreet picker, including a useful initial empty state.

**Blocked by:** 01 — Owner sign-in to the production application.

**Status:** ready-for-agent

- [ ] Create a Subject with a nonblank trimmed name; reject case-insensitive duplicates within the same account with useful feedback. Do not impose global name uniqueness across accounts.
- [ ] Newly created Subjects and their names survive reload, logout/login and a second authenticated browser session.
- [ ] Switching Subjects changes the active study context without ending conversations or resetting saved work. Place switching/creation in the agreed secondary picker rather than dominating the interface.
- [ ] The no-Subjects and empty-Subject states explain how to begin adding study material. Do not ship fictional Subjects/history as the owner's real content.
- [ ] Each Subject belongs to the authenticated account; enforce this through public application/data access, not client-side filtering alone.
- [ ] Public-boundary tests cover creation, validation, switching, two-session continuity and foreign-account identifier/read/write attempts against real test persistence.
- [ ] Do not add Subject renaming, moving material, sharing or destructive actions as hidden scope. Guarded Subject deletion is delivered by ticket 23.
