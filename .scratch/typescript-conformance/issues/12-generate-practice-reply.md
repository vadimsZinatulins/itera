# 12: Generate and persist an ordinary practice reply

**What to build:** The learner receives and retains an ordinary practice reply with trustworthy progress and explicit failure recovery even when provider output or the connection is malformed or interrupted.

**Blocked by:** 06 — Discover, select and check an OpenAI model; 11 — Recover and submit an unsent message.

Status: ready-for-agent

- [ ] Validate relevant provider stream and browser event payloads once at their boundaries using explicit discriminated variants. Correctly handle malformed JSON, wrong shapes and interrupted frames without fabricated success.
- [ ] Separate source selection, persistence, provider invocation, progress checkpointing and finalization responsibilities; migrate expected application failures to shared outcomes while retaining native streaming internally where appropriate.
- [ ] Preserve request/output byte limits, abort behavior, saved partial output, complete/incomplete status, stable operation identity and no automatic charged retries. Maintain existing provider storage settings and explicit charge warnings.
- [ ] Preserve approved-source selection, reviewed-only understanding context, provenance and the no-approved-material behavior. Drafts, Reference notes, other accounts and unrelated Subjects remain excluded.
- [ ] Unknown failures use sanitized diagnostics without leaking prompts, keys, documents or raw upstream bodies. Keep public recoverability and HTTP/stream contracts compatible.
- [ ] Keep schema/types/helpers/actions under real owners; pure representation remains client-safe. SDK/parser replacement is not required and any new dependency needs approval.
- [ ] Public conversation/limits/recovery/approved-practice/privacy tests cover ordinary success, malformed stream variants, interrupted frames, provider/persistence failure, incomplete history and explicit retry. Existing assessment behavior remains green before its migration.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration.

## Context

Parent: [conformance spec](../spec.md). This slice migrates the ordinary generation path end to end, not the assessment semantics or model catalogue.
