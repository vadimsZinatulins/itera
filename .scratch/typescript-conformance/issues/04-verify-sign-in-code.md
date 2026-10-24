# 04: Verify a sign-in code and recover access failures

**What to build:** The learner verifies their email code and recovers safely from invalid, expired or unavailable access attempts without losing the login flow.

**Blocked by:** 03 — Request and resend a sign-in code.

Status: ready-for-agent

- [ ] Migrate code fields and verification submission to established RHF/Zod contracts, preserving accepted code format, normalization and trusted server validation.
- [ ] Migrate the shared account-access operations consumed by login, Home and settings to explicit expected-failure outcomes. Preserve unavailable-versus-unauthenticated behavior and account isolation.
- [ ] Preserve code correction/resend, focus, visible pending/failure feedback, successful full navigation and local/session cleanup semantics.
- [ ] Preserve framework redirect/not-found control flow; never swallow it in a broad catch. Report unexpected failures only through approved sanitized diagnostics.
- [ ] Complete owner-local login/account-access types and behavior organization within this slice; do not change framework filenames or pull server helpers into client code.
- [ ] Public sign-in/access/expiry/recovery/outage tests cover success, invalid/expired code, service failure, protected-page access and session transitions.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration; no host Node tooling or unapproved dependencies.

## Context

Parent: [conformance spec](../spec.md). Keep provisioning-only access and enumeration resistance unchanged; this is not an account-administration feature.
