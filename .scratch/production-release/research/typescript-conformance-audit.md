# TypeScript conformance audit

## Verdict and scope

**Research only; no application/configuration changes, dependency installation, branch changes, commits, or tests run.** Primary authority: [TypeScript skill](../../../.agents/skills/typescript/SKILL.md#L6-L8). Its rules apply to new/touched code; findings below are an incremental backlog, not permission for a repository-wide rewrite or proof of historical misconduct.

Highest-value work: **boundary schemas and narrowing → shared operation Results/public-error mapping → one form migration → owner-local decomposition → shared dates**. Dependency approval is a prerequisite for Zod/RHF/Day.js adoption. Current behavior already has substantial ownership, privacy, conflict, interruption and charged-retry protections; preserve them.

### Inventory and evidence depth

Static inventory: `app/` 24 files, `components/` 20, `lib/` 10, `tests/` 28, `scripts/` 5. Counts include CSS/assets/shell/JS, not just TypeScript.

| Area | Examined | Treatment |
|---|---|---|
| Live app | Home/layout, login/settings pages; all 10 API route files | Production findings; preserve framework filenames |
| Live components | Account session/unavailable, Subject picker, Learning Documents, conversations, Practice recaps, assessment budget, OpenAI settings | Production findings; includes associated CSS ownership |
| Libraries | All 10 files: auth, OpenAI, assessments/timing/representation, chat recovery, document IDs, `utils` | Production findings |
| Primitives | Nine `components/ui/*.tsx`; Button source and Base UI render-prop types checked in detail | Official/generated-style baseline exception; provenance not independently compared with remote registry |
| Prototypes | Seven `app/*.prototype.tsx`, prototype CSS, switcher, runner | Design-reference lane, not live production conformance debt |
| Tests | All test titles/structure inventoried; deeper source inspection of fixtures, readiness, settings, Subject privacy, recovery and adaptive timing; other suites sampled by scenario | Coverage evidence, not a claim of an exhaustive test-code review or passing runs |
| Tooling | `tsconfig.json`, `next.config.ts`, `playwright.config.ts`, `eslint.config.mjs`, `next-env.d.ts` existence, package/lock, Dockerfile, shell launch/check paths and JS environment helper; test transport/adapter inspected by relevant sections | Root framework/generated files exempt from component layout; handwritten test/tool code is not automatically exempt |
| Domain | AGENTS, domain guide, glossary, sole ADR, production planning; selected SQL validation functions | Context for preserving behavior, not a full SQL/security audit |

Read [AGENTS](../../../AGENTS.md#L1-L45), [domain guide](../../../docs/agents/domain.md#L1-L26), [glossary](../../../GLOSSARY.md#L1-L36), [accepted ADR-0001](../../../docs/adr/0001-free-tier-managed-pilot.md#L1-L17), and [planning](../planning.md). Relevant constraints: private account-owned content; Draft versus Practice version; learner-reviewed Subject understanding; server-only/write-only keys; explicit charged retry; no first-version backup feature. Plaintext owner-pilot storage is an explicitly accepted temporary exception, **not a newly discovered TypeScript bug or authorization for additional users**.

### Dependencies and integrations actually found

- [Direct dependencies](../../../package.json#L18-L43): Next 16.4.2, React 19.3, Supabase SSR/JS, Base UI, shadcn CLI, React Markdown, CVA and `cn`. OpenAI uses direct `fetch`, not an installed OpenAI SDK ([integration](../../../lib/openai/server.ts#L38-L64), [stream](../../../lib/openai/server.ts#L106-L144)).
- **No direct `zod`, `react-hook-form`, `@hookform/resolvers`, or `dayjs` dependency** in that manifest; no existing shared Zod/RHF/Day.js integration in audited live sources. Zod 4.6.7 is present transitively in the lock ([entry](../../../package-lock.json#L11783-L11796)) and local source, but adopting it as an application dependency still requires approval. Do not rely on incidental hoisting.
- Lock records Supabase SSR 0.12.7, Supabase JS 2.118.0, React Markdown 10.1.0 and shadcn 4.22.1 ([SSR](../../../package-lock.json#L2394-L2418), [JS](../../../package-lock.json#L2432-L2457), [Markdown](../../../package-lock.json#L9706-L9729), [CLI](../../../package-lock.json#L10172-L10214)). The host `node_modules` snapshot is incomplete: SSR and React Markdown package files were unavailable, despite lock/manifest entries. This is not evidence of a broken Docker install.
- [Component configuration](../../../components.json#L1-L25) specifies **base-nova**, RSC/TSX, neutral CSS variables, Lucide and aliases. [Button](../../../components/ui/button.tsx#L1-L57) uses Base UI, CVA and direct `cn`; do not replace it with remembered Radix/`asChild` examples.
- Installed-source API verification: Zod `safeParse` accepts `unknown` and returns output-typed results ([source](../../../node_modules/zod/src/v4/classic/schemas.ts#L68-L79)); input/output helpers exist ([source](../../../node_modules/zod/src/v4/core/core.ts#L185-L186)); Base UI supports a React-element `render` prop ([types](../../../node_modules/@base-ui/react/internals/types.d.ts#L21-L34)). These `node_modules` links require a matching local install and are not durable tracked source.
- No external retrieval tool used. RHF/resolver and Day.js version/plugin compatibility and shadcn registry selection remain implementation prerequisites, not verified API recipes in this report.

## Confirmed production gaps

Priority indicates refactor value/risk reduction, **not demonstrated exploit severity**. Each item cites governing subsection and concrete source.

### F1 — Boundary validation is handwritten or implicit instead of schema-backed (P1)

**Rules:** [Validation and types — Zod](../../../.agents/skills/typescript/SKILL.md#L52-L60); [Library-first approval](../../../.agents/skills/typescript/SKILL.md#L42-L50).

Verified examples:

- [Auth request/verification](../../../app/api/auth/%5Boperation%5D/route.ts#L21-L46) starts with `unknown`, then manually narrows/normalizes email and code. [Subject creation](../../../app/api/subjects/route.ts#L13-L24) similarly narrows name and derives ownership server-side. These are useful existing checks, **not absent validation**, but do not satisfy the mandated Zod boundary.
- [Draft save](../../../app/api/documents/route.ts#L26-L35), [approval](../../../app/api/documents/approve/route.ts#L11-L20), and [recap mutation](../../../app/api/recaps/route.ts#L47-L53) use `JSON.parse` into inferred `any` followed by ad hoc checks. Draft nested block constraints are delegated to SQL; recap corrections likewise reach the RPC without a TS-side schema.
- [Conversation POST](../../../app/api/conversations/route.ts#L40-L61) has a real bounded reader, unknown input, field allowlist, UUID checks and byte limit, but assertions still bridge revision narrowing. Preserve this limit and validated normalization when replacing checks.
- [Configuration](../../../lib/auth/config.ts#L3-L17) checks presence and constructs URLs, but has no shared schema for environment URL/origin/key contracts.

**Direction:** after approval, place runtime schemas with owner-local validation helpers, consume only `safeParse` output, and export inferred aliases from `types/`. Preserve each endpoint's established accepted-field policy: Subject creation intentionally ignores a forged `account_id` while choosing ownership itself; indiscriminate strict-object conversion would change tested behavior ([test](../../../tests/subject-privacy.spec.ts#L13-L20)). Preserve code-point versus UTF-8-byte semantics; do not blindly replace all limits with string length.

**Relevance/tests:** centralizes contracts and safe field errors; does not replace auth, RLS, or RPC validation. SQL already protects [Draft block shape/uniqueness/limits](../../../supabase/migrations/202603010003_learning_documents.sql#L26-L45) and [recap shape/byte limits](../../../supabase/migrations/202603010008_reviewed_recaps.sql#L51-L55), consumed by [recap completion](../../../supabase/migrations/202603010008_reviewed_recaps.sql#L75-L81). Keep direct-data adversarial tests. Add wrong-type/null/array/extra-field, malformed JSON, Unicode and exact byte-limit cases at public endpoints; retain stale-save statuses and text recovery.

### F2 — External responses and storage feed typed consumers without complete narrowing (P1)

**Rules:** [Validation and types — Zod](../../../.agents/skills/typescript/SKILL.md#L54-L60); [Live code and invariants](../../../.agents/skills/typescript/SKILL.md#L126-L128).

- [Provider JSON](../../../lib/openai/server.ts#L56-L64) checks only `result.data` array before typed callback assumptions; [text extraction](../../../lib/openai/server.ts#L156-L164) assumes nested output/content array shapes and ends with `as string`. Valid JSON is not necessarily the modeled response.
- [Provider stream events](../../../lib/openai/server.ts#L134-L141) and [browser NDJSON events](../../../components/conversations.tsx#L149-L171) parse arbitrary JSON and branch on fields without modeling the complete event contract. The browser accepts assessment/source/status payloads directly into state.
- [Assessment parser](../../../lib/assessments/server.ts#L48-L62) receives `unknown`, immediately asserts `Output`, then performs extensive real shape/semantic checks. [Stored assessment snapshot](../../../app/api/conversations/route.ts#L110-L114) is asserted from a revision-presence test. The latter originates from an app-owned DB snapshot: establish and type that invariant rather than treating it as hostile user JSON at every downstream use.
- [Chat storage read](../../../lib/chat-recovery.ts#L7-L14) validates useful text/mode/operation relationships, but `JSON.parse` leaves `any`; a truthy non-object operation is not explicitly rejected before property checks. This is a boundary-hardening opportunity, not evidence of a successful malformed-data exploit.
- [Document response](../../../components/learning-documents.tsx#L106-L112), [recap response](../../../components/practice-recaps.tsx#L21-L26), and [settings response](../../../components/openai-settings.tsx#L25-L29) enter modeled state without schema parsing. Annotating `latest: Draft[]` ([refresh](../../../components/learning-documents.tsx#L127-L133)) does not perform validation.

**Direction:** distinguish external provider/storage boundaries from trusted app-owned persistence. Schema-parse external payloads once; use discriminated event unions; map malformed output to a safe explicit incomplete/failure outcome, never a fabricated success. For DB records, introduce typed integration contracts and validate genuinely opaque JSON where its invariant is established. Preserve assessment semantic rules (difficulty, assistance, pacing) after structural parsing; schemas alone cannot replace them.

**Relevance/tests:** chiefly robustness and trustworthy state progression; malformed provider data must not advance progress or trigger automatic charged retries. Extend existing [assessment rejection scenarios](../../../tests/adaptive-assessments.spec.ts#L118-L169), [provider failure scenarios](../../../tests/openai-settings.spec.ts#L119-L163), and [interruption/retry tests](../../../tests/chat-recovery.spec.ts#L40-L74) with syntactically valid wrong-shaped JSON, bad stream variants, corrupt localStorage, and interrupted frames. No claim that existing tests already cover every such shape.

### F3 — Expected application failures throw or use unrelated return shapes; no shared Result (P1)

**Rules:** [Errors — error-first results](../../../.agents/skills/typescript/SKILL.md#L86-L106).

- [Settings operations](../../../lib/openai/server.ts#L66-L103) throw `SettingsError` for expected missing key, unavailable model and persistence failures; [authorization/read/write](../../../lib/openai/server.ts#L23-L35) do the same. `SettingsError` carries message/status, not a recovery discriminant.
- [Requested budget parsing](../../../lib/assessments/server.ts#L6-L15) throws for a user-correctable duration; [assessment output rejection](../../../lib/assessments/server.ts#L49-L70) also throws expected failures.
- [Chat recovery save](../../../lib/chat-recovery.ts#L17-L24) returns a boolean for expected storage failure; read conflates empty, invalid and inaccessible storage as `null` ([read](../../../lib/chat-recovery.ts#L7-L14)). Not every distinction needs a separate UI category, but the application-operation boundary is not the prescribed tuple.
- [Settings route adapter](../../../app/api/settings/openai/route.ts#L7-L17) catches classes; [recap client action](../../../components/practice-recaps.tsx#L34-L45) throws response text into a catch rather than using a typed outcome.

**Direction:** introduce one shared `Result` type under a shared module's `types/`; migrate one vertical slice (settings first) with meaningful success values and a small recovery-oriented error union. Destructure and check `error !== null`; translate library-native `{ data, error }` only when crossing the application-operation boundary. Keep `Response` as the framework handler contract; don't replace HTTP responses, React handlers, every pure function or every intermediate provider result with tuples. Stream integration may retain a native iterator internally; define its final application outcome explicitly rather than forcing every token into a Result.

**Relevance/tests:** compile-time mutual exclusion and consistent UI recovery, not a newly found credential leak. Preserve distinct reauthentication, field correction, conflict/review, retry and explicit-charge-warning behavior. Existing detailed safe messages need not all become separate error codes. Use settings tests as contract tests; add checks that failure branches never consume a success value and public serialization has only approved fields.

### F4 — Broad catches conceal unexpected defects alongside expected outages (P1/P2)

**Rules:** [Errors: observability, framework control flow and public safety](../../../.agents/skills/typescript/SKILL.md#L100-L106).

[Conversation GET/outer POST](../../../app/api/conversations/route.ts#L12-L32), [stream catch/finalization](../../../app/api/conversations/route.ts#L135-L147), [document save catch](../../../app/api/documents/route.ts#L33-L37), and [settings-page catch](../../../app/settings/page.tsx#L12-L16) collapse all exceptions to an outage/incomplete state without reporting unknown defects. In particular, the stream catch retains only known `SettingsError` text; unknown persistence/provider/programming errors become indistinguishable. This is safe message containment, but incomplete operational observability.

**Direction:** keep public messages safe; translate known integration failures, preserve causes privately, and establish a minimal redacted reporting path for unexpected exceptions. Do not log raw upstream error objects, documents, prompts, emails, codes or keys. Logging architecture/retention beyond the accepted minimal operational policy needs agreement; no analytics service is proposed. **Do not move redirects into catches:** [Home](../../../app/page.tsx#L20-L34), [login](../../../app/login/page.tsx#L9-L17) and [settings](../../../app/settings/page.tsx#L12-L17) currently redirect outside catches. Installed Next docs confirm redirects throw ([reference](../../../node_modules/next/dist/docs/01-app/03-api-reference/04-functions/redirect.md#L57-L71)); no demonstrated swallowed redirect in these paths.

**Tests:** retain [outage/local-work scenario](../../../tests/outage.spec.ts#L4-L29); inject known outage versus unexpected adapter failure and inspect only sanitized metadata. Assert existing safe public payloads remain unchanged.

### F5 — Data-entry flows use manual React state instead of RHF + Zod (P2)

**Rules:** [Forms — React Hook Form](../../../.agents/skills/typescript/SKILL.md#L62-L66); [Validation](../../../.agents/skills/typescript/SKILL.md#L54-L58).

Verified manual field state/submission in [sign-in](../../../app/login/sign-in.tsx#L9-L42), [Subject creation](../../../components/subject-picker.tsx#L11-L30), [key form/model selection](../../../components/openai-settings.tsx#L8-L31), [document editor fields/block buffers](../../../components/learning-documents.tsx#L55-L70), and [recap corrections](../../../components/practice-recaps.tsx#L14-L18). The [conversation composer](../../../components/conversations.tsx#L217-L221) collects user-entered message/mode data and submits through custom state/recovery; it is not merely a search/filter control.

**Direction:** approval for direct RHF/resolver/Zod dependencies first, with official installed-version compatibility verification. Start with Add Subject, then login/settings. Keep simple action buttons, document query/filter and dialog/mobile-view state outside form infrastructure. Treat block editor and conversation recovery as separate migrations: transfer editable field ownership to RHF without erasing unsent text, stable operation identity or per-Subject session buffers. Use input/output types appropriate to normalization; no duplicate form-state mirror in `useState`.

**Counterevidence:** current code already provides labels, busy controls and visible errors: [Subject form](../../../components/subject-picker.tsx#L42-L49), [sign-in status/form](../../../app/login/sign-in.tsx#L50-L67), [document status/errors](../../../components/learning-documents.tsx#L149-L155), and [conversation status](../../../components/conversations.tsx#L237-L239). Missing RHF is not evidence these states are absent. Preserve focus behavior and write-only key clearing ([settings](../../../components/openai-settings.tsx#L16-L19)).

**Tests:** continue public browser tests for duplicate names, OTP correction/resend, pending submission, network failure and key clearing. For larger forms preserve save-versus-approve, stale-write recovery, navigation guards, IME-safe block saving and explicit charged retry. Avoid tests of RHF internals.

### F6 — Owner-local layout and explicit type placement diverge systematically (P2)

**Rules:** [Ownership and file layout](../../../.agents/skills/typescript/SKILL.md#L10-L22).

- [Learning Documents](../../../components/learning-documents.tsx#L12-L35) declares Block/Snapshot/Draft/SessionEdits, helpers and Markdown alongside the exported component; [DocumentWorkspace](../../../components/learning-documents.tsx#L55-L70) is an owned subcomponent in the same file. Its CSS is an associated file, so this is already a multi-file component without the mandated component directory/index layout.
- [Conversations](../../../components/conversations.tsx#L14-L43) mixes explicit transport/view types, operation helpers and component; associated CSS likewise warrants a directory. [Recaps](../../../components/practice-recaps.tsx#L8-L14), [settings](../../../components/openai-settings.tsx#L7-L8), [picker props](../../../components/subject-picker.tsx#L11-L17), [Home props/subject list](../../../app/page.tsx#L16-L19) and [assessment shared aliases](../../../lib/assessment.ts#L1-L5) are outside `types/`.
- [OpenAI module](../../../lib/openai/server.ts#L12-L38) combines explicit Credential type, helpers and application operations in one server module; [assessment server](../../../lib/assessments/server.ts#L6-L21) and [chat recovery](../../../lib/chat-recovery.ts#L2-L7) similarly lack role-based folders.

**Direction:** migrate by owner, not by globally centralizing all props. Login-owned sign-in stays near login; settings-owned form near settings; Home-owned workspaces/picker can live under Home's owned components. Keep shared auth/assessment/credential integration in the nearest genuine shared `lib` owner; exported pure representation/types must remain client-safe. Move declarations and behavior together in small batches, with runtime schemas beside validation and type-only exports from `types/`. Keep framework `page.tsx`, `layout.tsx`, `route.ts`, `proxy.ts`, configs and generated primitive files unchanged in naming. Avoid empty role directories and arbitrary helpers extracted only to shorten files.

**Tests:** typecheck/build after each move to catch import/case sensitivity and server-only contamination; browser smoke test the moved slice. File movement alone should not change routes/authentication or observable behavior.

### F7 — Date parsing/arithmetic/serialization bypass Day.js; local display is a separate proposal (P2)

**Rules:** [Dates and times — Day.js](../../../.agents/skills/typescript/SKILL.md#L76-L84); [Completion timing tests](../../../.agents/skills/typescript/SKILL.md#L134-L138).

Confirmed native-date usage: [timing helper](../../../lib/assessments/timing.ts#L4-L9) parses an instant and computes elapsed/remaining seconds; [budget creation](../../../lib/assessments/server.ts#L27-L33) serializes `new Date(Date.now()).toISOString()`; [UI start label](../../../components/assessment-budget.tsx#L16-L18) formats ISO with native Date. No shared Day.js integration exists. A direct dependency and any necessary plugins need approval/version documentation before migration.

**Important compliant part:** [AssessmentBudgetStatus](../../../components/assessment-budget.tsx#L8-L16) initializes `now` to `null`, updates it only after mount and has an interval with cleanup. The phase display derives from current props and current time. Do not report a missing live-clock refresh or server/client time mismatch there.

The start label is **explicit ISO instant text**, not currently browser-local formatting; the unconditional render is therefore not evidence of a browser-local hydration violation. If local user-facing display is desired, that is a conditional presentation change: introduce a small shared client timestamp component with a stable initial placeholder, Effect-driven text, relevant-input recomputation and explicit locale/timezone behavior. Preserve the instant; no arbitrary wall-clock date/timezone conversion. `Date.now()` used for stream checkpoint throttling ([route](../../../app/api/conversations/route.ts#L118-L123)) is operational elapsed-time sampling, not a timezone-display bug.

**Tests:** existing [soft-budget test](../../../tests/adaptive-assessments.spec.ts#L171-L229) controls browser time plus server harness offset and verifies expiry does not auto-submit or generate; [near-end test](../../../tests/adaptive-assessments.spec.ts#L232-L260) verifies resumability. Keep these. [Playwright config](../../../playwright.config.ts#L9-L15) sets no timezone; that is not a current ISO-display bug. A local-formatting change needs fixed clock/timezone tests in multiple zones, input changes, initial hydration placeholder and cleanup/remount cases.

### F8 — Compressed control flow and multi-responsibility functions obscure invariants (P2/P3)

**Rules:** [Readability](../../../.agents/skills/typescript/SKILL.md#L108-L122).

Confirmed unbraced/one-line control flow: [auth route](../../../app/api/auth/%5Boperation%5D/route.ts#L13-L25), [auth helpers](../../../lib/auth/server.ts#L27-L36), [budget parsing](../../../lib/assessments/server.ts#L6-L15), [component navigation](../../../components/conversations.tsx#L118-L126). Compressed validation/mutation and nested recovery ternaries appear in [assessment output](../../../lib/assessments/server.ts#L49-L70), [conversation persistence/error mapping](../../../app/api/conversations/route.ts#L63-L82), and [document list/render/dialog](../../../components/learning-documents.tsx#L136-L175). This is a concrete block-style mismatch; the skill requires multiline braced `if`s, not merely equivalent logic.

**Direction:** apply block style while touching each slice; name validation, persistence, provider invocation, progress commit and finalization phases. Extract meaningful owned subcomponents (editor/list/approval dialog; transcript/composer/progress) and error mapping helpers. Preserve order-sensitive saves, abort/finalization and input retention. Do not blanket-rewrite source or enforce arbitrary function-length limits. Optional future lint enforcement should exclude official primitives/generated files and remain a separate approved scope.

**Tests:** decomposition must preserve interruption, stale approval, navigation and unsaved-edit behavior; existing [editor behavior](../../../tests/document-editor.spec.ts#L4-L91), [approval failures](../../../tests/practice-approval-guards.spec.ts#L4-L47), and [recovery](../../../tests/chat-recovery.spec.ts#L108-L144) are high-value regression seams.

## Conditional proposals, not established bugs

### C1 — Review custom generic infrastructure before expanding it

**Rule:** [Library-first](../../../.agents/skills/typescript/SKILL.md#L42-L50).

The [manual provider SSE decoder](../../../lib/openai/server.ts#L125-L144) and [browser NDJSON decoder](../../../components/conversations.tsx#L149-L175) deserve a documented library-versus-local assessment before extension. No SDK/SSE parser is declared; that does **not** prove a compatible installed substitute exists or authorize adding one. SDK adoption would need approval and official installed-version checks, including timeout/abort, optional provider storage, output limits and no implicit retries. The browser NDJSON framing is app-specific and may remain a small local adapter. No demonstrated frame-loss bug is asserted here.

[UUID generator](../../../lib/document-id.ts#L1-L9) deliberately supports private HTTP dev/test origins where `getRandomValues` is available; replacing it with `crypto.randomUUID()` without checking that constraint is not justified. [Assessment intent/duration parsing](../../../lib/assessments/server.ts#L6-L25) is domain-specific and is not a generic natural-language/date engine that automatically requires a new package. Duplicated small UUID/reply helpers ([documents](../../../app/api/documents/route.ts#L4-L5), [approval](../../../app/api/documents/approve/route.ts#L4-L5), [conversations](../../../app/api/conversations/route.ts#L9-L10)) are a reasonable shared-owner cleanup when boundary schemas land, not a reason to add utility dependencies now.

### C2 — Native controls versus missing shadcn registry components

**Rule:** [UI — shadcn/ui](../../../.agents/skills/typescript/SKILL.md#L68-L74).

The [model select](../../../components/openai-settings.tsx#L51-L57) and [practice checkbox](../../../components/conversations.tsx#L217-L219) are native controls; installed primitives include Switch but not Select/Native Select/Checkbox. These are **composition candidates**, not proof a custom primitive implementation was substituted for an available registry component. Before changing them, consult current official shadcn docs/registry for base-nova/Base UI and select the semantics-appropriate component. A missing official registry component may be installed through the documented CLI in Docker under the skill's specific authorization; overwriting existing primitives or choosing a nonregistry alternative needs approval. Do not automatically turn a boolean checkbox into a Switch just because Switch is installed.

Existing positive composition: [Subject picker](../../../components/subject-picker.tsx#L33-L49) uses the installed menu/dialog and Base UI `render` button composition; [document approval](../../../components/learning-documents.tsx#L175-L175) composes installed Dialog children outside primitives. No primitive modification is recommended; exact upstream generation provenance was not verified remotely.

### C3 — Explicit UI-state unions where they clarify real transitions

**Rules:** [Validation/state modeling](../../../.agents/skills/typescript/SKILL.md#L60-L60), [Readability/state ownership](../../../.agents/skills/typescript/SKILL.md#L122-L122).

[Conversation state](../../../components/conversations.tsx#L20-L35) spreads loading/sending/retry/notice across independent values; [sign-in](../../../app/login/sign-in.tsx#L10-L17) separates email entry, sentTo, busy/error/notice. A load or submission discriminated union could make actual exclusive transitions reviewable. This is a maintainability proposal, **not evidence the UI currently reaches an impossible combination**. `practice`, mobile view and unsent draft are independent and should not be folded into one global state machine merely to reduce boolean counts.

[Document session synchronization](../../../components/learning-documents.tsx#L33-L52), [workspace Effect](../../../components/learning-documents.tsx#L55-L73), and saved-versus-draft snapshots are intentional unsaved-work/history behavior, not automatically redundant derived state. Keep a single authoritative editor/form owner if consolidating them; preserve [Back/Forward behavior](../../../tests/document-history.spec.ts#L4-L39). [Derived dirty state](../../../components/learning-documents.tsx#L29-L31) and [derived assessment](../../../components/conversations.tsx#L35-L35) are compliant counterexamples.

### C4 — A real future-facing cleanup candidate, not permission to remove prototype/config seams

**Rule:** [Live code and invariants](../../../.agents/skills/typescript/SKILL.md#L124-L128).

Reference search across app/components/lib/tests/scripts found no caller for [clearChatRecovery](../../../lib/chat-recovery.ts#L26-L38); it alone dispatches the event consumed by [conversation deletion listener](../../../components/conversations.tsx#L62-L72). Its comments explicitly target later deletion slices. This is **confirmed currently unwired infrastructure, conditional removal/deferral decision**, not a tested deletion failure: there is no current live deletion caller in audited sources. On touching deletion/recovery, either wire/test this seam or remove both producer and dead consumer together; check current planning before choosing. Also review unused-in-UI `pending_until` in [Turn](../../../components/conversations.tsx#L16-L16), [optimistic turn](../../../components/conversations.tsx#L160-L160), and [API projection](../../../app/api/conversations/route.ts#L30-L31) before changing a public response contract.

**Not dead:** [`lib/utils.ts`](../../../lib/utils.ts#L1-L1) is the configured generator alias ([configuration](../../../components.json#L15-L22)), even though existing primitives import `cn` directly. Prototype files are deliberate retained references; switcher is imported by the [prototype entry](../../../app/main-workflow.prototype.tsx#L13-L13), and the [prototype runner](../../../scripts/learning-profile.prototype.sh#L1-L14) is historical tooling, not a reason to replace the production Home/auth entry. [generateText's old “foundation” comment](../../../lib/openai/server.ts#L147-L150) is misleading maintenance text now that [recaps](../../../app/api/recaps/route.ts#L64-L66) and [model check](../../../app/api/settings/openai/check/route.ts#L7-L10) call it; the function itself is live.

## Exceptions and verified compliant foundations

| Rule | Verified counterexample / exception |
|---|---|
| Ownership | Framework route/page/layout/config/generated types retain framework filenames; generated-style primitives retain upstream inline prop typing. Do not apply F6 mechanically to [Button props](../../../components/ui/button.tsx#L43-L49) or [RootLayout](../../../app/layout.tsx#L20-L28). |
| Library-first | React Markdown already handles rendered Markdown ([wrapper](../../../components/learning-documents.tsx#L24-L26)); Base UI/CVA/`cn` are reused, not replaced with custom primitive infrastructure ([Button](../../../components/ui/button.tsx#L1-L5)). |
| Trust boundaries | Server ownership is derived, not supplied ([Subjects](../../../app/api/subjects/route.ts#L22-L24)); origin gates and byte-bounded readers exist ([conversation](../../../app/api/conversations/route.ts#L35-L61)). SQL remains an independent direct-data boundary, not needless duplicate validation. |
| Forms/UI states | Accessible labels, visible pending/errors and disabled controls already exist (F5); simple query/filter controls are allowed ordinary state ([documents](../../../components/learning-documents.tsx#L62-L63)). |
| shadcn | Application composition stays outside the installed Button/Dialog/Menu primitive baseline (C2). No confirmed unauthorized primitive customization from this static review. |
| Dates | ISO serialization represents instants unambiguously; budget clock mounts and cleans up (F7). No fabricated timezone/hydration bug. |
| Errors/public safety | Provider bodies/credentials deliberately do not reach public errors ([provider mapping](../../../lib/openai/server.ts#L47-L57)); settings status returns only presence/model ([status](../../../lib/openai/server.ts#L66-L70)). Tests explicitly assert key/unsafe-body exclusion ([tests](../../../tests/openai-settings.spec.ts#L119-L151)). No observed secret leak. |
| Native integration results | Supabase `{ data, error }` is appropriate inside integrations; pure [timing calculation](../../../lib/assessments/timing.ts#L4-L10), [document status](../../../components/learning-documents.tsx#L15-L17) and ordinary framework responses do not each need Result wrappers. |
| State/effects | Browser storage, lifecycle listeners, scroll synchronization and timers are legitimate external synchronization ([conversation effects](../../../components/conversations.tsx#L51-L72), [scroll](../../../components/conversations.tsx#L116-L116)); they are not all redundant React state. |
| Tests/tooling | Public-boundary browser/direct-data tests use real local persistence/auth and controlled OpenAI/email effects. Trace/screenshot/video capture deliberately off ([config](../../../playwright.config.ts#L9-L15)); Docker runner keeps Node tooling containerized ([check](../../../scripts/local.sh#L100-L105), [test](../../../scripts/local.sh#L83-L98)). |

## Incremental refactor batches

1. **Approve dependency and contract plan first.** Request direct Zod, RHF/resolver and Day.js adoption separately from any SDK proposal; verify selected versions/docs inside Docker. Preserve existing scope/limits/field policies, credentials exception and explicit retries. No dependencies added by this audit.
2. **Settings vertical slice:** owner-local layout/types; schemas for settings/provider responses; shared Result/public-error adapter; narrow unexpected-error reporting. Migrate key/model fields to RHF only once dependencies approved. Run settings/privacy/outage scenarios. Keep key transient and cleared, no silent model substitution.
3. **Small form + auth slice:** Subject form first as a low-risk RHF pattern, then login with code/resend/focus semantics. Boundary schemas and safe typed outcomes; retain ignored ownership input policy and account-enumeration resistance. Run Subjects/privacy/sign-in/recovery/expiry suites.
4. **Conversation/assessment boundaries:** typed validated provider/browser events and storage contract; validate opaque snapshot boundary; separate persistence/generation/finalization responsibilities with Results at application boundaries. Keep byte limits, no automatic retry, stable send identity, saved incomplete output and reviewed-only practice context. Run conversations, limits, chat recovery, approved-practice/privacy, reviewed-recaps and adaptive-assessments suites.
5. **Document ownership/editor slice:** directory/owned subcomponents/types first, then form ownership deliberately; preserve session/history buffers, block IME behavior, conflict recovery and explicit approval. Run document editor/history/save/privacy/large-document and all Practice-version/approval guard suites. Do not combine file movement with a data-model rewrite.
6. **Dates and bounded cleanup:** shared Day.js timing/instant helpers; local timestamp UI only if approved as presentation behavior. Retain soft-budget clock tests; add timezone/hydration cases if localization lands. Resolve unwired deletion seam with its owning slice, not speculative generic abstractions. Format touched control flow, not primitive/prototype sweeps.

For implementation batches use the [feature-branch workflow](../../../AGENTS.md#L20-L24). Relevant check paths are `bash scripts/local.sh check` (containerized type generation/typecheck/lint), `bash scripts/local.sh test [suite arguments]` (build/test stack), and the Docker build target ([Dockerfile](../../../Dockerfile#L27-L41)); do not run host Node tooling. Build/tests are prospective requirements, not run results.

## Rule coverage matrix

| Every primary-rule section | Audit outcome | Evidence / next step |
|---|---|---|
| Applicability/preamble | Applied to review; no blanket retrofit authorization | Skill L8; production/prototype separation above |
| Ownership and file layout | Confirmed gaps | F6; preserve primitive/framework exceptions |
| Library-first | Existing libraries reused; missing mandated deps need approval; generic stream replacement conditional | Dependency inventory, C1; no unsupported SDK/API recommendation |
| Validation and types — Zod | Confirmed schema/narrowing gaps; existing manual/SQL protections acknowledged | F1/F2, C3; do not multiply validation inside established contracts |
| Forms — React Hook Form | Confirmed manual form-state gap; current accessible/pending/error coverage acknowledged | F5; search/filter/action exceptions retained |
| UI — shadcn/ui | Composition largely aligned; native-control registry review conditional; no proven primitive-baseline violation | C2, component configuration and installed Base UI source |
| Dates and times — Day.js | Confirmed native API gap; post-mount/live-clock part compliant; local display proposal conditional | F7; preserve instant semantics |
| Errors — error-first results | Confirmed missing shared tuple/expected throws/observability gaps; public safety largely positive | F3/F4; preserve framework control flow/native integration shapes |
| Readability | Confirmed block/compression gaps; state-union improvement conditional | F8/C3; intentional snapshot/effect counterexamples |
| Live code and invariants | Unwired future seam verified; removal decision conditional; no speculative removal of config/prototypes | C4; SQL/contracts and independent boundaries retained |
| Completion | Static artifact only; prospective behavior/security/date tests mapped to batches; no runtime pass claimed | Test evidence throughout; limitations below |

## Limitations and validation record

- Read-only static audit of clean launch snapshot. Only this report was written. No source/config edits, generated artifacts, dependency installs, branch changes or commits performed.
- Commands used: Git status with per-command `-c safe.directory="$PWD"`; file inventory/counts, source/reference searches, line-numbered inspection, package/lock/source reads. One attempted Python package-version inventory failed because `python3` was unavailable; versions were checked manually from package/lock/source instead. No Node tooling executed on host or in Docker.
- Typecheck, lint, build, browser tests and deployed phone walkthrough **not run**: intentionally outside research scope, not a Docker-availability diagnosis. Docker daemon availability was not checked and is not claimed.
- Full live production TS source reviewed; test bodies and scripts were sampled by relevant boundary/scenario, not line-by-line exhaustive. SQL examined only to verify important protections already present. This is not a release readiness, complete privacy, accessibility or dependency-vulnerability audit.
- Installed-source snapshot incomplete; no live provider/model availability, SMTP delivery, free-tier feasibility, official remote shadcn registry provenance, RHF/resolver compatibility or Day.js plugins verified. Lockfile versions are not deployment evidence. No library API changes beyond locally verified concepts are prescribed.
- No proven exploit, saved-data-loss bug, swallowed framework redirect, local-date hydration mismatch or missing clock cleanup is asserted. Most findings are concrete policy/maintainability gaps with regression-sensitive implementation paths. Recheck current source/planning and obtain required approvals before implementation.
