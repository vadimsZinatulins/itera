# Incremental TypeScript conformance refactor

Status: ready-for-agent

## Problem Statement

The application has working production workflows and meaningful privacy, persistence, conflict and interruption protections, but its handwritten TypeScript does not consistently follow the project's current rules. Boundary contracts rely on manual checks and unchecked JSON assumptions; expected application failures use exceptions or unrelated return shapes; data-entry forms keep their own field state; and component ownership, type placement, date handling and control-flow style diverge from the documented conventions.

For the maintainer, these inconsistencies make changes harder to navigate and review. For the learner, careless cleanup risks losing unsaved work, changing approval semantics, hiding failures or repeating a potentially charged AI request. Conformance must improve without redesigning the product or weakening its existing contracts.

## Solution

Refactor the current live application incrementally into owner-local modules with validated boundaries, explicit expected-failure results, consistent form ownership and shared date handling. Preserve observable behavior, routes, public contracts, account isolation and all existing learning-domain distinctions.

Use small vertical slices with regression checks after each slice, rather than a repository-wide rewrite. Separate confirmed rule violations from optional improvements identified by the audit. Do not migrate retained prototype references or rewrite official generated UI primitives merely to make their style match application code.

The approved primary test seam is the running application's public boundary: browser workflows and direct public application/data requests, with real local authentication/persistence and controlled OpenAI/email effects. All Node tooling remains inside Docker.

## User Stories

1. As a maintainer, I want explicit types colocated with their narrowest owner, so that I can find and change contracts without searching unrelated modules.
2. As a maintainer, I want associated component files organized by responsibility, so that ownership remains clear as components grow.
3. As a maintainer, I want runtime validation schemas to define boundary types, so that handwritten declarations cannot silently diverge from validation.
4. As a maintainer, I want untrusted JSON narrowed before typed consumption, so that valid JSON with an invalid shape cannot corrupt application state.
5. As a maintainer, I want validation performed once per trust boundary, so that downstream code can rely on established invariants without speculative guards.
6. As a learner, I want invalid submissions explained safely, so that I can correct them without losing my input.
7. As a learner, I want authentication and account ownership enforced independently of browser validation, so that private content remains private.
8. As a maintainer, I want expected application failures represented by a shared error-first result contract, so that callers handle success and failure explicitly.
9. As a learner, I want failures to distinguish correction, reauthentication, conflict and retry where necessary, so that I know how to recover.
10. As a maintainer, I want unexpected defects reported through sanitized diagnostics, so that outages do not conceal programming errors.
11. As a learner, I want private content, login codes and API keys excluded from public errors and logs, so that troubleshooting does not expose my data.
12. As a learner, I want pending submissions, validation messages and failures to remain visible and accessible, so that I understand what the application is doing.
13. As a maintainer, I want data-entry field state owned by React Hook Form with Zod validation, so that forms follow one supported pattern rather than maintaining duplicate state.
14. As a learner, I want email-code correction, resend and focus behavior preserved, so that the sign-in refactor does not make access harder.
15. As a learner, I want AI settings to remain write-only with transient key entry cleared appropriately, so that form changes do not expose credentials.
16. As a learner, I want my selected supported model respected without silent substitution, so that refactoring does not change which model handles my requests.
17. As a learner, I want Learning Document edits and block buffers retained through the existing navigation and conflict flows, so that reorganizing code does not lose work.
18. As a learner, I want saving a Draft to remain separate from approving a Practice version, so that unapproved edits never become practice material accidentally.
19. As a learner, I want stale saves and approvals rejected without discarding my proposed text, so that another device's work is not silently overwritten.
20. As a learner, I want unsent conversation text and stable send identity preserved, so that interruption recovery does not duplicate messages.
21. As a learner, I want incomplete replies represented honestly and retries to remain explicit, so that refactoring cannot silently repeat charged AI work.
22. As a learner, I want malformed provider output rejected without advancing assessment progress, so that invalid AI responses do not become trusted learning state.
23. As a learner, I want assessment budgets to remain soft and resumable, so that time expiry never submits my answer or starts AI work automatically.
24. As a learner, I want Practice recap review and correction semantics preserved, so that only reviewed observations guide future practice.
25. As a maintainer, I want shared date handling with explicit instant semantics, so that parsing and arithmetic do not drift across modules.
26. As a maintainer, I want existing timer cleanup and stable initial rendering preserved, so that date refactoring does not create hydration or lifecycle problems.
27. As a maintainer, I want multiline control flow and named responsibilities in touched code, so that order-sensitive persistence and finalization logic is reviewable.
28. As a maintainer, I want existing libraries and generated UI primitives reused through supported APIs, so that custom infrastructure and unauthorized primitive modifications do not proliferate.
29. As the owner, I want dependency additions explicitly approved before installation, so that a conformance spec does not silently expand the dependency surface.
30. As a maintainer, I want behavior-level regression tests and Docker checks after each slice, so that structural improvements have evidence of compatibility.

## Implementation Decisions

### Authority and scope

- The governing TypeScript rules apply to handwritten production code changed by this effort. The audit is the evidence-backed backlog, not authorization to rewrite all historical code at once.
- This spec authorizes planning of the conformance work; it does not itself start implementation or installation. The user's approval confirmed the proposed test seam. Direct Zod, React Hook Form, official resolver and Day.js additions still require explicit dependency approval before installation. Do not rely on transitively installed Zod as an application dependency.
- Before implementation, inspect current integrations and official documentation for the selected installed versions. Follow the repository's installed Next.js guides for relevant framework changes. Preserve Base UI/base-nova conventions rather than substituting remembered Radix patterns.
- Preserve the accepted managed-stack architecture and owner-only credential-storage exception. No database schema, deployment architecture, provider selection or learning-domain redesign is required.

### Validated contracts

- Introduce owner-local runtime Zod schemas for request submissions, external provider responses, browser transport events, local storage and relevant configuration. Consume validated output rather than the original input. Expected invalid input uses safe parsing, not exception-driven validation.
- Export schema-inferred aliases through owner-local type modules using type-only dependencies. Distinguish schema input and output when normalization changes values.
- Preserve established endpoint field policies, normalization, status codes, UUID rules, Unicode semantics, bounded request readers and UTF-8 byte limits. In particular, creation of a Subject continues to derive account ownership server-side and retains its tested treatment of a forged ownership field; do not introduce blanket strict-object behavior that changes that contract.
- Authentication, RLS and SQL/RPC validation remain independent protections at their own boundaries. TypeScript schemas do not replace them.
- Establish typed contracts for trusted persistence records. Validate genuinely opaque JSON where its invariant is established; do not repeatedly treat every downstream internal value as hostile input.
- Model provider and browser stream event variants explicitly. Preserve partial output, abort/finalization behavior and failure states. Structural schemas supplement, rather than replace, assessment difficulty, assistance, progress and pacing checks.

### Expected failures and diagnostics

- Introduce one shared generic, readonly, two-branch error-first Result tuple: failure carries a structured error and null value; success carries a null error and meaningful success value. Errors have a recovery-oriented discriminant. Successful absence is explicit when needed.
- Migrate application operations with expected failures to this contract, beginning with AI settings. Consumers destructure and check the error against null before using the value; failures are handled, propagated or explicitly ignored with a reason.
- Keep pure calculations as ordinary values, framework handlers as HTTP responses, library-native results within integrations and stream iterators where appropriate. Do not wrap every expression or token in a Result.
- Use a small set of public error categories driven by distinct recovery behavior. Preserve correction, reauthentication, conflict/review and explicit retry where needed; do not invent a category for every backend cause.
- Separate public serialization from private diagnostics. Translate known integration failures and report unexpected exceptions through minimal redacted operational reporting. Never serialize private causes or log raw provider errors, conversation/document/bio text, keys or codes. Do not add analytics or a new reporting service without agreement.
- Preserve framework redirect/not-found control flow and existing safe public messages. Broad catches must not swallow framework control flow or silently hide unexpected defects.

### Forms, ownership and readability

- Migrate data-entry field state to React Hook Form with the official Zod resolver once dependencies are approved. Retain accessible labels, descriptions, field errors, visible pending/failure states and focus behavior.
- Start the reusable form pattern with Subject creation; migrate login and AI settings before the more stateful editor, recap correction and conversation composer flows. Simple action buttons, search/filter controls and independent view state do not require form infrastructure.
- Preserve document session buffers, saved-versus-edited snapshots, browser history behavior, block IME handling, unsent chat recovery and operation identity. Do not mirror RHF field state in ordinary React state. Persisting a recovery snapshot is external synchronization, not permission for competing authoritative field stores.
- Move explicit aliases/interfaces and props into the narrowest owner's type modules. Runtime schemas remain with validation. Organize associated actions, events, helpers and owned subcomponents alongside their owner, creating only populated folders.
- Components with associated files use a component directory whose index exports the actual component. Single-file components retain a component-named file. Preserve framework entry-point filenames and official generated primitive source conventions.
- Keep shared auth, credentials and assessment logic at their nearest genuine shared owner. Client-safe representations must not import server-only helpers through action or type dependencies.
- Use multiline braced control flow and meaningful responsibility boundaries in touched code. Separate validation, persistence, provider invocation, progress commit and finalization without changing their ordering. Extract responsibilities, not arbitrary line-count fragments.
- Derive render values where possible. Retain legitimate effects for browser storage, lifecycle listeners, scroll and clocks; do not classify intentional saved-versus-draft snapshots as redundant state.

### Dates, UI and conditional findings

- After approval, introduce a shared Day.js integration for date parsing, comparison, arithmetic and serialization. Verify plugin requirements and preserve unambiguous instant semantics and soft-budget behavior.
- Keep the current post-mount assessment clock, regular refresh and timer cleanup. Existing ISO timestamp text is not browser-local formatting and has no demonstrated hydration defect. Localization is not required by this refactor; if separately approved, use a small shared client display component with a stable placeholder and Effect-driven updates.
- Reuse installed shadcn components and preserve generated primitives. Native model selection and checkbox controls are conditional registry/composition review candidates, not established bugs. Consult official registry guidance before deciding whether a replacement is required; preserve semantics. Follow the skill's specific installation authorization for missing official components, and ask before overwriting primitives.
- Do not require OpenAI SDK/SSE-parser replacement. Assess existing dependencies and official APIs before expanding generic stream infrastructure; any new dependency needs approval and must preserve abort, limits, provider storage settings and no implicit retry.
- State unions are required where actual mutually exclusive states are being modeled, not as a mandate to combine every independent flag into a global state machine.
- Remove zombie code made obsolete by a touched slice only after checking references, framework/configuration consumers and current planning. Resolve the unwired deletion/recovery seam with its owning work; do not add deletion behavior merely to make the seam live. Retained prototypes and configured generator aliases are not dead code.

### Delivery sequence

- Establish dependency approval and contract-preservation constraints before any installation.
- Deliver AI settings as the first operation/validation/Result ownership slice; establish the small Subject form pattern alongside it, then migrate login.
- Address conversation, provider stream, assessment snapshot and storage contracts as a regression-sensitive slice, preserving incomplete output and explicit charged retries.
- Reorganize Learning Document ownership before changing editor form-state ownership; avoid mixing file movement with data-model changes.
- Complete shared dates and bounded cleanup after the relevant contracts are stable. Apply readability rules throughout touched slices rather than running prototype/primitive formatting sweeps.
- Follow the repository's feature-branch workflow for implementation. Relevant Docker type, lint, production-build and regression checks must pass before integration into main. Keep related documentation/status changes with each implementation slice.

## Testing Decisions

- **Confirmed with the user:** the primary seam is the running application's public boundary, reusing browser workflows and direct public application/data requests with real local authentication/persistence and controlled OpenAI/email effects. No new test-only production API or broad internal mocking seam is needed.
- Test observable outcomes and relevant failure paths, not component decomposition, private helper calls, RHF internals, exact file structure or arbitrary error-union size. Existing public HTTP contracts remain meaningful even when internal operation interfaces change.
- Use the existing settings/privacy/outage suites for key replacement/removal, supported model choice, inaccessible credentials, safe errors, pending states and provider failures. Add syntactically valid but wrong-shaped provider responses and assert no private diagnostics reach public payloads.
- Use existing Subject/privacy and sign-in/access/recovery/expiry suites for normalized submissions, ownership spoofing, invalid types, correction/resend/focus, enumeration resistance and outages. Cover nulls, arrays, malformed JSON, extra fields where relevant, Unicode and exact byte boundaries.
- Use conversation, limit, chat-recovery, approved-practice/privacy, recap and adaptive-assessment suites for stable send identity, interrupted/malformed stream events, corrupt local storage, saved incomplete replies and explicit retries. Invalid provider output must not advance progress, fabricate successful work or trigger automatic charged retries.
- Use document editor/history/save/privacy, large-document and Practice-version/approval suites for block buffers, navigation, IME input, stale saves, conflict text retention and save-versus-approve separation. Preserve direct-data adversarial tests independently of browser validation.
- Exercise recap accept/correct/dismiss behavior and stale revisions through the existing public flows. Preserve the distinction between tentative conversation context and reviewed observations informing Subject understanding.
- Retain controlled browser clock and server harness offset tests for soft assessment budgets, expiry, near-end behavior and resumability. If local date display is separately approved, add explicit timezone/clock, initial placeholder, changed-input and lifecycle cases; do not impose localization tests on unchanged ISO display.
- Verify sanitized unexpected-error reporting with controlled integration failures at existing transport/harness boundaries. Assert only approved metadata is reported, without introducing production fault-injection endpoints.
- Run all Node-related checks inside Docker: type generation/typecheck, lint, a production build and affected public-boundary suites after each slice. Run the full relevant regression set before completing the effort. These structural and runtime checks are complementary; browser tests alone do not prove conformance to layout or tuple conventions.
- If Docker or required external services are unavailable, report the exact blocker and unrun checks; never fall back to host Node tooling. A deployed real-provider phone walkthrough remains the existing release gate, not a new claim made by this spec.

## Out of Scope

- Implementing changes or installing dependencies as part of publishing this spec.
- New product workflows, route redesign, HTTP contract redesign, schema migrations, account administration, collaboration or admitting additional real users.
- Changing Draft/Practice version boundaries, Subject understanding semantics, recap policies, deletion scope, model catalogue, AI retry policy or provider retention settings.
- Credential encryption redesign, backups, infrastructure purchases, new analytics/error-reporting services or revisiting the accepted owner-pilot architecture.
- Blanket prototype migration, generated primitive rewrites, speculative guards, global state machines, generic utility frameworks or enforcing arbitrary function-length limits.
- Mandatory SDK/parser replacement, localized timestamp presentation or registry-control replacement without the separately required evidence/approval.
- Treating the static audit as proof of an exploit, a release-readiness assessment or a completed accessibility/security audit.

## Further Notes

- Evidence and exact source locations: [TypeScript conformance audit](../production-release/research/typescript-conformance-audit.md).
- Governing rules: [TypeScript skill](../../.agents/skills/typescript/SKILL.md), [project instructions](../../AGENTS.md), [domain glossary](../../GLOSSARY.md), and [accepted managed-pilot ADR](../../docs/adr/0001-free-tier-managed-pilot.md).
- Product invariants and prior test strategy: [first production release spec](../production-release/spec.md). This conformance spec does not supersede accepted product decisions or authorize deferred features.
- The audit was static and did not run typecheck, lint, builds or tests. Publishing this spec also makes no runtime verification claim. Recheck source and planning before implementing each slice.
- Publication status is ready-for-agent per the requested workflow. This is a specified backlog, not blanket approval for installations: request the outstanding dependency approvals before executing blocked migration slices. No implementation issues are created by this publication.
