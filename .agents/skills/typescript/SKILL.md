---
name: typescript
description: "TypeScript/TSX coding standards. Use when writing, modifying, or reviewing .ts or .tsx files: library selection, validation, forms, UI, dates, errors, and readability."
---

# TypeScript and TSX

Apply these rules to new and touched code. Keep broader migrations separate from the requested change. During review, report violations in the review scope rather than rewriting code.

## Ownership and file layout

Colocate code with its narrowest owner. Use these folders inside the owning component directory, alongside the owning `page.tsx`, or inside the owning shared module:

- `types/`: all explicitly declared types and interfaces, including component props and Zod-inferred type aliases. Preserve inference for local values. Keep runtime Zod schemas with validation logic and export their inferred types from `types/` using type-only imports/exports.
- `actions/`: application operations and server actions.
- `events/`: event handlers.
- `helpers/`: helper functions.
- `components/`: owned subcomponents, following the same component layout recursively.

Create folders only when they have content. Lift code used by multiple owners to their nearest shared owner. Globally shared UI belongs under the project's global `components/`; globally shared non-UI code belongs under global `lib/`, with the same role-based folders inside the appropriate module. Keep imports compatible with client/server boundaries; importing an action must not pull server-only helpers into client code.

A single-file component uses its component name as the filename and exports that component. Once a component has associated files, place it in a directory named for the component, with `index.tsx` exporting the actual component. This includes associated types, actions, events, helpers, and subcomponents. Preserve framework entry-point filenames and official generated shadcn source as required by their respective rules.

For example, a page-owned multi-file component can have this layout:

```text
app/settings/
  page.tsx
  types/
  actions/
  components/
    profile-form/
      index.tsx
      types/
      actions/
      events/
      helpers/
      components/
        avatar-picker.tsx
```

## Library-first

Before implementing generic functionality, inspect installed dependencies and existing project integrations. Reuse their supported APIs. For nontrivial functionality without an existing solution, investigate established libraries before writing custom infrastructure. Keep domain-specific logic and trivial operations local.

Consult official documentation for the installed version before using a library API. Follow repository framework guidance as well. Choose supported APIs over remembered examples; verify compatibility and required plugins or adapters.

Ask before adding a dependency, except for the authorized shadcn component installation below. If approval or documentation is unavailable, surface the blocker rather than silently recreating library functionality.

Run every package-manager, component-generator, and other Node tooling command inside the project's frontend container. Inspect the repository's Docker setup to identify it; use host-side Docker commands to execute tooling there. If Docker is unavailable, report the blocker. Follow the repository's Docker-only tooling policy for checks as well.

## Validation and types — Zod

Validate untrusted inputs at trusted boundaries: requests, external responses, storage, configuration, and form submission. Use Zod and consume the validated output, not the original input. Client validation improves feedback; validate again at the trusted server boundary.

Use `safeParse` or `safeParseAsync` for expected validation failures. Infer types from schemas instead of maintaining parallel declarations; distinguish schema input and output types when transformations change the shape.

Validate once per trust boundary, then let downstream code rely on the established invariants. For example, a client calculation consuming a form value already validated as greater than zero can use it directly. An input attribute alone is not proof: ensure the calculation receives the validated value. The backend independently validates API input because callers can bypass the frontend. Add guards for reachable invalid states, not hypothetical violations of an established contract.

Accept `unknown` at untrusted boundaries and narrow it. Prefer inference, explicit modeling, and checked narrowing over `any`, unchecked type assertions, and non-null assertions. Model mutually exclusive states with discriminated unions rather than independent booleans.

## Forms — React Hook Form

Use React Hook Form for forms collecting and validating user-entered data. Connect Zod through the official resolver, using compatible versions and schema input/output types. Reuse the project's field components and accessible labels, descriptions, and validation messages.

Keep field state in React Hook Form rather than duplicating it in React state. Represent pending submissions and failures visibly. Simple action buttons and search/filter controls may use ordinary React state when they do not need form infrastructure.

## UI — shadcn/ui

Consult official shadcn documentation and the project's component configuration before selecting or adding a component. Preserve the configured style, primitive library, and conventions.

Reuse installed components. When a needed component exists in the official registry but is missing locally, install it with the documented official CLI command inside the frontend container. This component installation and its required dependencies are authorized without further approval. Inspect the generated diff; ask before overwriting existing components or making unrelated changes.

Use the official generated source as the primitive baseline. Compose application-specific UI outside primitives through supported props, variants, and children. Ask before modifying primitive implementations. If the registry has no suitable component, report the gap and obtain agreement on an alternative rather than inventing a replacement for an existing registry component.

## Dates and times — Day.js

Use Day.js for date, datetime, and time parsing, validation, comparison, arithmetic, and formatting. Reuse a shared project integration and configure required plugins there. Prefer explicit formats and strict validation for non-ISO input; follow the documented plugin requirements.

Distinguish instants, calendar dates, and wall-clock times. Preserve their intended semantics instead of assigning an arbitrary date or timezone. Make timezone and locale choices explicit where they affect behavior; exchange instants in an unambiguous serialized format.

For browser-local, user-facing date/time display, use a shared client component that computes display text after mount in `useEffect`. Render the same stable placeholder on the server and initial client render. Recompute when relevant inputs change. Clean up timers for live clocks; a one-time Effect does not keep relative time current. Keep the client boundary small.

Server-side calculations, validation, and serialization remain valid. Server-produced non-browser outputs, such as emails, exports, and documents, may format dates using an explicit locale/timezone. The post-mount rule concerns browser-local display, not all server date processing.

## Errors — error-first results

Return a two-element discriminated tuple for application operations with expected failure. Use one shared project type rather than duplicating it across modules:

```ts
type Result<T, E extends { code: string }> =
  | readonly [error: E, value: null]
  | readonly [error: null, value: T];
```

The error is a structured, non-null value with a discriminant such as `code`. Exactly one tuple branch is present: failure carries an error and no result; success carries a result and no error. Prefer a meaningful non-null success value; model successful absence explicitly if needed.

Destructure the tuple and check `error !== null` before consuming the result. Handle failure, propagate it, or visibly ignore it with a named ignored-error binding and a short reason. Tuple typing makes the branches mutually exclusive; it does not enforce error consumption by itself.

Pure functions without an expected failure path return ordinary values. Retain library-native result shapes within integrations, such as Zod's `safeParse` result or a provider's `{ data, error }`; normalize them to the tuple at application-operation boundaries. Avoid wrapping every intermediate expression in a result.

Represent expected application failures with results instead of explicit throws. Catch third-party exceptions at integration boundaries and translate known failures into typed errors. Preserve framework-required control flow, including redirect/not-found mechanisms, rather than swallowing it in broad catches. Keep unexpected defects observable through the project's error-reporting path instead of silently turning them into success or ignoring them.

Model error categories around distinct UI behavior or recovery actions, not an exhaustive catalog of backend failure causes. When several failures lead to the same generic retry state, use one shared category and a safe message such as "Something went wrong. Please try again." Add a distinct category only when the caller needs different UI handling, such as field correction or reauthentication.

Separate public error information from private diagnostics. An internal error may carry a diagnostic message or cause for logging, but explicitly serialize only safe public fields in backend responses. Keep diagnostic detail out of user-visible messages and client payloads; redact credentials and private content before logging.

## Readability

Use small, cohesive functions with meaningful names and multiline bodies. Separate logical phases with blank lines. Extract a function when it names a responsibility, not just to meet a line-count limit.

Every `if` uses braces and a multiline body, including early returns and assignments:

```ts
if (error !== null) {
  return [error, null];
}
```

Apply the same block style to other control flow. Keep concise expressions where they remain easy to scan, such as `items.map(getId)`. Prefer named intermediate values over nested ternaries, compressed chains, or several operations on one line.

In React, derive values during rendering when possible. Use Effects for external synchronization and the browser-local date display rule above, rather than maintaining redundant copies of derived state. Keep state close to its owner.

## Live code and invariants

Keep only code needed by current behavior. Remove zombie code made obsolete by the change: unused imports, variables, functions, unreachable branches, commented-out implementations, and superseded compatibility paths. Confirm references and framework entry points before removing apparently unused code; keep unrelated cleanup outside the task scope.

Implement protections for actual boundary risks and reachable failure states. Rely on validated contracts internally instead of adding speculative guards, silent fallback values, or abstractions for scenarios the application does not support. When a contract is unclear, establish where it is enforced rather than layering defensive checks throughout its consumers.

## Completion

Before finishing, account for each changed behavior and boundary:

- Generic functionality uses an existing library, an approved addition, or an explained domain-specific/trivial implementation.
- Untrusted input is validated, expected failures are handled or visibly ignored, and exclusive states are modeled explicitly.
- UI covers relevant pending, empty, validation, and failure states with accessible semantics.
- Tests cover observable behavior and relevant failure paths rather than component internals; date-sensitive tests control the clock and timezone where relevant.
- Relevant type, lint, and test checks pass inside Docker. Report checks not run and the blocker; distinguish instructions-only changes from application changes requiring runtime verification.
