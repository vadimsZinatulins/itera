# Research: Supabase CLI entirely inside Docker

## Summary

**Yes, with qualifications:** run the official CLI installation/binaries in a repo-owned tools container and let it control the existing Docker daemon through its socket (Docker-outside-of-Docker). This can replace manually maintained Supabase service wiring, requires neither Docker Compose nor hosted Supabase provisioning, and fits this repo’s Docker-only Node tooling rule. It is **not** an official ready-made CLI-container workflow: filesystem visibility, CLI-to-service connectivity, browser-visible URLs, daemon privileges, and teardown isolation still need a small wrapper and runtime verification.

**Recommendation:** prefer a pinned CLI tools image + committed `supabase/config.toml`, migrations and synthetic fixture setup; retain Docker-run app/browser containers. Use the established, nonexperimental `start/status/stop` lifecycle initially; do not adopt DinD or the new experimental `stack` backend merely to simplify owner-sign-in tests.

Research angles: (1) supported installation/distribution, (2) daemon, mounts and networking, (3) Auth/public-boundary tests and migrations, (4) CI safety/versioning. No containers or application tooling were executed; no services were started, credentials accessed, paid resources provisioned, or existing Docker resources changed. `AGENTS.md`, domain instructions and glossary were read. Planning/ADR README paths were absent; this is an infrastructure proposal, not a confirmed architecture change or review of all ADRs.

## Findings

### 1. Official installation exists; an official general-purpose CLI runner image was not established

**Claim:** official paths include project-local npm (Node 20+), Homebrew, Scoop, Linux release packages, and GitHub release archives. Current repository README additionally offers an install script and labels pkgx/Nixpkgs community-maintained. Prefer `npm install --save-dev --save-exact supabase@<reviewed-version>` during a Docker image build, or verified Linux release packages/archives in a tools image. Do not use an unpinned `npx supabase` that silently resolves a newer version. **Sources:** [installation docs](https://supabase.com/docs/guides/local-development/cli/getting-started), [official README](https://github.com/supabase/cli/blob/develop/README.md), [release API](https://api.github.com/repos/supabase/cli/releases/latest). **Support:** direct evidence for install paths and pinning; recommendation for image build. **Confidence:** high.

The inspected stable release API returned **v2.121.0**. Treat this as an observed upstream snapshot, not a requirement to upgrade existing work. Pin the selected release, tools base image/digest and lockfile; review updates deliberately. Official docs advise saving migrations/data before destructive local-volume cleanup during upgrades. [Installation/update guidance](https://supabase.com/docs/guides/local-development/cli/getting-started).

**Image distinction:** installation docs do not offer an official all-purpose `supabase/cli` runner image. The [release-tagged service Dockerfile](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/shared/services/Dockerfile) is a service-image catalog, **not a Dockerfile that installs/runs the CLI**: it pins Postgres, Auth, Studio, Mailpit, Kong, pgTAP runner, etc. Its images include Supabase-owned services and upstream third-party components. Likewise `ghcr.io/supabase/cli/*` references in source are slim **service** images, not proof of a CLI execution image. [Start side-effects](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/commands/start/SIDE_EFFECTS.md). `jtdev0ps/supabase-cli` is a separately published third-party runner, not a Supabase-supported distribution. [Publisher page](https://hub.docker.com/r/jtdev0ps/supabase-cli). **Support:** direct source inspection; absence of a documented runner image is a bounded finding, not proof none can exist. **Confidence:** medium-high.

### 2. Linux amd64 and arm64 binaries are verified; old single-binary recipes may be stale

**Claim:** v2.121.0 release assets contain Linux `amd64` and `arm64` archives and `.deb/.rpm/.apk` packages, with published checksums/digests. [Official assets](https://api.github.com/repos/supabase/cli/releases/latest), [tagged release](https://github.com/supabase/cli/releases/tag/v2.121.0). Current packaging documents Linux x64/arm64 glibc and musl platform packages. It now ships a compiled TypeScript/Bun CLI plus a colocated `supabase-go` binary for residual commands. Preserve the complete distribution rather than copying only one presumed Go binary. [Tagged binary-distribution documentation](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/docs/binary-distribution.md). **Support:** direct evidence. **Confidence:** high.

**Important:** current native CLI lifecycle code spawns the **Docker executable** (Podman fallback); mounting a socket into bare `node:24-bookworm` is insufficient if `docker` is absent inside it. Include a pinned Docker CLI client, CA certificates and the pinned Supabase distribution. [Container CLI implementation](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/command-internal/container-cli.ts). This implementation uses Docker subcommands, not an external `docker compose` orchestration file/plugin; the host’s missing Compose plugin need not block this approach. **Support:** direct source evidence; interpretation for this repo. **Confidence:** high.

**Limitation:** CLI binary architecture availability does not prove that every selected service image and Docker Desktop combination works natively on both architectures. No image manifests, startup or architecture-specific smoke tests were run.

### 3. Socket sharing is the minimal model; DinD is possible but adds complexity

**Claim:** socket sharing gives the tools container control of the existing daemon; CLI-created services are sibling containers on that daemon, not children inside the tools container. Current source discovers `DOCKER_HOST`/contexts and defaults on Linux to `unix:///var/run/docker.sock`. [Hostname/daemon resolution](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/command-internal/hostname.ts). **Support:** direct source evidence plus Docker model interpretation. **Confidence:** high.

**Researcher recommendation:** mount the actual daemon socket to `/var/run/docker.sock` and set `DOCKER_HOST=unix:///var/run/docker.sock`; do not blindly inherit a host Docker context whose socket path/config does not exist in the tools container. Non-root execution requires appropriate socket group permissions; running as root only bypasses that permission hurdle, not the security implications. Reuse the existing daemon rather than changing its configuration.

DinD instead launches a separate daemon, usually with `docker:dind`, and connects the CLI to it with `DOCKER_HOST` and TLS/shared certificates. Standard DinD requires `--privileged`; its services and published ports live behind the DinD container, and bind sources must be visible to **that daemon**. [Official Docker image usage](https://hub.docker.com/_/docker), [Docker bind mounts](https://docs.docker.com/engine/storage/bind-mounts/). **Support:** direct evidence for Docker setup; interpretation for Supabase topology. **Confidence:** high. DinD may isolate CI resources but adds daemon lifecycle, storage, TLS and networking overhead. It is not the simplest local-development answer here.

### 4. Containerizing the client does not relocate bind-mount sources

**Claim:** Docker bind mounts resolve on the **daemon host**, not the CLI/client filesystem. Mounting `/Users/.../itera` into the tools container only at `/workspace` can cause the CLI to request sibling-service mounts from a nonexistent daemon-host `/workspace/...`. Docker Desktop translates shared native host paths, but cannot infer arbitrary container-only aliases. [Docker bind-mount semantics](https://docs.docker.com/engine/storage/bind-mounts/). **Support:** direct evidence; application to containerized CLI is interpretation. **Confidence:** high.

The tagged CLI source explicitly documents remaining host bind mounts for user functions, Studio snippets, custom Auth email templates and multiline Edge Runtime secrets. Some generated bootstrap/secret files now use `docker cp`, which improves remote-daemon behavior but **does not remove all mount requirements**. [Start filesystem and bind behavior](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/commands/start/SIDE_EFFECTS.md).

**Untested recipe:** resolve the repo’s canonical absolute path and bind it at **the identical path** inside the tools container, then use that path as working directory/`--workdir`. Any out-of-repo referenced file also needs daemon-visible matching paths. Keep `.temp`, fixtures and generated CLI state writable and gitignored as appropriate. A named volume visible only in the tools container does not automatically make sibling-service bind sources valid. This also matters for `supabase test db`, which uses a pgTAP runner container and project test files. [CLI reference](https://supabase.com/docs/reference/cli/introduction).

### 5. `--network-id` is supported; it is not a URL or port rewrite

**Claim:** official local-development docs show `supabase start --network-id <network>` and a user-defined network configured with `com.docker.network.bridge.host_binding_ipv4=127.0.0.1`. Current source resolves the explicit flag before `SUPABASE_NETWORK_ID` and generated `supabase_network_<project>` fallback. [Official network example](https://supabase.com/docs/guides/local-development), [start handler](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/commands/start/start.handler.ts). **Support:** direct evidence. **Confidence:** high.

Attach app/test/browser containers to that user-defined network, or explicitly connect them to the CLI-generated network. User-defined bridge networks provide container-name/alias DNS and direct access to container ports. [Docker bridge documentation](https://docs.docker.com/engine/network/drivers/bridge/). Container-internal ports are not the host-published ports: inspect the pinned gateway/database container configuration rather than assuming `gateway:54321`. Choose a unique network per integration run where practical. `--network-id` configures services; it does not automatically attach the tools/app/browser containers or make their `localhost` equal the host’s.

**CLI-to-service trap:** with a Unix socket, current CLI hostname resolution defaults to `127.0.0.1`; that is the **tools container**, not the daemon host. `SUPABASE_SERVICES_HOSTNAME` overrides the service-connection hostname. [Exact hostname implementation](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/command-internal/hostname.ts), [status behavior](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/commands/status/SIDE_EFFECTS.md). Therefore socket + identical mounts alone is not enough to claim `start/reset` works.

**Untested connectivity options:**
- Linux: host-network the short-lived CLI tools container so host-published loopback ports are reachable normally. Docker Desktop host networking requires supported versions and explicit enablement; do not assume it is available. [Host driver docs](https://docs.docker.com/engine/network/drivers/host/).
- Docker Desktop bridge: try `SUPABASE_SERVICES_HOSTNAME=host.docker.internal` for CLI-to-host published ports; Linux additionally needs host-gateway resolution. [Desktop networking](https://docs.docker.com/desktop/features/networking/). This must be tested with the chosen port-binding policy: host-gateway access is not a portable substitute for host loopback, especially when binding only `127.0.0.1`.
- Shared-network service DNS is suitable for app/test clients, but using a gateway container name as a universal CLI hostname is not automatically correct because CLI URLs also use published DB/API ports.

### 6. Maintain separate host, server-container and browser endpoint views

**Claim:** normal `start/status` output uses host-oriented defaults: API `http://127.0.0.1:54321`, Postgres `54322`, Studio `54323`, inbox `54324`. `status -o env`/JSON exports connection settings; current source also exposes publishable/secret keys alongside legacy anon/service-role keys. [Official local setup](https://supabase.com/docs/guides/local-development/cli/getting-started), [tagged status contract](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/commands/status/SIDE_EFFECTS.md). **Support:** direct evidence. **Confidence:** high.

**Researcher recommendation:** do not copy status output wholesale into `NEXT_PUBLIC_*`. Explicitly distinguish:

| Consumer | Endpoint approach |
| --- | --- |
| Developer’s host browser | Host-published app/API URLs, normally localhost |
| Next.js server/app container | Shared-network gateway DNS/internal port, or verified host-gateway route |
| Browser running inside a test container | A URL reachable from that browser container; its `localhost` is not the developer host |
| CLI tools container | Verified host networking or service-hostname override for its published-port connections |

Auth `site_url` and `additional_redirect_urls` must match the URL the **actual browser** follows. One can use a deliberate shared hostname/reverse proxy if a single origin must work across contexts, but that is extra infrastructure, not something `--network-id` solves. [Auth config reference](https://supabase.com/docs/guides/local-development/cli/config). Public-boundary tests should exercise the app’s own routes/forms and real Auth HTTP/session behavior, not mock Supabase or use admin keys as the acting learner.

### 7. Local inbox and synthetic Auth users replace live credentials

**Claim:** the CLI starts a local email inbox; current setup docs and pinned service catalog call it **Mailpit**, default UI `54324`. Some config reference entries still say `inbucket`; check the pinned CLI-generated config/help before copying examples. [Local setup](https://supabase.com/docs/guides/local-development/cli/getting-started), [service images](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/shared/services/Dockerfile), [config reference](https://supabase.com/docs/guides/local-development/cli/config). **Support:** direct evidence. **Confidence:** high.

Official testing docs demonstrate synthetic users through `auth.admin.createUser({ email, password, email_confirm: true })`, then real `signInWithPassword` with an ordinary client. Admin user creation belongs server-side; never expose service-role/secret credentials in browsers. [Testing overview](https://supabase.com/docs/guides/local-development/testing/overview), [createUser reference](https://supabase.com/docs/reference/javascript/auth-admin-createuser). **Support:** direct evidence. **Confidence:** high.

**Untested test design:** create run-unique `.test` email identities in a Docker-run fixture helper; return user IDs for domain fixtures; sign in via the app/browser public boundary. For confirmation/password-reset coverage, trigger real local Auth emails and inspect the inbox instead of auto-confirming that particular flow. SQL-only rows in `auth.users` may be useful pgTAP fixtures but do not prove a usable password identity. Keep local admin credentials in test-server memory or ignored restricted files, never in client bundles, commits or routine logs. Admin fixture creation is test setup, not a substitute for owner authorization tests. No hosted login, access token, link operation or paid project is required for the local CLI stack. [Local-only initialization](https://supabase.com/docs/guides/local-development/cli/getting-started).

### 8. Migrations/reset and scoped teardown simplify repeatability

**Claim:** `supabase init` creates versionable local project files. `migration new`, migration SQL and seed files provide a replayable database; `db reset --local` rebuilds local state and reapplies migrations then seeds, discarding local changes. `migration up --local` applies pending local migrations without a full reset. Never pass `--linked`/an external `--db-url` in local harness scripts. [Workflow guide](https://supabase.com/docs/guides/local-development/cli-workflows), [CLI reference](https://supabase.com/docs/reference/cli/introduction), [seeding guide](https://supabase.com/docs/guides/local-development/seeding-your-database). **Support:** direct evidence. **Confidence:** high.

**Recommendation:** reset **once per isolated test suite/run**, create Auth identities through the admin API afterward, and use run-unique data for individual cases. Supabase’s testing guidance explicitly discourages full reset before every application test because it is slow and impedes parallelism. [Testing overview](https://supabase.com/docs/guides/local-development/testing/overview).

Normal `stop` preserves data; **`stop --no-backup --project-id <this-run-only-id>` deletes that project’s local volumes**. Project targeting in the pinned nonexperimental implementation uses Docker labels; `--all --no-backup` can delete every local Supabase project and must not appear in the repo harness. [CLI stop reference](https://supabase.com/docs/reference/cli/introduction), [precise tagged stop behavior](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/commands/stop/SIDE_EFFECTS.md). A unique local `project_id` isolates names/data, **not fixed host ports**. Default concurrent stacks still conflict; allocate unique configured ports or use a dedicated CI daemon/runner. This project ID is not a hosted project ref.

**Untested CI lifecycle:** register a cleanup trap before startup; select an isolated config/workdir/project ID and ports; start; reset locally; create fixtures; run app/public-boundary tests; capture sanitized failures; always stop exactly this project with `--no-backup`; remove only networks/files the harness created. Preserve primary test failure even when cleanup also fails. Killing the CLI tools container alone does not remove sibling services. Do not use global Docker prune or modify existing manually wired WIP containers.

### 9. Socket privilege is a real trust boundary

**Claim:** Docker documents that only trusted users should control the daemon because it can mount and modify host filesystems. A socket-mounted tools container has daemon authority despite ordinary container isolation; a read-only socket bind is not a Docker API authorization policy. [Docker Engine security](https://docs.docker.com/engine/security/). **Support:** direct evidence for daemon authority; interpretation for the read-only mount warning. **Confidence:** high.

**Recommendation:** mount the socket **only** into trusted short-lived tooling, not Next.js or the browser runner. Do not run untrusted fork code with a privileged/shared daemon; use disposable CI runners and no production secrets. Pin trusted sources and avoid unreviewed community runner images. Keep local development services off public networks; Supabase explicitly describes the local stack as development-only. [Local development warning and network recipe](https://supabase.com/docs/guides/local-development).

## Minimal repo approach (proposal, not an executed recipe)

1. Add a small pinned Supabase tools target/image using the existing Dockerfile conventions: Node 24 Bookworm + Docker CLI + exact official Supabase npm dependency/lockfile, or complete verified Linux binary distribution. Keep all Node installation/execution inside Docker. The existing `itera-owner-tools` is reusable only after verifying its Docker client and CLI dependencies; no assumption was made that they are present.
2. Commit CLI config/migrations/seed/test-fixture code instead of manually versioning the full Auth/Postgres/gateway/email service graph. Do not mechanically translate WIP Compose services; let the CLI own its service versions and initialization.
3. Use a tiny host shell wrapper around `docker run --rm`, socket sharing, identical absolute repo path and an explicitly verified CLI-to-service network route. No Compose plugin, login or remote linking. Persist required workspace state in the mounted checkout. Set `SUPABASE_EXPERIMENTAL_STACK=0` to lock the intended lifecycle backend and optionally `SUPABASE_TELEMETRY_DISABLED=1`.
4. Keep public browser URL and internal server URL distinct, allowlist the real callback origin, extract only needed status values, and provision local synthetic users server-side.
5. Separate development (preserved volumes) from integration runs (unique project/ports and scoped cleanup). Start with serial local integration tests rather than inventing parallel orchestration.

This trades a bespoke multi-service stack for a supported service lifecycle plus a small environment adapter. It does **not** eliminate resource use, image downloads, daemon permissions, network-origin planning, or the need for a runtime spike before deleting WIP infrastructure.

## Contradictions / version-sensitive evidence

- **Current packaging versus historical recipes:** release-tagged v2.121.0 uses a compiled TS/Bun executable, a residual Go companion and a Docker CLI subprocess. Instructions assuming a single statically linked Go executable and no Docker executable are not valid current evidence. [Binary distribution](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/docs/binary-distribution.md), [container execution](https://github.com/supabase/cli/blob/v2.121.0/apps/cli/src/command-internal/container-cli.ts).
- **Inbox naming drift:** setup docs/source say Mailpit, while config reference retains `inbucket` keys. Prefer generated config and help from the pinned version, not mixed documentation snippets.
- **Two lifecycle APIs now coexist:** [multiple-project guide](https://supabase.com/docs/guides/local-development/running-multiple-local-projects) describes experimental `stack` since v2.119.0, automatic port allocation and identity by directory/branch/name. It changes status to `--env --output-format`, teardown to `stack destroy`, and removes `stop --project-id/--no-backup`; it is explicitly unstable. Do not mix those flags with the nonexperimental recipes above. Native process runtimes are also outside the goal of keeping tools/services in Docker.
- **Loopback-only publishing versus bridge tools:** the official localhost-binding recommendation and bridge tools using `host.docker.internal` are not automatically compatible on every platform. Choose/test the route; do not expose services broadly just to make the CLI probe work.

## Missing evidence / residual risks

- No empirical `--help`, `--version`, startup, reset, email, browser callback or teardown commands were run; no execution tool was available in this research role. Source support is not an end-to-end Docker demonstration.
- Need runtime confirmation of the selected pinned version on macOS Docker Desktop/OrbStack and Linux CI, particularly loopback host networking/hostname override and all required image architectures. Do not claim arm64 stack reliability merely from binary assets.
- Exact app auth environment names, existing plan/ADR constraints and migration compatibility were not audited. No implementation changes should follow without the parent reviewing relevant live planning references.
- Official general-purpose CLI runner image was not verified; build a repo-owned image rather than assuming `supabase/cli:latest` exists or trusting a similarly named community image.
- `source_check` was run for decision-critical distribution, mounts, network and security claims. It retrieved passages but returned **unclear** because automated semantic assessment was unavailable. Important originals were fetched and manually inspected; validation is source-based/manual, not automated corroboration.

## Sources

**Kept:** official Supabase installation/local-development, CLI/config/workflow/seeding/testing/Auth-admin docs; versioned `supabase/cli` source and release assets; Docker bind-mount, security, bridge/host/Desktop networking docs and official Docker image DinD usage. These directly establish distribution, lifecycle and topology semantics; concrete links are attached to findings above.

**Rejected/deprioritized:** community CLI runner images as installation recommendations (publisher provenance and maintenance not established); old socket-mounted single-Go-binary blog recipes (current distribution changed); search-result summaries as final evidence; experimental native/stack recipes as the initial repo default (different lifecycle and additional moving parts). The community image page was retained only to distinguish its ownership.

## Runtime follow-up (parent implementation)

The source-only research above was followed by an authorized Docker Desktop arm64 trial using official CLI 2.121.0 in the `supabase-tools` Dockerfile target. CLI version/init/start/status, migration replay, local reset, synthetic Auth administration, real email OTP through Mailpit, account-private Data API reads and scoped teardown were exercised. The manual Compose service graph was replaced by `supabase/config.toml` and `scripts/local.sh`. No hosted credentials, paid provisioning or deployment were used; existing prototype containers were left running.

Important empirical corrections:

- The tools container needs the Docker executable as well as the socket. Identical absolute workspace mounts and `SUPABASE_SERVICES_HOSTNAME=host.docker.internal` worked here, including access to explicitly loopback-published ports.
- The bridge `host_binding_ipv4=127.0.0.1` option did **not** make unqualified CLI port publishing loopback-only on this daemon. Verified `docker inspect` still showed `0.0.0.0` and `::`. The tools-only `scripts/docker-loopback.sh` adapter now explicitly qualifies published ports; inspection verified `127.0.0.1` for API, database and inbox. Do not describe the network option alone as a verified safety boundary.
- `db reset --local` also needs the same `--network-id` used by `start`. Without it, reset recreated the database on the default network, leaving Auth unable to resolve it. Passing the network on reset restored HTTP health from 503 to 200.
- Global `auth.enable_signup=false` disables public signup; `auth.email.enable_signup=true` is needed to keep the email provider enabled in this CLI configuration. Disabling both prevented provisioned-account email login. Public provider signup denial and successful provisioned-account OTP login are tested together.
- Browser containers use `app.test`, not the bare hostname `app`: Chromium treats `.app` as HSTS-preloaded and attempted HTTPS against the HTTP test server.
- A 60-second JWT lifetime is below supabase-js's 90-second proactive refresh margin and caused repeated refreshes across Proxy/render. Local JWT lifetime is 120 seconds; OTP expiry remains 60 seconds. Hosted defaults are separate settings.
- Synthetic test stacks alone enable Mailpit Chaos in their tools adapter to test SMTP delivery failures. No Docker socket or delivery switch is present in the application/browser containers or public application endpoints.

The committed public-boundary suite covers sign-in, invalid/expired codes, resend/rate limiting, SMTP failure/retry, real token refresh, session return, logout/replayed-cookie denial, direct account isolation and disabled signup. See [the authentication guide](../../../docs/authentication.md) for commands and limitations. Linux/amd64 CI, hosted configuration and actual Resend inbox delivery still require separate verification.
