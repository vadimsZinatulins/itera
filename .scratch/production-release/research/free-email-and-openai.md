# Research: Remaining free-tier owner-only pilot constraints

## Summary
Free SMTP quotas suffice for one owner, but **a dependable, permanent no-owned-domain login sender is not established**. Resend and Brevo offer plausible free custom-SMTP paths with an authenticated domain; neither is selected. OpenAI API text streaming fits, subject to separate API billing and retention caveats—not a ChatGPT subscription or zero-retention promise.

Extension to `.scratch/production-release/research/vercel-supabase-feasibility.md`, not a replacement. Owner-only, externally provisioned future accounts, no signup/billing/sharing, free infrastructure, user-supplied OpenAI API key/model choice remain fixed. Q9 was not investigated. No implementation/provisioning authorized.

## Findings

1. **Claim: Real login needs custom SMTP.** Supabase lists both services as compatible. Built-in delivery remains team-address-only, 2 messages/hour, best-effort and explicitly non-production—even if the owner qualifies. Custom SMTP initially has a separate 30-messages/hour Supabase limit; provider quotas also apply. Use Supabase's sender/templates, not provider marketing campaigns. **Sources:** [1]. **Support:** direct evidence. **Confidence:** high.

2. **Claim: Resend Free supports real delivery with a verified domain; no-domain delivery is restricted testing.** Free includes SMTP, **3,000 emails/month, 100/day**. Its official error says: “You can only send testing emails to your own email address”; other recipients require a verified domain and matching From address. Verification requires DNS access. **Sources:** [2–3]. **Support:** direct evidence. **Confidence:** high.

   **Recommendation / inference:** the account-email sandbox could exercise this owner's inbox without domain purchase, but remains testing—not proof of commute-ready production suitability or future-account delivery. Existing domain/delegated subdomain control could avoid a new purchase; DNS control, not necessarily a newly purchased domain, is needed.

3. **Claim: Brevo Free is another real SMTP candidate, but its no-domain fallback is not permanent.** Free includes transactional email and **300 sends/day**, without carryover. Supabase confirms compatibility. An unauthenticated sender address can be verified by emailed six-digit code; authenticated-domain senders are automatically verified. **Sources:** [1,4,6]. **Support:** direct evidence. **Confidence:** high.

   Brevo replaces free/unauthenticated transactional From addresses with addresses such as `mycompany@5000001.t-sender-sib.com`, explicitly calling this a **“stopgap measure … not a permanent solution.”** Customer-owned domains with DKIM/DMARC are its recommended durable route. Free mailbox domains cannot be authenticated; address verification is not domain authentication. **Sources:** [5–6]. **Support:** direct evidence. **Confidence:** high.

   **Recommendation / inference:** this is sender rewriting, not Resend's owner-recipient sandbox. It nevertheless does not establish permanent no-domain Supabase OTP support, account acceptance or timely delivery. Do not assume a free production sender exists.

4. **Claim: OpenAI API billing is separate from ChatGPT.** A ChatGPT subscription does not fund app API calls. The owner's API account needs usable billing/quota and model access; token costs remain outside free infrastructure. **Source:** [7]. **Support:** official indexed evidence; original retrieval blocked (403). **Confidence:** medium for this run's verification; no prices asserted.

5. **Claim: Text chat can stream without provider-stored conversations.** `POST /v1/responses` accepts text and streams via server-sent events with `stream:true`. `store` defaults to true for later retrieval; explicitly use `store:false` to opt out. **Sources:** [8–9]. **Support:** direct evidence. **Confidence:** high.

   **Recommendation / inference:** keep authorized conversation history in the application and supply necessary context each turn, rather than depending on OpenAI Conversations or retrievable response IDs. Streaming alone does not make mobile interruptions durable; the earlier report's recovery constraints remain.

6. **Claim: No default training does not mean no retention.** OpenAI states API data “is not used to train or improve OpenAI models” unless explicitly opted in. Default abuse-monitoring logs may contain prompts/responses and persist **up to 30 days**, longer where legally required or reasonably necessary to protect services/others. `store:false` does not disable these logs. Approved Zero Data Retention/Modified Abuse Monitoring are separate, not assumed for this account. Responses stored by default/`store:true` remain at least 30 days; Conversations state persists until deleted. Current policy also documents prompt-cache application-state exceptions with a 24-hour maximum. **Source:** [9]. **Support:** direct evidence. **Confidence:** high. **Recommendation:** say “no provider-stored conversation feature,” not “OpenAI retains nothing.”

7. **Claim: Prefer a small supported text-model catalogue with user choice.** `models.list` supplies identifiers/ownership/availability—not a contract for text endpoint, parameters, context window or streaming compatibility. **Sources:** [8,10]. **Support:** direct evidence; recommendation is researcher inference. **Confidence:** high. Intersect a tested catalogue with key-accessible models; validate endpoint/parameters, output limits, cost and deprecations. Reject unsupported IDs without silent substitution. No model selected.

## Contradictions
Brevo permits address verification/rewriting while urging authenticated domains: fallback behavior versus durable setup, not proof domains are technically mandatory for every send. Preserve this nuance when extending the earlier domain recommendation.

## Missing evidence / decisions
- Does the owner control usable sender DNS? Without it, neither service establishes a permanent recommended no-domain path under the no-paid-provisioning constraint.
- Owner must choose SMTP service, supported text models/endpoint, and acceptance of documented OpenAI retention.
- Account approval, inbox timing/spam placement, Supabase integration, key-specific access and interruption handling remain untested.
- `source_check` ran but returned “unclear”: automated semantic assessment unavailable. Originals were manually inspected; Brevo HTML blocks were overcome with official article JSON. Billing original stayed blocked.
- `docs/production-plan` and its README were unavailable at supplied paths; existing report/glossary and current decisions supplied context. No trustworthy calendar date available; terms were live retrieved, not dated guarantees.

## Sources
Kept: ten official original pages, each addressing a separate constraint.
1. [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp) — integration/default restrictions.
2. [Resend pricing](https://resend.com/pricing) — free quotas/SMTP.
3. [Resend errors](https://resend.com/docs/api-reference/errors) — sandbox/domain restriction.
4. [Brevo plans](https://help.brevo.com/hc/en-us/articles/208589409) — free transactional quota.
5. [Brevo sender requirements](https://help.brevo.com/hc/en-us/articles/14925263522578) — temporary rewriting.
6. [Brevo sender verification](https://help.brevo.com/hc/en-us/articles/208836149) — verification/authentication distinction. Pages 4–6 retrieved using corresponding `/api/v2/help_center/en-us/articles/{id}.json` on the same official host.
7. [OpenAI billing](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform) — indexed evidence; original blocked.
8. [Responses creation](https://developers.openai.com/api/reference/resources/responses/methods/create) — streaming/storage contract.
9. [OpenAI data controls](https://platform.openai.com/docs/guides/your-data) — exact training/retention policies.
10. [Models list](https://developers.openai.com/api/reference/resources/models/methods/list) — discovery metadata limits.

Rejected/deprioritized: comparison blogs/generated summaries; Brevo dynamic marketing pricing lacked useful free-plan content; blocked legacy OpenAI references were replaced with current developer originals.

## Next steps
Resolve existing-domain availability and owner choices. After separate authorization, test OTP delivery and bounded streaming with the chosen supported model. No purchase, provisioning or implementation follows automatically.

```acceptance-report
{
  "criteriaSatisfied": [{"id":"criterion-1","status":"satisfied","evidence":"Two-service free SMTP comparison and OpenAI API/storage assessment with explicit unresolved decisions."}],
  "changedFiles": ["/tmp/itera-free-pilot-research.md"],
  "testsAddedOrUpdated": [],
  "commandsRun": [],
  "validationOutput": ["Manual official-source review; source_check inconclusive; billing original blocked."],
  "residualRisks": ["Permanent no-domain delivery unestablished.","No account, delivery, model-access or streaming tests.","Changing provider terms; limited billing verification."],
  "noStagedFiles": true,
  "diffSummary": "Only authorized temporary artifact written.",
  "reviewFindings": ["No project edits; Q9 untouched."],
  "manualNotes": "No Node, installs, credentials, accounts, commits, pushes or children. No staging; pre-existing index not inspected."
}
```
