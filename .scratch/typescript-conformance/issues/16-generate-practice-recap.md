# 16: Generate a Practice recap safely

**What to build:** The learner requests or accepts an offered recap-generation workflow that produces a validated proposal, with explicit recoverable failure rather than unreviewed conclusions about understanding.

**Blocked by:** 12 — Generate and persist an ordinary practice reply; 15 — Load Subject understanding and pending recaps.

Status: ready-for-agent

- [ ] Validate generation requests and ordinary provider output at their boundaries, consume parsed values and reject malformed or semantically invalid proposals before persistence.
- [ ] Migrate expected generation/persistence failures to shared Result outcomes and safe public errors; sanitize unexpected diagnostics without exposing transcript, sources or provider bodies.
- [ ] Preserve current Subject/source scope, reviewed checkpoint coverage, assessment difficulty/assistance qualifications and incremental proposal semantics. A proposal never silently updates reviewed understanding.
- [ ] Preserve user-initiated generation, meaningful checkpoint offers and charge-aware explicit retry feedback. No fixed-message trigger, background regeneration, automatic retry or mandatory conversation ending.
- [ ] Keep recap schemas/types/actions/helpers owner-local and ordered validation/provider/persistence phases readable. Existing accept/correct/dismiss behavior remains green before its migration.
- [ ] Public reviewed-recap/provider/privacy tests cover valid generation, wrong-shaped JSON, malformed proposal, missing qualification data, persistence/provider failure and explicit retry.
- [ ] Relevant typecheck, lint, build and affected tests pass inside Docker before feature-branch integration; no new SDK/dependency without approval.

## Context

Parent: [conformance spec](../spec.md). This slice produces proposals only; review operations migrate independently.
