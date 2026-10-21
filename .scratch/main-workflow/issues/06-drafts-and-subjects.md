# Do drafts, approved practice versions, and discreet Subjects make study boundaries clear?

Labels: wayfinder:prototype
Type: prototype
Status: claimed
Assignee: current developer (via assistant)
Blocked by: none

## Question

Prototype the confirmed document lifecycle and subject boundaries in the existing throwaway UI. New Learning Documents start as drafts. Saving never makes them eligible for learning. The explicit first-approval action is “Ready to Practice”. Edits after approval are a draft revision; the last approved practice version remains the only eligible content until “Update practice version”. Drafts can receive AI assistance explicitly requested by the user, but never feed challenges or learning-profile interpretations.

Use Subjects as a discreet header dropdown, not primary navigation. Scope documents, trail, and practice to the active subject. Reference notes remain shared and excluded from learning. Demonstrate eligibility with actual in-memory approved snapshots and subject-filtered practice-source selection, not labels alone. Durable cross-session storage is not implemented in this prototype and must be clearly distinguished from demo retention.

Consult prototype and domain-modeling. Use shadcn/ui. Resolve only through live user feedback. Tutor conversion, subject management beyond the picker, and production persistence remain open for later decisions.

## Comments

### Interactive prototype ready for reaction

- [Study state and approved-source selection](../../../app/study-state.prototype.tsx), [document editor/library](../../../app/learning-documents.prototype.tsx), and [subject picker/trail/practice](../../../app/main-workflow.prototype.tsx).
- Library badges and filters distinguish Draft, Draft revision, and Available for practice. Save as Draft never changes eligibility. Ready to Practice takes a separate content snapshot; Update practice version explicitly replaces it. View practice version shows what study can actually see.
- Practice-source selection consumes only approved snapshots filtered by Subject. Draft titles, descriptions, and blocks never reach the trial study inputs. Starting a practice conversation freezes its source. Explicit AI assistance in the editor can still operate on a draft, and approval is never treated as mastery.
- A discreet header dropdown switches AI engineering, Bread making, and an initially empty Mathematics subject. Subject-specific editors remain mounted to retain even unsaved raw block edits while switching. Chat/practice reset on subject switch rather than mixing context. Reference notes remain one shared collection.
- Two seeded approved documents let the existing experience remain takeable; the gradient-descent and bread-dough documents are drafts. Mathematics demonstrates the no-approved-material state and manual creation/approval.
- In-memory only: return to drafts within the running page, not after reload or on another device. No backend, durable draft storage, live AI, tutor conversion, or real learning-profile update is implemented.
- Docker lint/type checks and browser walkthroughs covered draft exclusion, first approval, unchanged old snapshot after revision saves, explicit replacement, subject isolation, retained raw edits, shared Reference notes, and 390×844 / 320×667 touch layouts. Await user reaction before resolving.
