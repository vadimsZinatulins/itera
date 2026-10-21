# First production release — planning discussion

Status: WIP interview paused for a prototype detour; not an implementation spec

## Purpose

Turn the accepted prototype direction into a sufficiently clear first-release plan. Resolve decisions that materially affect architecture or acceptance criteria; explicitly defer non-blocking unknowns rather than extending design indefinitely. No production implementation during this discussion.

## Sources and baseline

- Accepted prototype: `prototype/main-workflow`, commit `51db7f8`.
- Existing exploration: [main workflow map](../main-workflow/map.md) and its linked decision tickets. Their administrative statuses do not imply the user rejected the prototype; the user explicitly declared prototyping finished.
- Domain language: root `GLOSSARY.md`.
- `PROJECT.md` is the original idea, not an authoritative specification. Its tutor/MCP-centred MVP differs from the manual Learning Document workflow explored in the prototype; first-release scope must explicitly settle this difference.
- Retain the accepted mobile-friendly trail/chat direction, separate Reference notes, draft/approved Practice version boundary, guarded Subject deletion, and optional Personal profile personalisation as the starting design, not production implementations.
- User selected Vercel Hobby + Supabase Free for the owner-only pilot in Q12, explicitly accepting the free-tier constraints. See [architecture decision](../../docs/adr/0001-free-tier-managed-pilot.md).
- All Node tooling must continue to run through Docker.

## Confirmed production decisions

### Round 1

- **Deployed private-access product, not a personal/local-only milestone.** The first release must be usable on commute. Owner-selected people can be provisioned accounts; no public signup. The architecture must be selected for this release, while remaining changeable later. Billing and shared workspaces are not planned, including beyond the first release. The initial recommendation to launch for the owner alone was rejected.
- **Manual workflow first.** Accepted the first-release recommendation: production Subject/document workflow, real AI practice, user-approved AI writing/review suggestions, separate Reference notes, optional Personal profile, and provisional/correctable recaps. Tutor/MCP integration and a sophisticated long-term learning model can come later.
- **Durable cross-device continuity.** Saved material, approved versions, profile, and practice conversations survive logout/reload and device changes, including returning to unfinished conversations. Internet is required initially; full offline editing and automatic merging of concurrent edits are deferred. The prototype’s logout-reset behaviour is not production behaviour.
- **Hosted AI is permitted with task-scoped context.** Practice uses relevant approved Practice versions in the current Subject, not drafts. Draft/Reference-note content is available only for explicitly requested assistance with that content; bio context remains opt-in and pictures display-only. Whole-account context is not automatic. Provider data-handling terms require verification.

### Round 2 — answers so far

- **Q5: All account content is private.** User explicitly rejected the word “shared”: no shared notes, profiles or other content between accounts. Reference notes belong to the account rather than a Subject. Updated the glossary to remove the overloaded wording.
- **Q6: External account administration.** Owner will invite/provision users through Supabase Studio if Supabase is chosen, or the selected service’s administrative tools otherwise. The application itself needs no account-administration UI. This does not select Supabase or settle invitation-email versus login-code mechanics.
- **Q7: Users bring their own AI credentials.** Rejected owner-funded AI. Each learner selects provider and model and supplies their own API key. Supported providers/models, credential lifecycle and limits remain to be settled.
- **Q8: Interruption recovery accepted.** Keep unsent chat text on the current device, distinguish unsent/sending/saved/failed states, retain successfully saved history, avoid duplicate messages on retry, and mark interrupted replies as incomplete. User explicitly permits localStorage with a visible “saved locally” label. This does not mean full offline document editing or offline AI. Earlier recommendation to clear local personal text on logout was accepted with Q8.

### Latest refinement — personal pilot and credential exception

- **Initial audience narrowed to the owner.** User now states only they will use the first version. This supersedes the initial selected-people launch audience, not the requirement for a deployed commute-usable app with its architecture selected before implementation. Selected, owner-provisioned accounts remain the intended later access model; no public signup, billing or shared content.
- **Low-friction credential entry is a priority.** User explicitly permits plaintext API-key storage for the owner-only first version, as a temporary exception. This is not a claim that plaintext is secure or a credential design approved for other users. Database/platform encryption at rest would not constitute application-level secret encryption.
- **Q9 deferred by explicit request.** A solid low-friction credential solution must be revisited in later iterations. Server-side recoverable encryption versus device/session-only storage, key management, and trust-model selection remain open. Explain that application encryption can preserve exactly the same user workflow; plaintext does not inherently reduce user steps.
- Any later expansion to invited users must explicitly revisit the temporary exception rather than silently treating it as an approved multi-user design. No implementation has begun.

### Round 3 — infrastructure budget and provider scope

- **Q10: Free infrastructure tiers only.** User rejected the proposed USD 50/month infrastructure ceiling. Do not select or provision paid hosting, database, storage or email plans. OpenAI API consumption is separately billed to the account behind the user-provided key; free infrastructure does not imply free model usage.
- **Q11: OpenAI only for launch.** Do not build Anthropic or other provider integrations for the first release. Preserve the ability to choose supported OpenAI text models. Exact model catalogue and API behaviour remain to be decided; arbitrary endpoints or every model returned by a provider are not implicitly supported.

### Round 4 — hosting and email setup

- **Q12 accepted:** Next.js on Vercel Hobby, Supabase Free Auth/Postgres/private Storage, OpenAI via the owner’s API key. Accept free-plan limitations, including possible inactivity pausing and manual restoration; no paid upgrades. Architecture recorded in ADR-0001.
- **Q13 accepted:** Owner controls a domain/DNS and already has a Resend account associated with that domain. Use the existing Resend setup as the intended free SMTP route; domain verification, sender configuration, available quota and real OTP delivery must still be checked. Do not purchase a domain or provision a replacement provider merely because the research considered alternatives.

### Round 5 — conversations, models and save conflicts

- **Q14 accepted:** Conversation history lives in the application database; disable optional OpenAI stored-response retrieval rather than relying on provider-side conversation storage. The user accepted the disclosed distinction from OpenAI abuse-monitoring retention. They additionally require deletion of conversations individually, in user-selected groups, and all conversations. Exact deletion scope, derived recap treatment, confirmation and permanence must be settled explicitly.
- **Q15 accepted:** Model selection uses a tested catalogue intersected with key access. Unavailable/unsupported model errors must not silently substitute another model. User requests support for the latest models, not a catalogue frozen to older generations; select current compatible OpenAI text models during implementation and verify availability/compatibility. Exact IDs and alias/update policy are not yet selected.
- **Q16 accepted:** Accepted or learner-corrected Practice recaps may guide future practice within their Subject. Unreviewed/dismissed recaps do not. These are provisional observations, never mastery scores or verified facts; approved Practice versions remain the source of study material. Sophisticated automatic long-term learning modelling is deferred. Added Practice recap to the glossary.
- **Q17 accepted:** Detect and reject stale Learning Document saves from another device, retain the unsaved text, and let the learner inspect the newer version rather than silently overwriting or automatically merging it.

### Round 6 — document coupling rejected; understanding layer proposed

- User rejects the premise behind Q18–Q21: conversations are disposable units, not children of a particular Learning Document. A conversation may gather multiple relevant documents and perform recap, knowledge testing or other interactions. Source provenance, if retained, must not imply document ownership or automatically disable/delete a conversation when one source changes or disappears.
- Q18–Q21 were proposals, not accepted deletion rules. Withdraw their document-coupled assumptions; retain the confirmed requirement to delete individual, selected-group and all conversations, but do not yet assign cascade/retention semantics.
- User proposes a separate Subject-associated “knowledge-base,” based on conversations and representing demonstrated understanding. Conversations would update that record, rather than being the durable knowledge record themselves. This is a proposal requiring refinement of name, first-release scope, evidence/approval rules, and deletion behaviour.
- Naming proposal pending agreement: **Learning profile**, distinct from the Personal profile and from Learning Documents/approved study material. It would contain provisional observations of understanding and uncertainty, not an authoritative body of subject facts or mastery scores.
- This potentially brings a minimal evolving understanding layer into the first release, revisiting the earlier decision to defer a sophisticated long-term learning model. It does not imply adding scoring, a knowledge graph, scheduling or MCP.
- User specifically identifies conversation completion as a prerequisite: define when a conversation ends before deciding when understanding updates become durable. Existing recap approval rules remain the prior agreement, not silently replaced with automatic updates.

## Prototype detour requested

The user requests a commit of this WIP discussion and a handoff to a fresh `/prototype` session to experience how the proposed knowledge-base / Learning profile works. Do not continue to production implementation or synthesise a final spec yet. Preserve the accepted original prototype as a reference; explore this additional model in a separate throwaway prototype context.

The latest unanswered proposals are **Q22** (include a minimal Subject-specific Learning profile in the first release, with naming still negotiable) and **Q23** (only explicit Finish ends an exchange; interruptions/closing/logout pause it, and completion is separate from applying a learning update). The user has requested a runnable exploration rather than answering these on paper. Show these as design hypotheses, not accepted decisions.

The prototype should make the distinction between approved study material, disposable conversations, and a durable understanding record tangible. It should expose the effects of finishing, reviewing/applying an update, and deleting a conversation. Whether the understanding record survives that deletion is deliberately unsettled. Return user-validated findings to this discussion before resuming the production spec.

### Runnable detour artifact

Built on throwaway branch `prototype/subject-learning-profile`; frozen `prototype/main-workflow` remains unchanged. See [run instructions, walkthrough, live feedback and open questions](learning-profile-prototype.md).

**User rejected all v1 layouts** (`f821379`): the experience should be seamless, with just Learning Trail. The first message registers a conversation; past conversations remain visible and continuable. Conversations plus recaps should affect the Subject knowledge base. They also want a visual representation but have not chosen its form. This supersedes the prototype's separate Learning profile workspace and explicit Start/Finish ceremony as the direction to explore; it does not select automatic update/retention semantics or a canonical name.

V2 keeps one conversational trail with inline recaps and compares topic landscape, connected-concept and evidence-trail views. Tentative conversation quotes versus reviewed recap interpretations are an explicit provisional model. The user **prefers B (connected concepts)** and requests the missing proactive practice entry points: proposed open threads and a quick-assessment button, with assessment allowed inside the same chat. V3 restores those entries and a resumable scripted three-question assessment with an inline correctable recap. **Awaiting reaction to the assessment flow; interpretation timing and assessment defaults remain provisional.**

## Current interview frontier

React to the seamless Learning Trail iteration and explore how the knowledge base can be visualised. The user expects conversations to start from talking and remain continuable; do not reintroduce a mandatory explicit ending step as a prerequisite. Still settle first-release scope, the layer's canonical name, how conversations and reviewed recaps contribute to durable understanding over time, correction, and conversation deletion versus retained understanding. Document deletion must respect the decoupled model. Do not infer those policies from prototype defaults.

Q9 is deliberately deferred, not part of the current interview frontier. Exact manual-save behaviour, deletion/retention rules, selected OpenAI model IDs/API configuration, recovery expectations and test boundaries remain unsettled. A recommendation for a server-only credentials table, write-only key settings, strict authorisation and exclusion from logs/model context is a proposed minimum safeguard, not evidence that plaintext storage is secure.

Completed the bounded follow-up research and captured [Free email delivery and OpenAI API findings](research/free-email-and-openai.md). Q9 was not investigated. Findings did not themselves authorise provisioning or settle Q12/Q13; the subsequent user answers above selected the stack and established existing domain/Resend access.

- Resend Free supports SMTP within its free quotas; unrestricted recipient delivery needs sender-domain verification. Its no-domain path is restricted testing to the account owner's address, not established production delivery.
- Brevo Free supports transactional SMTP and address verification. It can rewrite unauthenticated senders, but official documentation calls that a stopgap rather than a permanent solution. This does not prove a durable no-owned-domain OTP route or require claiming that a domain is technically mandatory for every email send.
- No dependable permanent no-domain sender has been established by this research. Owner-held DNS access and a real inbox-delivery test remain prerequisites to choosing the recommended email route.
- OpenAI API billing is separate from ChatGPT subscription billing. Usable API quota/model access is required; exact model catalogue remains undecided.
- Responses API supports streaming and a `store:false` option. That setting avoids retrievable response storage, not all provider retention: documented abuse-monitoring retention can include prompts/responses for up to 30 days, with policy exceptions. API data is not used for training by default unless opted in. These distinctions must be accurately disclosed; Q14 subsequently accepts app-owned history and disabling optional stored-response retrieval, with the disclosed retention caveat. Exact API configuration still needs implementation validation.
- Research recommends a small tested text-model catalogue, not exposing all model identifiers as interchangeable. Q15 subsequently accepts this recommendation and asks for the latest compatible models.

The later user answers identify existing Resend as the intended SMTP route. OpenAI endpoint/model, no-retention guarantees, purchases, deployments and application changes are not selected or authorised through this research.

## Research evidence — candidate stack

Captured the completed [Vercel/Supabase feasibility brief](research/vercel-supabase-feasibility.md), based on official documentation retrieved by the researcher. It is evidence for the subsequently accepted ADR-0001, not evidence of a tested deployment. The brief could not attest an exact retrieval date; prices and platform limits require rechecking before provisioning.

Key implications reported:

- Provisioned-user email OTP without public signup is supported, but production email delivery requires a separate SMTP service and verified sender setup; the default sender is unsuitable for normal production users.
- Owner-scoped durable data and private profile-image storage are supported primitives. Isolation, approved-only practice retrieval, and interrupted chat recovery still require application design and adversarial tests.
- The repo’s Node 26 development image does not match the Vercel runtime versions listed in the retrieved documentation. Runtime alignment and a real production build/deployment check are required before claiming compatibility.
- The cited Vercel Pro plus Supabase Pro entry plans total approximately USD 45/month before AI, SMTP, domain, taxes, and other charges. This is illustrative arithmetic, not a budget, plan selection, total quote, or hard ceiling. Free plans have eligibility, availability and recovery limitations to evaluate.
- Account suspension/revocation latency, backup/restore expectations, region, AI/SMTP providers, and operating budget remain open.

The subsequent user answers select Vercel Hobby and Supabase Free and identify existing Resend access; no paid plan, account provisioning, or production implementation has been authorised. Research findings do not independently settle user decisions. The research predates the bring-your-own-AI-key decision and does not evaluate credential storage or the selected AI providers’ policies.
