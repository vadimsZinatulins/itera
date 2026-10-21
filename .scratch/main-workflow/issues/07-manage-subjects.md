# Can Subject creation and guarded deletion stay secondary and safe?

Type: prototype
Status: claimed

## Question

Can the learner add Subjects from the discreet picker, while keeping deletion away from routine switching and requiring an exact typed-name confirmation?

## Constraints

- Add subject in the existing dropdown; names must be nonempty and distinguishable.
- No delete icons/actions alongside routine subject choices. Use Manage subjects → subject settings → Danger zone → confirmation.
- Final deletion is disabled until the entered name exactly matches the target Subject. Cancelling/reopening clears confirmation.
- Prototype assumption, visibly disclosed: deletion also removes that Subject’s Learning Documents, Drafts, and approved Practice versions. Other Subjects and shared Reference notes remain untouched.
- Support deleting the active or last Subject without showing stale practice or breaking navigation. Creating a Subject opens its empty workspace.
- In-memory only; no production persistence or live AI. Await live user feedback before resolving.

## Comments

### Interactive prototype ready for reaction

- Added [subject management](../../../app/subjects.prototype.tsx) to the existing picker, backed by mutable in-memory Subjects in [study state](../../../app/study-state.prototype.tsx).
- Add subject accepts a trimmed, nonempty name and rejects case-insensitive duplicates. Creation selects the new empty Subject.
- Manage subjects lists neutral settings links, not delete icons. Each settings screen has a separate Danger zone; Delete this subject opens a further confirmation screen with document/version counts and the deletion scope.
- Final Delete subject is disabled for empty, wrong-case, or extra-space names. Both the form handler and state mutation require an exact match. Cancellation, dismissal, and reopening clear typed confirmation.
- Deleting an inactive Subject leaves the current workspace alone. Deleting the active Subject clears its practice context and selects a remaining Subject; deleting the last Subject shows a recoverable empty state with shared Reference notes still accessible.
- Docker lint/type checks passed. Desktop (1440px) and mobile (320×667) browser walkthroughs verified creation, duplicate/blank validation, confirmation matching, cancellation/dismissal reset, active/inactive/last deletion, removal of subject practice sources, retained shared notes, and creation after all Subjects were removed. No browser runtime errors.
- Deletion cascade semantics remain an explicitly disclosed prototype assumption, not a validated production retention policy. Awaiting live feedback.
