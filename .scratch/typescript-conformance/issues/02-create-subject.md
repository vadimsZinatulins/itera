# 02: Create a Subject with validated form ownership

**What to build:** The learner creates a Subject with accessible validation and recoverable submission failures, using the first small form pattern for later migrations.

**Blocked by:** 01 — Read AI settings through validated outcomes.

Status: ready-for-agent

- [ ] Obtain explicit approval for React Hook Form and the official Zod resolver before installing them; verify selected-version compatibility. Reuse approved Zod integration and shared operation outcomes.
- [ ] Subject creation validates browser submission and trusted server input, consumes normalized schema output and returns explicit application outcomes while preserving the public HTTP contract.
- [ ] Derive account ownership server-side. Preserve the tested behavior that ignores forged ownership input rather than indiscriminately rejecting extra fields; retain independent RLS/direct-data checks.
- [ ] RHF owns editable field state without a competing React-state mirror. Preserve labels, focus, pending/disabled controls, duplicate-name feedback and text after failure.
- [ ] Colocate the form, explicit types, schemas and associated behavior under the narrowest owner; establish reusable conventions without a speculative global form framework. Apply touched-code readability rules.
- [ ] Public browser/API/data tests cover successful creation, duplicate names, wrong shapes, normalization, ownership spoofing and outage recovery.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration; document any blockers.

## Context

Parent: [conformance spec](../spec.md). Simple action and filter controls remain ordinary React state. This is a behavior-preserving form migration, not Subject feature expansion.
