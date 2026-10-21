# 06: Start and resume durable AI conversations

**What to build:** Let the learner begin by sending a message, receive a real server-mediated AI reply and return to the same saved conversation in a seamless Subject Learning Trail.

**Blocked by:** 02 — Create and switch private Subjects; 05 — Configure an OpenAI key and supported model.

**Status:** ready-for-agent

- [ ] The first successfully persisted sent message registers a conversation in the current Subject. Continuing it preserves identity and ordered history rather than copying it into a new thread.
- [ ] Persist messages and reply outcomes across reload, logout/login and another session. Leaving, switching Subjects or returning later does not finish the conversation; no mandatory Start/Finish/Pause ceremony.
- [ ] Use server-side OpenAI calls with the selected account key/model, streaming output and explicit completion/incomplete states. Persist a user message before claiming it was saved; interrupted output is never labelled complete.
- [ ] Store history in the app, not a provider conversation feature; disable optional stored-response retrieval. Disclose that this does not remove all provider retention.
- [ ] Provide the accepted desktop independently scrolling trail/transcript with a pinned composer and mobile Threads/Chat navigation, accessible native controls and touch-friendly typing. No prototype variation switcher or fabricated history.
- [ ] Without approved material, support goals/organisation chat and explicitly requested authoring assistance, but do not invent source-based assessments or demonstrated-understanding claims. Approved-source practice is added by ticket 07.
- [ ] Authorise account/Subject/conversation ownership on every public operation. User content cannot grant itself broader context access. Never automatically send all account content, Reference notes, Drafts or secrets.
- [ ] Use stable operation/message identity to prevent basic save retries from duplicating history. Do not silently retry possibly charged generations; full device-only recovery and interruption UX are added by ticket 08.
- [ ] Bound request/output size, sanitise errors and keep logs operational-only. No idle/scheduled AI analysis, paid upgrades or hidden whole-history reprocessing.
- [ ] Public-boundary tests exercise real persistence/auth with controlled streamed provider output, reload/two-session continuation, Subject separation, empty-source behaviour, bounded failure and anonymous/foreign-account denial.
