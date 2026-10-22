# 02: Create and switch private Subjects

**What to build:** Let the learner create durable Subjects and switch between separate study areas through a discreet picker, including a useful initial empty state.

**Blocked by:** 01 — Owner sign-in to the production application.

**Status:** closed — implemented and manually accepted

**Evidence:** `feat/private-subjects`, commits `dc72235` and `591361e`; Docker typecheck/lint, production build and all 13 public-boundary tests passed. Independent Standards review passed; Spec review's public-data whitespace-validation finding fixed with a red/green regression. Owner completed the manual checklist and confirmed all works. Local development migration applied without resetting existing data.

**Scope note:** Switching selects a URL-backed Subject context without destructive writes. Saved Learning Documents and conversation continuity depend on their later implementation tickets; neither exists in the current production baseline.

- [x] Create a Subject with a nonblank trimmed name; reject case-insensitive duplicates within the same account with useful feedback. Do not impose global name uniqueness across accounts.
- [x] Newly created Subjects and their names survive reload, logout/login and a second authenticated browser session.
- [x] Switching Subjects changes the active study context without ending conversations or resetting saved work. Place switching/creation in the agreed secondary picker rather than dominating the interface.
- [x] The no-Subjects and empty-Subject states explain how to begin adding study material. Do not ship fictional Subjects/history as the owner's real content.
- [x] Each Subject belongs to the authenticated account; enforce this through public application/data access, not client-side filtering alone.
- [x] Public-boundary tests cover creation, validation, switching, two-session continuity and foreign-account identifier/read/write attempts against real test persistence.
- [x] Do not add Subject renaming, moving material, sharing or destructive actions as hidden scope. Guarded Subject deletion is delivered by ticket 23.
