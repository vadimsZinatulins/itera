# Durable conversations

Ticket 06 adds ordinary goals/organisation chat and explicitly requested authoring assistance. Approved-source practice, suggested practice threads, assessments and recaps remain ticket 07+. No documents (including approved ones), Reference notes, profile or other Subjects are automatically retrieved for this workflow.

## Persistence and authorisation

Apply `supabase/migrations/202603010006_conversations.sql` after the existing migrations. `GET /api/conversations?subject=<uuid>` lists the current account's trail; adding `conversation=<uuid>` reads its ordered turns. `POST /api/conversations` accepts only `{ subject, conversation, operation, text }` with stable UUID identities. The server never trusts a supplied account, history, assistant message, model or source selection.

The authenticated `send_conversation_message` RPC checks the live session and Subject ownership, serialises each conversation, and atomically inserts the conversation on its first message plus its user turn and incomplete reply record. Tables are read-only to account JWTs, with active-session RLS. The service-only reply RPC updates an existing owned turn; it cannot create missing conversations or resurrect deleted Subjects. Subject/account cascades remove history.

Replaying the same operation with identical text returns its saved identity without contacting OpenAI. Reusing it with different content/scope is rejected. Concurrent new sends while a reply is pending are rejected; a pending lease expires after 90 seconds if the server dies. History is always marked **incomplete** until the final completed result is successfully persisted. Browser retries preserve the operation in the mounted session. Device-only unsent recovery and explicit generation-retry UX belong to ticket 08; there is intentionally no automatic generation retry.

## Streaming and limits

`lib/openai/server.ts` owns credential access. One user-initiated Responses API request uses the currently saved supported model/key, `store:false`, `stream:true`, and `max_output_tokens:2048`. No provider conversation or previous-response identifier is used. Only this conversation's ordered messages and fixed source-free instructions leave the app. Earlier partial replies are identified as incomplete in subsequent context. No hidden summaries or whole-account reprocessing.

The route emits newline-delimited JSON: a persisted `saved` event, text `delta` events, then `status:complete|incomplete`. Completion is sent only after persistence. Partial output is checkpointed at most every 500 ms and once on termination; an abrupt process loss may lose the last uncheckpointed fragment, never convert it to complete. Provider EOF, incomplete/failed events, transport interruption and limits leave incomplete outcomes. Persistence failures are disclosed without claiming saved completion.

Bounds: 12 KB request envelope, 8,000 UTF-8 bytes per message, 100 turns and 28,000 bytes of existing history plus new input at admission, a further 36 KB encoded provider-input check, 16 KB generated text, 256 KB upstream event stream, and a 60-second provider deadline (90-second route duration). Over-limit history is rejected rather than silently truncated. Subsequent replies can push stored history over the admission limit; start a new thread when the next send is refused. These limits are not a monthly spending cap. Provider error bodies and content are not logged or returned.

The browser keeps the desktop trail and transcript independently scrollable with a pinned composer; narrow screens switch between native Threads/Chat controls. Reload retains the selected conversation in the URL. Logout clears mounted client state, not server history. Navigating away does not finish a conversation; accepted work may already incur a provider charge.

## Provider data handling and verification

History belongs to the app. Optional OpenAI stored-response retrieval is disabled, not all provider retention: abuse-monitoring logs may include content for up to 30 days, with policy exceptions. See the existing [provider research](../.scratch/production-release/research/free-email-and-openai.md) and [streaming guide](https://developers.openai.com/api/docs/guides/streaming-responses). Recheck terms before release.

Run `bash scripts/local.sh check` and `bash scripts/local.sh test` on the host; both execute Node tooling exclusively in Docker. `tests/conversations.spec.ts` exercises real Supabase Auth/persistence/RLS with the test-only outgoing OpenAI transport. No test endpoint or provider URL override is exposed by production code. Controlled streams do not prove live model teaching quality or real deployment compatibility; the real-key/phone release walkthrough remains required.
