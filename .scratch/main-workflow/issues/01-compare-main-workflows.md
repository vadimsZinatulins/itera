# Which main workflow makes a ten-minute practice session feel natural?

Labels: wayfinder:prototype
Type: prototype
Status: claimed
Assignee: current developer (via assistant)
Blocked by: none

## Question

Compare three radically different mobile-friendly, throwaway UI variants using the same sample learning history: challenge-first, learning-trail, and conversation-first. Which starting experience does the user want to pursue, and which parts feel wrong?

Show the complete short loop: enter the app, accept a suggested challenge or choose something else, reason through a simulated conversation, then inspect and correct a tentative interpretation of demonstrated understanding. Include the source tutor-session summary so the user can judge whether the challenge feels grounded.

Follow the prototype skill’s UI branch. Use simulated AI and in-memory state, not backend infrastructure. Keep Reference notes visibly reachable as a separate destination, but leave their detailed experience to the reference-notes ticket. A verdict requires live user reaction; building the artifact alone does not resolve this question.

## Comments

### Prototype ready for user reaction

- Source: [main-workflow.prototype.tsx](../../../app/main-workflow.prototype.tsx), [scoped styles](../../../app/main-workflow.prototype.module.css), and [shared variation switcher](../../../components/prototype-switcher.tsx).
- Open `http://localhost:3000/?variant=A`, `?variant=B`, or `?variant=C`. Floating arrows switch variants and update the URL. Switching resets in-memory state.
- All three use the same sample history and two alternate scenarios. Try sending reasoning, asking for a hint or explanation, finishing, and accepting, correcting, or dismissing a sample recap. Reference notes are a separate one-tap section with a copyable example command.
- AI responses and assessment are explicitly simulated; no real inference or persistence. The notes experience is an access preview only, not resolution of its separate ticket.
- Runtime: existing Dockerfile; image and container named `itera-workflow-prototype`, port 3000. Node tooling must run exclusively through Docker.
- Added `.dockerignore` to exclude local dependencies, build output, agent runtime, tracker files, and environment files from the build context. Limited the Tailwind loader to `globals.css` because its catch-all CSS rewrite removed CSS Module exports in a browser check.
- Ticket remains claimed pending live user feedback. No design verdict, production promotion, or throwaway-branch archival yet.

### User reaction and next iteration

The user prefers the learning trail (B), combined with the chat entry from conversation-first (C). They also request the repo’s shadcn/ui styling instead of the bespoke visual treatment. B is now the default hybrid for reaction; A and C remain comparison views. Await feedback on the combined experience before resolving this ticket.

Further positive feedback requested independent thread scrolling with chat always visible and native shadcn/ui top tabs with icons. The refinement bounds the learning-trail home to the viewport: threads and chat transcript scroll independently, while the composer stays fixed within chat. On mobile, a proposed Threads/Chat switch uses the available panel space without stacking tiny panes and preserves chat state. Main navigation uses shadcn/ui Tabs with mounted inactive content so document edits survive section switches. Native tab arrow navigation is excluded from the prototype variation keyboard shortcuts.

Docker browser checks covered independent scrolling, a growing transcript with pinned composer, main-tab keyboard operation, touch layouts at 390×844 and 320×667, and state retention. The mobile workspace switch is a proposal awaiting reaction.

The user also specified a Reference notes preview: uniform small title/subtitle cards, a large Markdown dialog, and Edit/Improve actions at the top. The preview includes user editing and explicitly approved simulated improvements; this does not resolve the separate reference-note decision ticket.
