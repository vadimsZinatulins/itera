# Learning Companion

A private companion for practising and retaining learning. Externally provisioned learner accounts sign in with email codes; public signup is disabled. Private Subjects contain durable Learning Document Drafts and explicitly approved Practice versions. Conversations and practice activities follow in later issues.

## Development and tests

**All Node tooling and browser automation run inside Docker.** Docker Compose and host Node/npm are not required.

```sh
scripts/local.sh start                   # local Supabase; Studio: http://localhost:55423
scripts/local.sh dev                     # application: http://localhost:3100
scripts/local.sh stop                    # preserve local development data
scripts/local.sh test tests/sign-in.spec.ts
scripts/local.sh test                    # full public-boundary suite (~4 minutes)
scripts/local.sh check                   # typecheck + lint
```

Tests create synthetic accounts, use real local Auth/Postgres/RLS plus a controlled email inbox, and run the standalone production application in Docker. The test run removes only its own services and data. Do not use production credentials in local tests.

See [authentication and setup](docs/authentication.md) for account provisioning, local email, runtime configuration, test isolation, free-plan limits and release checks. No deployment or live provisioning has been performed.

## References

- `GLOSSARY.md`: domain language.
- `prototype/main-workflow`: prototype design reference, not production authentication.
- `docs/production-plan`: accepted plan, architecture decision and issue specifications.
- [Dockerized Supabase CLI research](.scratch/production-release/research/supabase-cli-in-docker.md).
