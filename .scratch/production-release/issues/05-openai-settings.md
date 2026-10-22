# 05: Configure an OpenAI key and supported model

**What to build:** Give the learner low-friction, write-only OpenAI credential settings and an honest supported-model selector, without exposing the stored key or silently choosing another model.

**Blocked by:** 01 — Owner sign-in to the production application.

**Status:** implemented

Implementation: `feat/05-openai-settings`; operational/API notes in [`docs/openai-settings.md`](../../../docs/openai-settings.md). Docker production build, typecheck, lint and full public-boundary suite passed (27 tests). No live charged OpenAI request or hosted deployment performed; real selected-model/phone verification remains a release gate. Runtime now requires the isolated server credential broker's `SUPABASE_SERVICE_ROLE_KEY` and migration `202603010005_openai_settings.sql`.

- [x] Save, replace and remove the authenticated account's key through write-only settings. Do not return the full stored key after entry or put it in browser storage, general content responses, logs, prompts, exports or error bodies.
- [x] Credential access is server-only after account authorisation and isolated from ordinary account-content access. Verify anonymous, foreign-account and direct public data access cannot retrieve it.
- [x] Honour the explicitly accepted temporary plaintext database exception for the owner pilot. Disclose its risk; do not describe platform encryption at rest as application secret encryption or extend the exception to other real users.
- [x] Offer a tested catalogue of currently compatible OpenAI text models intersected with the key's access. Verify current API compatibility and document concrete supported IDs and any moving-alias policy rather than exposing every model as interchangeable.
- [x] Missing/invalid credentials, unavailable models, access failures and provider quotas produce sanitised actionable errors. Never silently substitute a model or provision another provider.
- [x] Saving/removing credentials does not delete work or prevent reading saved content. Removal prevents future initiated AI requests; do not promise cancellation of already accepted provider work.
- [x] Expose that usage is billed to the account behind the key, separately from free infrastructure and ChatGPT subscriptions. Establish bounded server-side provider invocation and operational-only error handling for later AI workflows.
- [x] Public-boundary tests use synthetic keys and controlled provider responses to prove write-only access, catalogue/access filtering, settings persistence, replacement/removal and safe failure behaviour. No live charged request is required during automated runs.
- [x] Do not choose a new long-term encryption/trust design or add other providers/custom endpoints. Revisit the deferred protection decision before admitting other real users.
