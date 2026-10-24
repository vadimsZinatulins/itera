# 01: Read AI settings through validated outcomes

**What to build:** The learner can load AI settings through validated contracts and explicit failure outcomes, without exposing their stored key. Establish shared patterns with this working consumer rather than creating unused infrastructure.

**Blocked by:** None (can start immediately).

Status: ready-for-agent

- [ ] Obtain explicit approval for direct Zod adoption before installing it; select compatible versions using official documentation. This ticket's approval is not dependency approval.
- [ ] Validate settings status at its relevant boundaries and consume parsed output; establish configuration validation for the settings integration where needed. Preserve presence/model-only responses and existing HTTP behavior.
- [ ] Introduce one shared readonly error-first Result type and recovery-oriented public error mapping, consumed by the settings read operation. Keep native integration results internal and pure functions ordinary.
- [ ] Explicitly serialize only safe public fields. Establish minimal sanitized reporting of unexpected failures without logging credentials, private content or raw upstream error objects; no new reporting service.
- [ ] Organize touched settings code, explicit types and helpers under their narrowest owners; preserve server-only boundaries and framework filenames. Use multiline braced control flow.
- [ ] Extend existing public settings/privacy/outage tests for valid, malformed and unavailable status responses; verify no key or diagnostic leakage.
- [ ] Relevant typecheck, lint, build and public-boundary tests pass inside Docker before integration. Follow the feature-branch workflow; report blockers and unrun checks accurately.

## Context

Parent: [conformance spec](../spec.md). This establishes patterns reused by later slices; unrelated callers remain working. All Node tooling runs only in Docker. Product behavior, credential policy and provider choice are unchanged.
