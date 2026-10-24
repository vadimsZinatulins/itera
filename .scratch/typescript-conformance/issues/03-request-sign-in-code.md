# 03: Request and resend a sign-in code

**What to build:** The learner requests or resends an email sign-in code through validated form submissions with safe, accessible recovery feedback.

**Blocked by:** 02 — Create a Subject with validated form ownership.

Status: ready-for-agent

- [ ] Migrate email entry to the established RHF/Zod pattern and trusted request/resend input validation; consume normalized output and preserve existing limits and HTTP responses.
- [ ] Use shared explicit application outcomes for expected request failures, retaining native auth-provider results within the integration and sanitized diagnostics for unexpected defects.
- [ ] Preserve account-enumeration resistance, email correction, resend behavior, pending controls, visible notices/errors and focus transitions. Verification remains functional during this partial migration.
- [ ] Prefactor the login owner only as needed before migration; place explicit types and associated handlers/helpers with their owner and keep framework control flow intact.
- [ ] Existing public sign-in/access tests plus malformed-input and controlled-email scenarios verify normalization, request/resend, correction and outages without exposing codes or secrets.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration. Do not introduce new dependencies without approval.

## Context

Parent: [conformance spec](../spec.md). This slice does not require completing verification migration or redesigning authentication.
