# Learning Companion

A private companion for practising and retaining learning. Externally provisioned learner accounts sign in with email codes; public signup is disabled. Private Subjects contain durable Learning Document Drafts and explicitly approved Practice versions. Conversations and practice activities follow in later issues.

## Development and tests

**All Node tooling and browser automation run inside Docker.** Docker Compose and host Node/npm are not required.

```sh
scripts/local.sh start                   # local Supabase; Studio: http://localhost:55423
scripts/migrate.sh                       # apply pending migrations; preserve local data
scripts/migrate.sh --force               # DELETE local data and replay all migrations (confirmation required)
scripts/local.sh dev                     # application: http://localhost:3100
scripts/local.sh stop                    # preserve local development data
scripts/local.sh test tests/sign-in.spec.ts
scripts/local.sh test                    # full public-boundary suite (~4 minutes)
scripts/local.sh check                   # typecheck + lint
```

Tests create synthetic accounts, use real local Auth/Postgres/RLS plus a controlled email inbox, and run the standalone production application in Docker. The test run removes only its own services and data. Do not use production credentials in local tests.

Migration commands require the local stack to be running. `--force` deletes local accounts, content and saved API keys; stop the app first. Neither mode targets hosted databases. If schema objects were previously applied without migration-history records, the default mode stops rather than guessing which records to repair; review history or deliberately rebuild with `--force`.

See [authentication and setup](docs/authentication.md) for account provisioning, local email, runtime configuration, test isolation, free-plan limits and release checks. No deployment or live provisioning has been performed.

## Branch workflow

`main` contains the current implementation, prototype design references, and production planning. Create a new feature branch from current `main` for each implementation; update code and related docs, run the relevant Docker checks/tests above, then merge back to `main`. Separate long-lived prototype and planning branches are no longer required.

## References

- `GLOSSARY.md`: domain language.
- `app/*.prototype.tsx` and `app/*.prototype.module.css`: prototype design references, not production authentication or routes. Historical prototype launch instructions do not describe the current production entry point.
- [Production spec](.scratch/production-release/spec.md), [planning history](.scratch/production-release/planning.md), [issue specifications](.scratch/production-release/issues/), and [architecture decisions](docs/adr/).
- [Dockerized Supabase CLI research](.scratch/production-release/research/supabase-cli-in-docker.md).
