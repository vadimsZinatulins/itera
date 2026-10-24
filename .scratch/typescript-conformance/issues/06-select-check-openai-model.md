# 06: Discover, select and check an OpenAI model

**What to build:** The learner discovers available supported models, explicitly chooses one and checks it with safe feedback rather than silent substitution.

**Blocked by:** 05 — Replace and remove an OpenAI key safely.

Status: ready-for-agent

- [ ] Validate provider model-list and check response shapes at the integration boundary, and validate application responses before typed browser consumption. Malformed but valid JSON produces explicit failure.
- [ ] Use shared Result outcomes for expected discover/select/check failures; preserve the supported-catalogue intersection, unavailable-model behavior and public contract.
- [ ] Migrate selection form ownership using the established RHF/Zod pattern without duplicating field state. Preserve accessible pending, empty and error feedback and the selected model across recoverable failures.
- [ ] Never silently substitute a model, expose a key, introduce implicit charged retries or change provider storage settings. Keep known integration failures distinct only where recovery differs.
- [ ] Keep settings/provider types and associated behavior under their owners. Consult official Base UI/base-nova registry guidance before any control replacement; native-control redesign and SDK adoption are not requirements.
- [ ] Public settings/provider tests cover malformed lists/output, unsupported/inaccessible models, explicit selection, timeout/quota/auth failure and safe payloads.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration; no unapproved dependency additions.

## Context

Parent: [conformance spec](../spec.md). This ticket establishes validated ordinary provider response handling reused by generation slices without requiring stream migration now.
