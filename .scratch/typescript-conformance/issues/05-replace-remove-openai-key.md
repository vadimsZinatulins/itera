# 05: Replace and remove an OpenAI key safely

**What to build:** The learner replaces or removes their OpenAI key with clear pending and failure states while the credential remains write-only and server-only after submission.

**Blocked by:** 02 — Create a Subject with validated form ownership.

Status: ready-for-agent

- [ ] Migrate key entry to RHF/Zod, validate again at the trusted boundary, consume parsed values and preserve accepted field policies, limits and HTTP behavior.
- [ ] Replace expected mutation throws with shared Result outcomes and safe public mapping. Keep persistence/provider-native results inside integrations and unexpected defects observable through sanitized reporting.
- [ ] Preserve transient key clearing, replace/remove semantics, existing failure recovery and authorization. Never return the stored full key or place it in browser storage, prompts or logs.
- [ ] Removal stops future requests without deleting saved work. Do not redesign the accepted owner-only plaintext exception.
- [ ] Keep types, schemas, operations and form behavior owner-local; preserve server/client boundaries and generated primitives. Model actual exclusive submission states clearly.
- [ ] Public settings/privacy tests cover replace/remove success, malformed submissions, pending/network/persistence failure, key clearing and absence of secrets in responses/diagnostics.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration. Dependencies require their separately recorded approvals.

## Context

Parent: [conformance spec](../spec.md). Model discovery/selection/check migration is a separate slice and must continue working meanwhile.
