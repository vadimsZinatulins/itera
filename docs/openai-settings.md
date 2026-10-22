# Owner-pilot OpenAI settings

Issue 05. `/settings` is reached through **AI settings** in the production header. Authentication and production entry points are unchanged; the account prototype was consulted as a visual/workflow reference, not imported into production.

## Credential boundary

- Apply `supabase/migrations/202603010005_openai_settings.sql` after prior migrations. `private.openai_settings` has RLS, no user grants/policies, and is outside the exposed public schema. No account-content relation or endpoint returns the credential.
- `public.server_openai_{read,write,remove}` are security-definer functions with empty search paths. Only `service_role` has execute permission, not `anon`, `authenticated` or `PUBLIC`. Direct public RPC calls cannot read or mutate any account's key.
- `lib/openai/server.ts` is server-only. Each exported operation calls `currentAccount()` before secret access and derives ownership exclusively from the authorised account; it accepts no account ID. No credential client or raw secret is exported. Ordinary content access continues under the account JWT/RLS, never under service-role authority.
- **Runtime change:** configure `SUPABASE_SERVICE_ROLE_KEY` as a server-only secret, never `NEXT_PUBLIC_*`. The broker creates its own non-persisting client. This supersedes issue 01's blanket ban on an app service-role key, only for this isolated boundary. This is a broadly privileged Supabase credential: a compromised server can bypass RLS. Do not reuse the broker client for content or disclose this key to browsers, logs or previews. The SQL migration's historic issue-01 comment reflects the earlier scope, not the current runtime requirement.
- The OpenAI key itself is **plaintext in the database**, an explicitly accepted temporary owner-only pilot exception. Database operators, backups or database/server compromise may expose it. Platform encryption at rest is not application-level secret encryption. Nothing here resolves the deferred encryption/trust decision or authorises admitting other real users. Revisit that decision first.
- Settings return only `hasKey`, explicit selected model and supported model choices. A replacement is validated before persistence; rejection leaves the old key/selection intact. Replacing with a key lacking the selected model is rejected, not silently switched; remove the old key and save the replacement, then choose explicitly if access differs. Removing a key removes settings only, never work. It prevents future invocations after removal completes, not cancellation of accepted provider work.
- The password field is transient component state only, cleared on submission even on failure. No local/session storage, prompt inclusion, exports or application logs. As with any password entry, the value exists in the browser while entered and in the outbound authenticated TLS request.

## Catalogue and API policy

Official model pages and Responses reference checked during implementation:

| UI label | Exact supported ID | API |
| --- | --- | --- |
| GPT-5.5 | `gpt-5.5-2026-04-23` | `POST https://api.openai.com/v1/responses` |
| GPT-5.4 mini | `gpt-5.4-mini-2026-03-17` | same |

Sources: [GPT-5.5](https://developers.openai.com/api/docs/models/gpt-5.5), [GPT-5.4 mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini), [Responses creation](https://developers.openai.com/api/reference/resources/responses/methods/create), [Models listing](https://developers.openai.com/api/reference/resources/models/methods/list).

These current flagship/mini text models document Responses API and streaming support. The implemented settings compatibility probe is deliberately **non-streaming**; streaming event parsing/recovery must be implemented and tested by the later conversation issues before claiming streaming support in this application. Other newer/specialist models are not automatically compatible simply because they appear in listing results.

**No moving aliases:** only the pinned IDs above are offered, intersected exactly with `GET /v1/models` results for the key. Model listing is not proof of usable generation permissions/quota. No model is selected on first save. No fallback, other provider, arbitrary endpoint, automatic upgrade or changed snapshot. Adding/updating snapshots requires source rechecking, contract tests and an explicit catalogue change; existing selections must never be rewritten silently. Recheck current model support at release.

**Test selected model** is an explicit potentially charged request with fixed input `Reply with OK.`. The endpoint returns a fixed success message, not arbitrary provider output. It tests the selected model's real text compatibility/quota when run with a real key. No charged request occurs on save, model refresh, page load or content reading. API usage is billed to the account behind the key, separately from infrastructure and ChatGPT subscriptions.

## Bounded invocation foundation

`generateText` is a server-only foundation for later user-initiated workflows, not an arbitrary public prompt endpoint. It reauthorises and reads the latest saved credentials on every invocation. Limits: 32,000 UTF-8 input bytes, 2,048 total output/reasoning tokens, 30-second provider timeout, one attempt, no automatic retry. Settings request bodies are capped at 2,048 bytes. These are request bounds, not a monthly spending cap or proof that every requested review fits; incomplete/no-text provider output is an actionable failure, not success. Later workflows must disclose truncation/limits and not silently omit material.

Generation uses explicit `model`, `input`, `store: false`, `stream: false`, `max_output_tokens: 2048`. No provider-side conversation or previous-response state, tools, background work or scheduled generation. Optional stored-response retrieval is disabled; OpenAI abuse-monitoring retention can still apply. See [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).

401, 403, 404, 429, other failures, network/timeouts and incomplete responses map to fixed actionable messages. No raw upstream error body, headers, secret, prompt or content is logged or returned. There is currently no added application logging; later operational logging may include status/timing/model/usage metadata only. Retry is explicit and can incur another charge even if a prior response was interrupted. Removal does not cancel accepted work.

## Verification and rollout

```sh
scripts/local.sh check
scripts/local.sh test tests/openai-settings.spec.ts
scripts/local.sh test
```

Tests run against the standalone production build, real synthetic Supabase accounts/sessions/Postgres and controlled OpenAI HTTP responses. The test harness mounts a fetch preloader **only into its test application container** to redirect the fixed OpenAI outgoing boundary to the test adapter; production code contains no custom endpoint/test-mode option. The standalone production image contains neither the preloader nor adapter. The adapter records only fixed operational request fields, not keys or input content.

Tests cover write-only browser/API access, account isolation, direct table/RPC rejection, synthetic key persistence/replacement/removal, catalogue intersection, both model contract shapes, no alias/fallback, no automatic retry, bounded output/store policy, retained Subjects, sanitised provider and persistence failures. No live charged request is required or claimed as automated evidence. Before release, run the explicit probe with the owner's real key and chosen model, then the deployed phone walkthrough; official documentation and controlled responses alone do not prove live account quota, retention terms or model teaching quality.

For an existing local development stack, apply this migration with trusted local migration tooling (do not reset saved developer work) and rerun `scripts/local.sh start` to regenerate the private app environment with the broker key, then restart the app. Hosted rollout needs all migrations and the additional server secret. No hosted provisioning/deployment was performed here.
