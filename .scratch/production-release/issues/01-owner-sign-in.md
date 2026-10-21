# 01: Owner sign-in to the production application

**What to build:** Let the externally provisioned owner sign in with an emailed code, return to an authenticated application, and log out without exposing a demo login or enabling public signup. Establish the smallest production-shaped application and permanent public-boundary test around this flow.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] The provisioned account can request and verify an email code, correct its email, request another code, and recover from invalid/expired codes and delivery/rate-limit errors. Do not copy simulated OTP generation or invalidation assumptions; verify provider behaviour.
- [ ] Public signup and automatic user creation through login are disabled. Production UI/logs never display verification codes, use a hard-coded email as authentication, or expose demo bypasses.
- [ ] A valid session survives reload; logout denies subsequent protected requests and clears account-specific client state. Later content features must preserve server-saved work on logout.
- [ ] Anonymous callers cannot access protected application or data endpoints. Establish account-scoped access/policy conventions without treating the owner as a global unauthenticated singleton.
- [ ] The authenticated shell is usable on phone and desktop with the agreed component styling. Preserve the prototype as a design reference, not the production authentication implementation.
- [ ] Run the application, dependency operations, test server, browser automation, lint/type checks and production build inside Docker. Align the runtime with currently supported deployment requirements; do not assume the existing development runtime is supported.
- [ ] Add a permanent public-boundary test using real test authentication/persistence, controlled email delivery and synthetic accounts. Verify anonymous denial, login, session return and logout without mocking internal UI state.
- [ ] Test-only delivery controls cannot be activated through the production UI or public requests. Errors and operational logs exclude codes, secrets and personal payloads.
- [ ] Document required external setup and free-plan constraints without purchasing, provisioning, deploying or collecting secrets unless separately authorised. There is no in-app account-administration feature.
