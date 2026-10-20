# Issue tracker: Local Markdown

Issues and specs for this repo live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- Spec: `.scratch/<feature-slug>/spec.md`
- Implementation issues: one file per ticket at
  `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`.
- Triage state: a `Status:` line near the top of each issue file.
  Use the role strings in `triage-labels.md`.
- Comments and conversation history: append under `## Comments`.

## When a skill says "publish to the issue tracker"

Create the appropriate spec or issue file using the paths above.
Create parent directories as needed.

## When a skill says "fetch the relevant ticket"

Read the referenced file. If given only an issue number, locate it
within the relevant feature's issues directory.

## Wayfinding operations

Used by `/wayfinder`. The map has one child file per ticket.

- Map: `.scratch/<effort>/map.md`, containing Notes,
  Decisions-so-far, and Fog.
- Child ticket: `.scratch/<effort>/issues/NN-<slug>.md`,
  numbered from `01`, with the question in the body.
- Type: a `Type:` line records `research`, `prototype`,
  `grilling`, or `task`.
- Status: wayfinding tickets use `open`, `claimed`, or `resolved`.
- Blocking: `Blocked by: NN, NN` near the top. A ticket is
  unblocked when every listed ticket is resolved.
- Frontier: scan for open, unblocked, unclaimed tickets;
  lowest number wins.
- Claim: set `Status: claimed` and save before starting work.
- Resolve: append the answer under `## Answer`, set
  `Status: resolved`, then append a gist and link to the map's
  Decisions-so-far.
