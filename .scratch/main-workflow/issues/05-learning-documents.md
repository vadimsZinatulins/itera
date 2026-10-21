# Does a rendered-first block editor make Learning Documents natural to write and revisit?

Labels: wayfinder:prototype
Type: prototype
Status: claimed
Assignee: current developer (via assistant)
Blocked by: none

## Question

Explore a searchable Learning Documents library and a manual Markdown-block authoring flow within the existing mobile-friendly prototype. Does writing in blocks, with one assembled Markdown result, feel natural to the user?

Blocks render Markdown by default. On desktop, reveal Edit, Improve, and Review correctness on hover or keyboard focus; double-click enters raw Markdown editing. On touch devices, actions must be discoverable without hover or double-click. Save at the bottom or Ctrl+Enter (also Command+Enter on Mac) returns to rendered mode. Explore adding, reordering, and removing blocks, plus document-wide improvement and correctness review.

Documents remain user-owned; AI never applies changes without approval. Correctness review is not authoritative verification. Only a learner-approved practice version makes content eligible as encountered material, never demonstrated understanding. Draft saves remain excluded; see the later drafts-and-subjects exploration. This prototype uses in-memory state and simulated AI, not real learning-profile updates.

The user accepted Learning Document as the name and manual authoring as the first scope. Tutor-summary conversion remains exploratory and is not part of this ticket. Consult prototype and domain-modeling. Reuse the configured shadcn/ui style. Keep Reference notes separate and excluded from learning.

## Comments

Claimed before prototype work. Resolve only after live user reaction, not on artifact completion.

### Prototype ready for reaction

- Source: [Learning Documents prototype](../../../app/learning-documents.prototype.tsx), integrated in the existing home-page study through a Learning Documents navigation item. Uses the configured shadcn/ui components and shared Markdown styling.
- Library: searchable titles, descriptions, and contents; manual document creation; self-study examples from AI engineering and bread making.
- Blocks: rendered by default, desktop hover/focus actions and double-click editing, visible touch actions, raw Markdown editing, bottom Save/Cancel, Ctrl+Enter and Command+Enter. Add, move, delete, and undo deletion are interactive.
- Document output: assembled preview, raw final Markdown, copy, and .md download. Open block edits must be saved/cancelled before output, AI reviews, or returning to the library.
- AI: simulated block/document writing suggestions and correctness review, before/after text with editable suggestions, explicit approval before application. The gradient-descent seed intentionally contains an overbroad learning-rate claim to demonstrate correction. Arbitrary content is not fact-checked. No changes imply demonstrated understanding.
- Runtime: Docker image/container `itera-workflow-prototype`, port 3000. In-memory only; section switching retains state, reload or variation switching resets it. No real learning-profile updates or tutor conversion.
- Docker checks: lint and type checks; desktop and touch browser walkthroughs covering library search, create, editing, Save, both keyboard shortcuts, scoped proposals, approval, reorder, deletion undo, and final Markdown download. Awaiting live user feedback; no ticket resolution or production promotion.

### Insertion refinement

The user requested separators with a centred insertion button between blocks, revealed on desktop hover. Added insertion before each block, including the first: it opens a new raw-Markdown block at that exact position, without disturbing the existing block contents or IDs. Keyboard focus reveals the separator; touch layouts keep a faint, 44px-target plus button visible. The bottom Add Markdown block action remains for appending. Proposed touch treatment awaits user reaction.

Docker browser checks verified middle insertion on desktop and touch, saving, retention across top-tab changes, and assembled Markdown ordering.
