---
status: accepted
---

# Use Vercel Hobby and Supabase Free for the personal pilot

Deploy the Next.js application and its server-side AI requests on Vercel Hobby; use Supabase Free for email-OTP authentication, Postgres persistence, and private profile-image storage. This gives the owner a deployed commute-usable pilot without paid infrastructure plans, accepting free-tier quotas, possible Supabase inactivity pausing/manual restoration, and limited recovery guarantees instead of paid-plan availability and backups; no automatic paid upgrade is authorised.

## Consequences

- The first pilot has one externally provisioned owner account, but data remains account-owned rather than global. Public signup, shared content, in-app account administration, and billing are excluded; later invited-user access requires revisiting the temporary plaintext API-key exception recorded in the production planning notes.
- The owner has an existing Resend account associated with a controlled domain. Use that existing setup as the intended free SMTP route for Supabase OTP; verification of sender status, quotas, template/configuration, and actual inbox delivery remains a release check, not an already-tested fact.
- OpenAI is the only initial AI provider, using the learner's own API key. Model usage is billed separately from free infrastructure. No paid infrastructure provisioning, deployment, or application implementation is authorised by this decision alone.
- Align the local Docker Node runtime with the selected supported deployment runtime and validate the production build. The current Node 26 development server is not deployment evidence.
- Auth, database policies, and Storage policies create migration work if the platform changes. The choice may be revisited, but free-tier limitations must not be disguised as durable availability or recoverability guarantees.

Evidence and discussion: [production planning](../../.scratch/production-release/planning.md), [managed-stack feasibility](../../.scratch/production-release/research/vercel-supabase-feasibility.md), and [email/OpenAI follow-up](../../.scratch/production-release/research/free-email-and-openai.md).
