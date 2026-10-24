# 07: Read Learning Documents through a validated workspace

**What to build:** The learner lists, opens and previews Learning Documents through a clearer workspace with validated read contracts, while existing editing continues working.

**Blocked by:** 01 — Read AI settings through validated outcomes.

Status: implementation candidate — awaiting independent review and separate merger; not resolved

- [ ] Prefactor workspace ownership around the working list/open/preview flow before later editor-state migration. Move associated CSS, explicit types, helpers and owned subcomponents into the required component layout without changing routes.
- [ ] Establish runtime read schemas and inferred contracts; validate once at relevant boundaries and consume parsed output. Type trusted records where invariants are established rather than scattering redundant guards.
- [ ] Use shared expected-failure outcomes and safe public error mapping for read operations; retain independent auth and data isolation.
- [ ] Preserve rendered Markdown through the installed library, empty/loading/error states, filtering, selected document, existing editor buffers and browser-history behavior. No competing editor owner or RHF migration yet.
- [ ] Public document/privacy/history tests verify list/open/preview, malformed read responses, outage recovery and account/Subject isolation; existing save/approval flows remain green.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration. Check import case sensitivity and server-only boundaries after moves.

## Execution evidence — candidate

- Branch `feat/typescript-conformance-07`; initial clean HEAD verified exactly `4686dc5925fabeedbc14f96c02974da64a95de7a`. Durable prepared-test checkpoint `e93f0f840a8e1beef2a0b3b4b090e0fd3979504b`; supervisor subsequently transferred exclusive global Docker gate to07.
- Implementation `5b603752663f1a0c5379a4c63fbbeda8db114291`: owner-local document schemas/inferred contracts, readonly shared Result read operations, safe HTTP serialization and closed diagnostic metadata; stable component directory export with workspace/list/output/Markdown ownership and unchanged moved CSS. Existing save/approval and editor field-state ownership retained.
- Merged latest integration `0355be0190d125be9269e18d3afc43ba33da38c2` via `e729b54eeaa9cb612777e3bd2bdd30b1dbb3eeb9`; final read-state fix `4b45bd40c7ae63f8257bd2611c51a4e6ae9e1b8d`. Latest integration rechecked unchanged before final commit.
- Supervisor approved a narrow shared-harness exception: additive `tests/auth-upstream.mjs` document read fault control, corrupting only successful real GET persistence responses after auth/RLS. No grants/schema or production test endpoint changes; control reset in finally. Existing settings controls/diagnostics verified by their unchanged suite.
- Meaningful REDs before each behavioral implementation: initial malformed revision lacked safe load alert; malformed refresh lacked safe refresh alert and accepted wrong-shaped records; public API returned200 rather than503 for malformed block/Practice JSON; opening/discarding a local Draft cleared the unavailable-list warning. Commands: `bash scripts/local.sh test tests/document-reads.spec.ts`, plus `--grep 'malformed refresh'`, `--grep 'malformed persistence'`, and `--grep 'invalid JSON'`. Each failed on expected observable behavior, then GREEN. Two earlier test-setup failures (ambiguous global alert locator; denied service-role corruption) were corrected, not counted as meaningful REDs.
- Five read tests now cover malformed initial/refresh reads, retained Draft/block buffers, server opaque JSON rejection, sanitized public payload/stderr, malformed JSON/null/object/null-row/503 collection responses, unavailable-list state across local navigation, Auth/Data outages, no-store HTTP contracts and explicit recovery with real local persistence/authentication.
- Final Docker checks after latest-integration merge and read-state fix: `bash scripts/local.sh check` passed (`next typegen && tsc --noEmit`, ESLint). `bash scripts/local.sh test tests/document-reads.spec.ts tests/documents.spec.ts tests/document-editor.spec.ts tests/document-history.spec.ts tests/document-privacy.spec.ts tests/practice-versions.spec.ts tests/practice-approval-guards.spec.ts tests/practice-large-document.spec.ts tests/practice-privacy.spec.ts tests/outage.spec.ts tests/openai-settings.spec.ts tests/subjects.spec.ts tests/subject-privacy.spec.ts tests/subject-boundaries.spec.ts tests/subject-creation.spec.ts` passed **29 tests**; harness Docker production build (`npm run build`) passed before tests. History/IME/export/stale-save/approval/large-document/privacy and integrated Subject navigation remain green.
- Residuals: full unrelated regression suite and deployed real-provider walkthrough unrun; existing npm high-severity advisory and unrs-resolver install-script warning remain. No dependency changes authored by07. Checklist acceptance remains for independent review; do not treat this evidence as integration/resolution.

## Context

Parent: [conformance spec](../spec.md). Retain Draft versus Practice version terminology and behavior; no schema or data-model redesign.
