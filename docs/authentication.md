# Owner sign-in

## Scope and design

This is the production application entry point, not the prototype. `/` requires an authenticated learner account; `/login` supports email-code sign-in for externally provisioned accounts. There is no signup, account administration, hard-coded owner email, demo login or test-delivery switch in the application. Prototype files remain unmodified design references and are no longer imported by a route.

The accepted platform choice and domain decisions are recorded on `docs/production-plan` in `docs/adr/0001-free-tier-managed-pilot.md`, `GLOSSARY.md`, and `.scratch/production-release/`. This implementation covers issue 01, not the later Subject/document/practice features.

### Access conventions for later work

- Resolve identity server-side with `currentAccount()` at each data boundary. Do not trust a browser account ID, an unverified cookie, a layout check or Proxy alone. Return minimal DTOs, not Supabase sessions.
- Use the server-only publishable-key client under that learner's session for all ordinary account content. Issue 05 adds one isolated exception: the [OpenAI credential broker](openai-settings.md) uses a server-only service-role key after `currentAccount()` authorisation. Never use that client for general content or expose it to the browser. Fixture administration remains separate test setup.
- `learner_accounts.id` is the Supabase user ID. A trusted trigger creates its row when an account is externally provisioned; the migration also handles already-provisioned accounts. The table has no client write grants.
- New account-owned tables require explicit grants, RLS and both read/write ownership policies. Use `account_id = (select auth.uid())` and `(select public.has_active_session())` in applicable `USING` **and** `WITH CHECK` clauses. Test direct data API access as well as application endpoints. Do not make the owner a global singleton or use user-editable metadata as authority.
- Supabase JWT signature/expiry validation alone does not immediately revoke a token at logout. `has_active_session()` checks the signed JWT's `session_id` against the live `auth.sessions` row. The definer function exposes only a boolean, not session records. Keep this rule on future account-owned tables and protect private Storage separately when introduced.
- Unavailable Auth/Data API checks return a sanitized 503 rather than pretending the learner is signed out. Browser return/retry preserves local work on service failure; confirmed missing/revoked sessions still return 401 and clear device-only state.
- Sessions use HTTP-only, SameSite=Lax cookies, Secure on HTTPS. Proxy refreshes cookies; the page/endpoint performs its own authorization. Protected responses are private/no-store. Exact configured `APP_ORIGIN` is required on auth mutations; no user-controlled redirect destination is accepted.
- Logout revokes the current session, not every device. It does not delete server-saved work. Full navigation discards client/router state; namespaced `learning-companion:` local/session storage is cleared and other open tabs are notified. Later device-only account data must use this namespace and respect the same logout boundary.

## Local development — Docker only

Prerequisites: Docker Engine/Desktop, a POSIX host shell, and a local checkout whose absolute path is shared with the daemon. No host Node, npm, browser automation, Docker Compose plugin or hosted Supabase credentials are required.

```sh
scripts/local.sh start
scripts/local.sh dev
# Open http://localhost:3100
# Studio (local account administration): http://localhost:55423
# Local email inbox: http://localhost:55424
# Ctrl-C stops the foreground application.
scripts/local.sh stop
```

`start` builds the `supabase-tools` Dockerfile target, using official Supabase CLI **2.121.0**, Node **24**, and a digest-pinned Docker client. It mounts the Docker socket only into short-lived trusted CLI containers and mounts the checkout at the **same absolute path**. The CLI creates sibling containers, not nested containers. `SUPABASE_SERVICES_HOSTNAME=host.docker.internal` gives the CLI a route to published local ports. This route was verified on this Docker Desktop arm64 setup; Linux uses `--add-host ...:host-gateway` but must be verified in its CI environment, particularly with loopback-only ports. Do not expose service ports broadly to work around network failures.

The local project is `itera-owner-local`, network of the same name, API port 55421, database 55422, Studio 55423, inbox 55424. `stop` preserves its development data. Do not use `stop --all`, global pruning, or reset a linked/remote database. The wrapper deliberately exposes no remote login/link/push commands.

The pinned CLI publishes unqualified ports on all interfaces, even with the bridge loopback-binding option in this environment. `scripts/docker-loopback.sh`, used only inside the CLI tools image, qualifies those ports with `127.0.0.1`. Verify bindings after Docker/CLI upgrades. Socket access still confers broad daemon authority; do not run untrusted code with this socket or give it to the app/test browser.

Generated status/selected environment files are private, ignored files under `.local/`. Do not paste raw CLI output or provider logs: they can contain local keys or personal information. The app environment receives the publishable key plus a server-only service-role key for the isolated credential broker. Tests also select an admin key separately for fixture creation. For manual development account provisioning, open **http://localhost:55423 → Authentication → Users → Add user → Create new user**, enter the learner's email and leave **Auto Confirm User** enabled. If Studio requires a password, use a unique temporary one; application sign-in still uses emailed codes. Studio is a local development administration tool, not an app administration route, and must stay loopback-only. No reusable test account or code is shipped. To apply changed local service configuration to an already-running stack, run `scripts/local.sh stop` followed by `scripts/local.sh start`; this preserves development data.

## Public-boundary tests and checks

```sh
scripts/local.sh test tests/sign-in.spec.ts  # one file
scripts/local.sh test                       # full suite, including real expiry waits
scripts/local.sh check                      # typecheck + lint
# Dockerfile build stage runs the production Next.js build.
docker build --target production -t itera-owner-production .
```

The test wrapper starts a uniquely named CLI project, uses separate 55520–55524 ports, resets **only that local project**, creates synthetic accounts through Auth's admin API, and runs the production-built application plus Chromium in separate containers on the same private network. The application is not host-published during tests. A test-only transparent outgoing HTTP adapter forwards to the real local Supabase; its private control API can temporarily reject Auth/Data API requests to test outage recovery. The standalone app contains neither adapter nor control API. Both `start` **and** `db reset` receive the same `--network-id`; omitting it from reset puts the recreated database on a different network and breaks Auth.

Test startup explicitly excludes Studio and postgres-meta; development administration is not needed in the synthetic stack. Tests are serial; `.local/test-lock` prevents fixed-port collisions. A cleanup trap removes the application and stops exactly that synthetic project with `--no-backup`, deleting its local volumes. Developer data and prototype containers are untouched. On failure private diagnostic files are retained under `.local/`, but selected key files are removed. Review before sharing. After an uncatchable kill, remove only that run's resources and remove a stale `.local/test-lock` after checking no run remains active.

No internal React state or authentication helper is mocked. The outage test proves that upstream 503 errors do not become 401 logout responses or erase namespaced device-only work. Tests use real Auth, Postgres, RLS, cookies and email OTPs. Mailpit controls only the outgoing email boundary. In synthetic test projects only, the Docker adapter enables Mailpit Chaos; tests configure SMTP rejection through Mailpit's private API. This option is absent from the production app and cannot be enabled by an app request. Test containers have no Docker socket. Screenshots/video/traces are disabled because they can contain codes or cookies.

The local config uses a 2-second resend interval, 60-second code expiry, 120-second JWT lifetime and generous suite request limits. These are **local test settings, not production recommendations**. JWT lifetime must exceed supabase-js's 90-second proactive refresh margin; a 60-second token causes repeated refreshes across Proxy/render and does not model the hosted defaults. Expiry tests use real elapsed provider time, so the full suite takes several minutes.

Verified provider behaviour in the tests: invalid/expired codes are rejected; another code can be requested after the provider interval; existing accounts can log in with global signup disabled; unknown accounts cannot be created; revoked sessions lose direct data access. Unknown email OTP requests with `create_user=false` return provider code `otp_disabled`, which the app maps to the same generic check-inbox response. No claim is made that every resend changes the digits or invalidates all earlier codes. The provider owns token generation and validity.

## Required external setup — not performed by this implementation

Do not purchase, provision, deploy or collect secrets without separate authorization.

1. In the authorized Supabase project, enable the email provider. **Disable global public signup**, anonymous users and unused providers. The local CLI's `auth.email.enable_signup` field enables the email provider; `auth.enable_signup=false` is the global signup barrier. Do not disable email authentication by confusing these settings. Application OTP requests also always send `shouldCreateUser:false`; the provider setting is required to prevent direct signup API bypass.
2. Apply `supabase/migrations/202603010001_account_boundary.sql` through trusted migration tooling. Apply all subsequent migrations in order, including the private credential migration. Check RLS/grants and active-session denial in the actual project. Do not use a service-role client for ordinary account-content reads.
3. Provision the owner outside the app through Supabase's trusted administration tools. Use a confirmed email identity. There is no email allowlist in application code.
4. Configure custom SMTP using the owner's **existing Resend account and controlled domain**. Confirm domain/DNS verification and sender authorization. Resend documents `smtp.resend.com`, port 465 or 587, user `resend`, and a Resend API key as password. Enter the credential directly in the provider dashboard; do not store it in this repo or application environment.
5. Change the Supabase **Magic Link** email template to display `{{ .Token }}` (not a magic link). `supabase/templates/code.html` is a minimal example. Use six digits, a reviewed expiry and provider resend/verification limits. Hosted defaults documented by Supabase are a 60-second resend interval and one-hour expiry; inspect actual project settings. The production UI also accepts configured 6–10-digit tokens without generating or showing one.
6. Set the Supabase Site URL to the final HTTPS application origin; keep redirect allowlists exact and minimal. Set server runtime `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `APP_ORIGIN` as in `.env.example`. The service-role key is a privileged server-only secret restricted in code to the credential broker; see [OpenAI settings](openai-settings.md). Ensure previews use a deliberate separate configuration/origin, not the production session or arbitrary reflected Host headers.
7. Use Vercel's supported **Node 24.x** runtime, also declared in `package.json` and used in Docker. The production Docker target runs as the non-root Node user and excludes test files and dev dependencies. Local build success is not deployment evidence.
8. Before release, receive a real code on a phone, exercise invalid/resend/return/logout paths, confirm no demo route or code/secret/personal-payload application logging, verify direct account isolation and revoked access in the hosted project, and check real inbox/spam delivery. Local Mailpit does not prove Resend delivery or hosted settings.

### Free-plan constraints

- Vercel Hobby is for personal, non-commercial use and has usage limits; exceeding some limits can require waiting for reset. Confirm current eligibility and region availability. No paid upgrade is authorized.
- Supabase Free has quotas and can pause inactive projects after one week. Manual restoration and limited recovery are accepted pilot constraints, not availability promises. This app has no backup/recovery facility.
- Supabase's default email sender is restricted and unsuitable for normal production delivery. Custom SMTP has its own configurable Auth rate limits, plus the SMTP provider's quota. Resend Free currently documents **100 emails/day and 3,000/month**, shared with qualifying inbound activity and other applications on the account. Verify remaining quota in the existing account; no new subscription or automatic upgrade is authorized.
- The app intentionally shows fixed, sanitized operational errors, not raw provider exceptions. Do not add request bodies, email addresses, codes, sessions or secrets to application logs. Provider dashboards/log retention are separate and are not controlled by this app. Public email-code endpoints remain susceptible to abuse/quota exhaustion within provider limits; review provider rate limits and, if needed, provider CAPTCHA before release. No spending/availability guarantee is implied.

Primary references checked during implementation: [Supabase email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless), [SSR](https://supabase.com/docs/guides/auth/server-side/nextjs), [Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits), [Supabase Free](https://supabase.com/pricing), [Resend SMTP](https://resend.com/docs/send-with-smtp), [Resend quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits), [Vercel Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [Vercel Hobby](https://vercel.com/docs/plans/hobby). Distribution/network/security evidence is in [the CLI research note](../.scratch/production-release/research/supabase-cli-in-docker.md). Recheck mutable limits at release.
