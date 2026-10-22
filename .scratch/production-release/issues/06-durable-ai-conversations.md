# 06: Start and resume durable AI conversations

**What to build:** Let the learner begin by sending a message, receive a real server-mediated AI reply and return to the same saved conversation in a seamless Subject Learning Trail.

**Blocked by:** 02 — Create and switch private Subjects; 05 — Configure an OpenAI key and supported model.

**Status:** ready-for-human — implemented; manual acceptance pending

**Implementation:** `feat/durable-ai-conversations`; persistence/API and limits documented in [`docs/conversations.md`](../../../docs/conversations.md). Docker typecheck, lint, production build and the full public-boundary suite passed (31/31 tests). Controlled provider streams only; no live charged OpenAI call or deployment performed.

- [x] The first successfully persisted sent message registers a conversation in the current Subject. Continuing it preserves identity and ordered history rather than copying it into a new thread.
- [x] Persist messages and reply outcomes across reload, logout/login and another session. Leaving, switching Subjects or returning later does not finish the conversation; no mandatory Start/Finish/Pause ceremony.
- [x] Use server-side OpenAI calls with the selected account key/model, streaming output and explicit completion/incomplete states. Persist a user message before claiming it was saved; interrupted output is never labelled complete.
- [x] Store history in the app, not a provider conversation feature; disable optional stored-response retrieval. Disclose that this does not remove all provider retention.
- [x] Provide the accepted desktop independently scrolling trail/transcript with a pinned composer and mobile Threads/Chat navigation, accessible native controls and touch-friendly typing. No prototype variation switcher or fabricated history.
- [x] Without approved material, support goals/organisation chat and explicitly requested authoring assistance, but do not invent source-based assessments or demonstrated-understanding claims. Approved-source practice is added by ticket 07.
- [x] Authorise account/Subject/conversation ownership on every public operation. User content cannot grant itself broader context access. Never automatically send all account content, Reference notes, Drafts or secrets.
- [x] Use stable operation/message identity to prevent basic save retries from duplicating history. Do not silently retry possibly charged generations; full device-only recovery and interruption UX are added by ticket 08.
- [x] Bound request/output size, sanitise errors and keep logs operational-only. No idle/scheduled AI analysis, paid upgrades or hidden whole-history reprocessing.
- [x] Public-boundary tests exercise real persistence/auth with controlled streamed provider output, reload/two-session continuation, Subject separation, empty-source behaviour, bounded failure and anonymous/foreign-account denial.

## Manual acceptance

1. Apply `supabase/migrations/202603010006_conversations.sql` after existing migrations, without resetting saved data. Use the existing server-only service-role configuration from ticket 05.
2. Sign in, choose a Subject and configure the OpenAI key/model. Send a goals/organisation request; verify the thread appears only after persistence and the reply streams before becoming complete. This real request may incur an API charge.
3. Reload, continue the same thread from another session, switch Subjects and return, then log out/in. Confirm identity, ordered messages and Subject separation. Clicking the current thread must not clear its transcript.
4. Check desktop independent scrolling/pinned typing and mobile Threads/Chat at 320/390 px and on a real phone. Missing key/provider errors must preserve saved user history and show incomplete output, not fabricate completion.
5. Confirm the source-free limitation and provider-retention disclosure are visible. Approved-source practice remains ticket 07; device-only draft recovery and explicit generation retry remain ticket 08. A potentially charged generation is never silently replayed.

Automated evidence covers provider completion/incomplete/EOF/outage/oversized output, missing key, bounded messages/history, concurrent identical sends, stable identity conflicts, privacy at route and direct database boundaries, reload/two-session/logout continuation and responsive controls. Live model behaviour/quality and the deployed phone release walkthrough remain unverified release gates.
