# 01: Owner sign-in to the production application

**What to build:** Let the externally provisioned owner sign in with an emailed code, return to an authenticated application, and log out without exposing a demo login or enabling public signup. Establish the smallest production-shaped application and permanent public-boundary test around this flow.

**Blocked by:** None (can start immediately).

**Status:** implemented locally; external setup and deployed release checks remain

**Evidence:** `docs/authentication.md`, `scripts/local.sh test` (10 public-boundary tests), Docker typecheck/lint and standalone production build. No live provisioning, secrets collection, purchases or deployment performed. The email-delivery/hosted-configuration checks in the guide remain release gates.

- [x] The provisioned account can request and verify an email code, correct its email, request another code, and recover from invalid/expired codes and delivery/rate-limit errors. Do not copy simulated OTP generation or invalidation assumptions; verify provider behaviour.
- [x] Public signup and automatic user creation through login are disabled. Production UI/logs never display verification codes, use a hard-coded email as authentication, or expose demo bypasses.
- [x] A valid session survives reload; logout denies subsequent protected requests and clears account-specific client state. Later content features must preserve server-saved work on logout.
- [x] Anonymous callers cannot access protected application or data endpoints. Establish account-scoped access/policy conventions without treating the owner as a global unauthenticated singleton.
- [x] The authenticated shell is usable on phone and desktop with the agreed component styling. Preserve the prototype as a design reference, not the production authentication implementation.
- [x] Run the application, dependency operations, test server, browser automation, lint/type checks and production build inside Docker. Align the runtime with currently supported deployment requirements; do not assume the existing development runtime is supported.
- [x] Add a permanent public-boundary test using real test authentication/persistence, controlled email delivery and synthetic accounts. Verify anonymous denial, login, session return and logout without mocking internal UI state.
- [x] Test-only delivery controls cannot be activated through the production UI or public requests. Errors and operational logs exclude codes, secrets and personal payloads.
- [x] Document required external setup and free-plan constraints without purchasing, provisioning, deploying or collecting secrets unless separately authorised. There is no in-app account-administration feature.
