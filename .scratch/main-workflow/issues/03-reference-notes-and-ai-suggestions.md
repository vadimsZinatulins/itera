# How should reference notes stay immediately accessible and user-controlled?

Labels: wayfinder:prototype
Type: prototype
Status: open
Blocked by: none

## User preferences from main-workflow feedback

- Each note is a small, uniformly sized card with a title and short subtitle.
- Selecting a card opens a large Markdown-content dialog, with Edit and Improve at the top.
- Use the repo’s configured shadcn/ui styling. On mobile, explore a full-screen dialog.
- A first interactive preview lives in `app/reference-notes.prototype.tsx`, built while iterating the main workflow. This ticket remains open for its own live evaluation; preferences are not a usability verdict.

## Question

What mobile-friendly experience makes Reference notes quick to reach, search, and copy from, while clearly separate from practice and learning assessment?

Prototype a small collection with frequently forgotten commands. Explore an explicit “Improve with AI” action (provisional label), a conversation about desired changes, a before/after preview, and approval before applying changes. Compare the mobile interaction with a larger-screen sidebar where useful. Never use “Help” as the action label.

AI may read the notes but must not modify them autonomously. Reference notes must not feed challenges or learning assessments. Use simulated AI and in-memory state; no real note storage is required. Resolve through the user’s live reaction, including whether access is easy enough and editing authority is clear.
