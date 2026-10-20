# Domain Docs

This repo uses a single-context layout:

- `GLOSSARY.md` at the repo root.
- `docs/adr/` for architecture decision records.

## Before exploring

Read `GLOSSARY.md` and ADRs relevant to the area being explored.

If these files do not exist, proceed silently. Domain modeling
creates them lazily when terms or decisions are resolved.

## Use the glossary's vocabulary

Use glossary-defined terms when naming domain concepts in issue
titles, refactor proposals, hypotheses, and tests.

If a needed concept is missing, reconsider whether it belongs
to the domain or note the gap for domain modeling.

## Flag ADR conflicts

Explicitly surface recommendations that contradict an existing ADR:

> Contradicts ADR-0007 (...), but worth reopening because…
