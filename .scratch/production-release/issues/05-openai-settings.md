# 05: Configure an OpenAI key and supported model

**What to build:** Give the learner low-friction, write-only OpenAI credential settings and an honest supported-model selector, without exposing the stored key or silently choosing another model.

**Blocked by:** 01 — Owner sign-in to the production application.

**Status:** ready-for-agent

- [ ] Save, replace and remove the authenticated account's key through write-only settings. Do not return the full stored key after entry or put it in browser storage, general content responses, logs, prompts, exports or error bodies.
- [ ] Credential access is server-only after account authorisation and isolated from ordinary account-content access. Verify anonymous, foreign-account and direct public data access cannot retrieve it.
- [ ] Honour the explicitly accepted temporary plaintext database exception for the owner pilot. Disclose its risk; do not describe platform encryption at rest as application secret encryption or extend the exception to other real users.
- [ ] Offer a tested catalogue of currently compatible OpenAI text models intersected with the key's access. Verify current API compatibility and document concrete supported IDs and any moving-alias policy rather than exposing every model as interchangeable.
- [ ] Missing/invalid credentials, unavailable models, access failures and provider quotas produce sanitised actionable errors. Never silently substitute a model or provision another provider.
- [ ] Saving/removing credentials does not delete work or prevent reading saved content. Removal prevents future initiated AI requests; do not promise cancellation of already accepted provider work.
- [ ] Expose that usage is billed to the account behind the key, separately from free infrastructure and ChatGPT subscriptions. Establish bounded server-side provider invocation and operational-only error handling for later AI workflows.
- [ ] Public-boundary tests use synthetic keys and controlled provider responses to prove write-only access, catalogue/access filtering, settings persistence, replacement/removal and safe failure behaviour. No live charged request is required during automated runs.
- [ ] Do not choose a new long-term encryption/trust design or add other providers/custom endpoints. Revisit the deferred protection decision before admitting other real users.
