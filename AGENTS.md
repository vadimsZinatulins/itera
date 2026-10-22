<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Docker-only Node tooling

- **Run all Node-related tooling inside Docker. Never run it on the host**, directly or through scripts or Git hooks. This includes `node`, `npm`, `npx`, other JavaScript runtimes/package managers, Next.js commands, dependency installs, builds, linting, type checks, tests, and Node-based browser automation.
- Start and stop the Next.js app through Docker. Use host-side `docker` commands to build, run, execute commands in, and stop containers; execute application/tooling commands inside the container.
- Use the existing `Dockerfile` and update it as needed. If Docker is unavailable, report the blocker; never fall back to host-side Node tooling.

## Branch workflow

- `main` is the integration branch for production code, prototype references, and live planning documentation.
- Start each implementation on a new feature branch from current `main`. Implement and test there, then merge back to `main` after the relevant Docker checks/tests pass. Include related documentation and issue-status updates in the same branch.

## Prototype and live planning references

- **Prototype — `app/*.prototype.tsx`, `app/*.prototype.module.css`, and `components/prototype-switcher.tsx`:** consult when designing or implementing workflows and UI. These are design references, not production-ready code; keep the production entry point and authentication intact. Historical prototype walkthroughs may describe the old branch's runtime rather than the current application.
- **Live documentation — `.scratch/production-release/`, `GLOSSARY.md`, and `docs/adr/`:** consult relevant notes before changing product behaviour, domain concepts, or architecture. Distinguish confirmed decisions from proposals and explicit deferrals; the documentation evolves alongside implementation.

## Agent skills

### Issue tracker

Issues and specs live as local Markdown under `.scratch/<feature>/`. Before publishing or fetching tickets, read `docs/agents/issue-tracker.md`.

### Triage labels

Use the five default triage roles. Before triaging issues, read `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` and `docs/adr/`. Before exploring the codebase, read `docs/agents/domain.md`.

## Reporting rules

### Concise

When reporting information to me, be extremely concise and sacrifice grammar for the sake of concision.
