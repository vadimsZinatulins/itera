# 18: Close conformance gaps and verify the integrated workflows

**What to build:** The maintainer can verify the integrated learner journey and account for remaining shared conformance gaps without relying on broken intermediate migrations or speculative cleanup.

**Blocked by:** 03 — Request and resend a sign-in code; 04 — Verify a sign-in code and recover access failures; 05 — Replace and remove an OpenAI key safely; 06 — Discover, select and check an OpenAI model; 07 — Read Learning Documents through a validated workspace; 08 — Create and save a Learning Document Draft; 09 — Approve a saved Practice version; 14 — Preserve soft assessment budgets with shared dates; 16 — Generate a Practice recap safely; 17 — Accept, correct or dismiss a Practice recap.

Status: ready-for-agent

- [ ] Reconcile the conformance audit against completed slices and current source. Record confirmed gaps addressed, compliant exceptions and explicitly deferred conditional proposals; no unreviewable catch-all rewrite.
- [ ] Close residual shared configuration boundary gaps through existing public access/settings/outage behavior: validate relevant environment contracts once, fail safely on missing/invalid configuration and retain server-only secrets and HTTP/control-flow behavior.
- [ ] Verify the combined public journey: login, AI settings, Subject creation, Draft save, Practice approval, conversation interruption/resume, assessment budget and recap review. Preserve privacy, input retention and explicit charged retry.
- [ ] Remove only superseded migration paths with no remaining callers after checking framework, config, generator and planning consumers. Resolve unwired deletion/recovery infrastructure by removing obsolete producer/consumer together only when justified, or document deferral to its owning deletion slice; never invent deletion behavior.
- [ ] Confirm touched handwritten code uses owner-local types/behavior, shared Results, approved schema/form/date integrations, readable control flow and safe diagnostics. Retained prototypes, configured aliases and official primitive conventions are not blanket cleanup targets.
- [ ] Run the full relevant public-boundary regression set, typecheck, lint and production build inside Docker; record commands/results and real blockers. Earlier tickets must already have landed green independently.
- [ ] Document remaining registry-control, localization, SDK/parser and state-model proposals as conditional, not invented defects. Any newly discovered broad work becomes a separately bounded follow-up rather than expanding this verification ticket.
- [ ] Follow the feature-branch workflow and include related documentation/status updates. No release-readiness, deployed-phone or live-provider claim without its actual evidence.

## Context

Parent: [conformance spec](../spec.md). Explicit blockers retain the approved breakdown (including some transitive edges). This is integrated verification and bounded residual shared-boundary work, not a place to defer failures from earlier tickets. No application implementation is authorized by publication alone.
