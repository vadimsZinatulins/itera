# Research: Vercel + Supabase first-production feasibility

**Research date:** live retrieval during this run; the tool environment does not expose a trustworthy calendar date, so an exact YYYY-MM-DD cannot be attested. Page metadata encountered includes updates through September 2026; those are source dates, not a substitute for the research date. Prices below are USD as retrieved, not quotes.

## Summary
The candidate has the primitives needed for provisioned-user email OTP, private durable documents/conversations, profile images, and streamed hosted-AI requests. It is **conditionally feasible, not approved**: production SMTP, enforced ownership/approval boundaries, recovery expectations, runtime alignment, and cost/availability trade-offs remain release decisions. No provider or plan is selected here; neither budget alerts nor this combination promise a total hard spending ceiling.

Context read only: `package.json`, `Dockerfile`, `GLOSSARY.md`, `.scratch/production-release/planning.md`. The user's clarified launch scope takes precedence over that planning file's older “no confirmed decisions” status. No Node tooling, installations, implementation, provisioning, credentials, or project edits were performed.

## Findings

### 1. Pre-approved users and OTP
**Verified; direct evidence; high confidence.** Supabase can disable **Allow new users to sign up**, leaving only existing users able to sign in. Owner-controlled creation can use the server-only Auth admin `createUser` API, including email-only creation with `email_confirm: true`; its privileged key must never reach a browser. See [Auth configuration](https://supabase.com/docs/guides/auth/general-configuration) and [createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser).

**Recommendation / interpretation:** provision only owner-approved addresses through a trusted administrative process; disable public signup and anonymous sign-in, expose no signup UI, and also set `shouldCreateUser: false` on every OTP request. UI omission alone is not access control. Auto-confirming a provisioned address is an administrative trust decision, not proof the recipient has verified it; the subsequent email OTP establishes inbox possession. Test the complete existing-user flow with public signup disabled before launch.

**Verified; direct evidence; high confidence.** `signInWithOtp` otherwise creates unknown users by default. It sends a magic link by default: change the Magic Link template to include `{{ .Token }}` for a six-digit code, then call `verifyOtp` with email, token and `type: 'email'`. Defaults are one request per user per 60 seconds and one-hour expiration; both need deliberate production review. [Passwordless email](https://supabase.com/docs/guides/auth/auth-email-passwordless).

### 2. Email delivery is a separate production dependency
**Verified; direct evidence; high confidence.** Built-in SMTP sends only to Supabase **organization team-member addresses**, currently at **2 messages/hour**, with no delivery/uptime SLA, and is explicitly not intended for production. An app user pre-created in Auth is not thereby a team member: do not give learners infrastructure access to bypass this restriction. Custom SMTP requires a sending service/account, host/port/credentials and From address; Supabase initially applies **30 messages/hour**, adjustable separately from the email provider's own quotas. Supabase recommends sender-domain SPF, DKIM and DMARC. [SMTP prerequisites and restrictions](https://supabase.com/docs/guides/auth/auth-smtp).

**Recommendation:** require verified sender-domain/DNS setup, real recipient delivery tests, explicit rate settings and abuse handling before accepting commute-ready login. SMTP service price, sandbox restrictions and delivery geography are **not yet evaluated** because no email provider is selected. Paying for Supabase does not remove the need for this delivery setup.

### 3. Revocation is not instant JWT invalidation
**Verified; direct evidence; high confidence.** Deleting an Auth user invalidates refresh capability but already-issued access JWTs remain valid until expiry. A temporary ban does not revoke existing sessions. Sensitive operations can check `session_id` against `auth.sessions`; account deletion is also blocked while the user owns Storage objects. [User management and removal](https://supabase.com/docs/guides/auth/managing-user-data).

**Recommendation / inference:** decide whether bounded expiry is acceptable or removal must take effect on every protected request. For immediate suspension, an application-controlled active-user check would need enforcement across DB policies, storage and AI endpoints—not just the UI. Define retention versus destructive deletion separately, including image cleanup and what to do with still-valid signed URLs or downloaded data.

### 4. Private durable data and scoped AI are suitable, but not automatic
**Verified primitive; direct evidence; high confidence.** Postgres RLS supports owner checks such as `auth.uid() = user_id` for reads/deletes and `WITH CHECK` for writes, including preventing owner reassignment. Every exposed table needs RLS **and appropriate grants**; views and privileged service operations require special attention. User-editable metadata is unsuitable as an authorization source; secret/service-role credentials bypass ordinary restrictions. [RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security).

**Suitability interpretation; medium confidence until implementation/tests:** persist profiles, Subjects, Reference notes, Learning Documents, version content, conversations and messages in owner-scoped tables. This supports cross-device durability without requiring Realtime, shared workspaces or offline synchronization. RLS establishes ownership—not the domain rule that only approved Practice versions may feed practice.

**Recommendation:** keep Draft and immutable approved Practice snapshots separate, with explicit approval and an approved-version reference changed atomically. Server-side practice retrieval must select only that user's approved snapshot; client-supplied document IDs or approval flags are insufficient. Keep manual documents/manual approval authoritative. Store chat messages and generation status durably, including interrupted/failed responses, so a lost mobile connection is recoverable rather than mistaken for a completed answer. Scope each hosted-model request to authorized task context; optional bio needs permission, and Reference notes/Drafts must not silently become practice material. Model retention, residency, pricing and contractual treatment remain unverified because no AI API is selected.

### 5. Profile pictures can remain private
**Verified primitive; direct evidence; high confidence.** Storage uses RLS on `storage.objects`; official examples restrict uploads to the user's ID folder and reads to the object's owner. Upsert requires additional SELECT/UPDATE policies. Public buckets are already publicly accessible, and privileged service keys bypass Storage RLS. [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

**Recommendation:** use a private bucket with owner-scoped read/write/delete policies, constrained size/type, and authenticated delivery or short-lived signed access—not a public “avatars” example copied uncritically. Image files require their own recovery strategy; database backups contain only their metadata.

### 6. Actual repo runtime: framework fit, unresolved deployment parity
**Verified local evidence:** repo pins **Next.js 16.4.2**, **React/React DOM 19.3.0** and `eslint-config-next` 16.4.2; there is no Node `engines` constraint in the inspected manifest. Docker uses **`node:26`**, installs with `npm ci`, and starts **`next dev`**, not a production build/server. Supabase/AI integration dependencies are not present in this manifest.

**Verified official evidence; high confidence:** Vercel supports Next.js server rendering and streaming, but its fetched Node-version page currently lists **24.x (default) and 22.x**, not 26. [Next.js deployment support](https://vercel.com/docs/frameworks/full-stack/nextjs), [supported Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

**Interpretation:** Vercel's normal framework build is plausible; the current development Dockerfile is not evidence of production readiness or a supported Node 26 function runtime. Align a supported build/runtime version and validate the exact lockfile under Docker, then exercise a deployment. Exact patch-version deployment compatibility, native dependencies and the complete production build were **not tested**; framework-level support is not a certification of this repository. No changes recommended here authorize implementation.

### 7. Streaming AI still has request and availability limits
**Verified; direct evidence; high confidence.** With Fluid Compute the fetched limits page gives Node function maximum duration **300 seconds on Hobby**, **800 seconds generally available on Pro**, and an **1800-second extended beta** with additional runtime/configuration restrictions. Time includes sending a streamed response; exceeding it yields a timeout. Edge has different rules (response must begin within 25 seconds; streaming up to 300 seconds). Standard request/response payload limit is **4.5 MB**. Functions default to one region (`iad1`), configurable; Pro permits multi-region. Waiting on AI does not count as active CPU but provisioned memory remains a billing dimension. [Function limits](https://vercel.com/docs/functions/limitations).

**Recommendation:** ordinary chat is plausible, not guaranteed within limits. Choose an explicit timeout, model/output limits, cancellation/idempotent retry policy and persistent generation state. Test poor-network interruption and resumption; streaming alone does not provide durable background execution or offline support. Upload profile files directly to authorized Storage rather than routing large bodies through a function.

### 8. Entry-tier costs and material limits
**Verified; direct evidence; high confidence.** [Supabase pricing](https://supabase.com/pricing):

| | Free | Pro entry |
|---|---|---|
| Base | $0; up to 2 active projects | From $25/month per organization; $10 compute credit covers one Micro project; extra Micro project adds roughly $10/month |
| DB / file storage | 500 MB / 1 GB | 8 GB disk per project / 100 GB file storage |
| Monthly active users | 50,000 | 100,000, then usage charges |
| Egress / cached egress | 5 GB / 5 GB | 250 GB / 250 GB, then usage charges |
| Inactivity | Pauses after 1 week | Paid projects not paused for inactivity |
| Recovery | Maintain own exports/backups | Daily DB backups retained 7 days |

**Verified; direct evidence; high confidence.** Restores cause downtime; daily backup cadence can lose a day's data. Storage file contents are **not included**. PITR is a paid add-on from about **$100/month for 7-day retention**, also requiring at least Small compute; deleting a project destroys its backups. [Backups and recovery](https://supabase.com/docs/guides/platform/backups). Free-tier pausing/manual recovery is a material availability/operations decision for a service expected to work on an occasional commute—not equivalent to always-ready hosting.

**Verified; direct evidence; high confidence.** [Vercel pricing](https://vercel.com/pricing) lists Hobby **$0** and Pro **$20/month** entry with a $20 included resource credit; additional developer seats/usage can change the bill. [Hobby terms and limits](https://vercel.com/docs/plans/hobby) restrict it to personal, non-commercial use and include 100 GB Fast Data Transfer, 1 million invocations, 4 active CPU-hours and 360 GB-hours provisioned memory. Exceeding allowances can interrupt service; generally the feature cannot be used again until the relevant reset (often 30 days). No billing/signup in the app does not by itself prove Hobby eligibility; assess intended use against terms.

**Cost interpretation:** one Vercel Pro entry plus one Supabase Pro/Micro entry implies approximately **$45/month baseline**, not a selected plan, total quote or ceiling. SMTP, model tokens, domain, taxes, extra projects/seats and overages/add-ons are outside that arithmetic. A $0 infrastructure combination still has delivery/model dependencies and availability limitations.

### 9. Spend controls and regions require explicit decisions
**Verified; direct evidence; high confidence.** Supabase's Pro Spend Cap restricts covered quota overages but excludes compute, PITR, custom domains and other opted-in resources; it is not a configurable all-in budget. [Cost control](https://supabase.com/docs/guides/platform/cost-control). Vercel alerts alone do not stop usage. Production pausing must be enabled, checks occur every few minutes, overshoot is possible, and pausing does not stop every charge (including AI Gateway and storage charges). [Spend Management](https://vercel.com/docs/spend-management). Neither controls an independently billed AI/SMTP provider.

**Verified; direct evidence; high confidence.** Supabase uses one primary project region; specific AWS regions are selectable. Broad “Europe” placement is not a guarantee of EU jurisdiction, and region choice is not proof of compliance. [Available regions](https://supabase.com/docs/guides/platform/regions).

**Recommendation / inference:** decide primary users' geography and residency requirements before provisioning; place application compute near the DB when appropriate and evaluate AI/SMTP residency independently. Set conservative resource/model limits and alerts, and explicitly accept the availability effect of automated pausing. Do not promise a hard cap from alerts.

## Contradictions and validation limitations
- Search summaries said Vercel supported Node 20 and described an 18-minute extended maximum. The fetched official originals instead list 24/22 and an **1800-second beta**. Original pages take precedence; recheck at deployment because these are changing platform limits.
- `source_check` was available and executed for material SMTP/cost/runtime assertions. It returned passages but **“unclear” because automated semantic assessment was unavailable**. Claims above were manually checked against original official page content; there is no independent automated attestation.
- Official framework support does not verify the exact Next/React patch combination. No deployment or build evidence was produced.

## Sources
Kept: the official pages linked beside each claim, grouped into Auth/provisioning/SMTP/revocation; RLS/Storage; Vercel framework/runtime/limits; pricing/cost controls; backups/regions. A few additional official pages beyond the preferred 8–14 were retained because revocation, SMTP, two providers' pricing controls and runtime mismatch are independently decision-relevant.

Rejected/deprioritized: search-generated summaries (discovery only; stale Node/duration details), community Node-support thread (not authoritative), broad Next.js blog result/redirect (did not establish exact patch support), blogs/SEO comparison pages (not used).

## Missing evidence / decisions needed
- Exact research calendar date; exact lockfile/build/deployment compatibility; selected Fluid settings and function region.
- SMTP supplier/domain verification, real delivery success and cost; selected AI model/provider data terms, token costs, rate limits and region.
- Account provisioning/removal runbook, required revocation latency, recovery-point/recovery-time targets and independent image backup.
- Whether Hobby's personal/non-commercial scope applies; acceptable downtime/pausing and baseline budget. No stack-wide disqualifier established, but Node 26 runtime parity, default SMTP, and unimplemented isolation are release blockers if left as-is.

## Next steps
Resolve those bounded operational decisions, then separately authorize a Docker-only production build/deployment proof and two-user adversarial isolation/approval/revocation tests, SMTP delivery test, chat interruption test and DB-plus-image restore rehearsal. This brief does not approve architecture or authorize provisioning.

```acceptance-report
{
  "criteriaSatisfied": [{"id":"criterion-1","status":"satisfied","evidence":"Concise official-source feasibility assessment covers provisioned OTP, SMTP, revocation, ownership/storage, approved snapshots/chat, repo runtime, pricing, limits, recovery and spend controls with explicit residual risks."}],
  "changedFiles": ["/tmp/itera-managed-stack-research.md"],
  "testsAddedOrUpdated": [],
  "commandsRun": [],
  "validationOutput": ["Read the four requested context files; fetched and manually inspected official Supabase/Vercel originals; source_check returned passages but automated semantic validation unavailable."],
  "residualRisks": ["Exact calendar date unavailable in tool environment.","No build, deployment, isolation, delivery, revocation or restore test performed.","AI/SMTP suppliers and costs/data policies remain unselected; platform limits may change.","Budget alerts and selective spend controls do not guarantee an all-in hard cost cap."],
  "noStagedFiles": true,
  "diffSummary": "Only the requested temporary research artifact written; no project files edited.",
  "reviewFindings": ["No implementation approval; unresolved production gates explicitly listed."],
  "manualNotes": "Research-only run. No Node tooling, installs, account creation, provisioning, secrets, commits or pushes. Git index not inspected or changed; noStagedFiles indicates no staging by this run, not a claim about pre-existing index state."
}
```
