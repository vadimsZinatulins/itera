# First production release — planning discussion

Status: interview complete; shared understanding and testing seam confirmed; spec published

## Purpose

Turn the accepted prototype direction into a sufficiently clear first-release plan. Resolve decisions that materially affect architecture or acceptance criteria; explicitly defer non-blocking unknowns rather than extending design indefinitely. No production implementation during this discussion.

## Sources and baseline

- Original accepted prototype: commit `51db7f8`. The user subsequently authorised merging the Subject understanding detour into `prototype/main-workflow`, now at `09d31d9`; this branch is no longer frozen at the original commit.
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

Built on throwaway branch `prototype/subject-learning-profile` (through `d22800b`), then merged into `prototype/main-workflow` at `09d31d9` at the user's explicit request. The original prototype remains available at `51db7f8`. See [run instructions, walkthrough, live feedback and open questions](learning-profile-prototype.md).

**User rejected all v1 layouts** (`f821379`): the experience should be seamless, with just Learning Trail. The first message registers a conversation; past conversations remain visible and continuable. Conversations plus recaps should affect the Subject knowledge base. They also want a visual representation but have not chosen its form. This supersedes the prototype's separate Learning profile workspace and explicit Start/Finish ceremony as the direction to explore; it does not select automatic update/retention semantics or a canonical name.

V2 keeps one conversational trail with inline recaps and compares topic landscape, connected-concept and evidence-trail views. Tentative conversation quotes versus reviewed recap interpretations are an explicit provisional model. The user **prefers B (connected concepts)** and requests the missing proactive practice entry points: proposed open threads and a quick-assessment button, with assessment allowed inside the same chat. V3 restores those entries and a resumable scripted three-question assessment with an inline correctable recap. **Awaiting reaction to the assessment flow; interpretation timing and assessment defaults remain provisional.**

### Return to grilling

The user resumed the interview using `/tmp/itera-first-product-return-handoff.md` and explicitly requested returning to `docs/production-plan`. Carried forward only the updated planning notes and prototype-return artifact from `09d31d9`; no throwaway UI code was merged into the planning branch. The preferred direction is seamless Learning Trail, B's connected concepts, suggested open threads and same-chat assessment. The merge preserves this direction, not blanket approval of its provisional semantics.

Q22/Q23 must not be repeated as if the v1 separate workspace and explicit Finish ceremony remain the proposed baseline. The new interaction direction supersedes that framing; production scope and interpretation policy still need explicit decisions.

### Round 7 — revised first-release baseline accepted

- **Q24 accepted:** First release includes the seamless Subject Learning Trail, automatically saved/resumable conversations, B's connected-concepts understanding view, suggested open threads, same-chat short/resumable assessment, and inline accept/correct/dismiss recaps without ending the conversation. Scripted defaults such as exactly three questions or automatic recap timing are not accepted merely through this baseline decision. This includes a minimal evolving understanding record, while complex scoring, scheduling and knowledge-graph engines remain deferred.
- **Q25 accepted:** Conversations automatically contribute tentative context visible in the trail/map. Only accepted or learner-corrected recaps contribute the durable interpretation used for future practice. Unreviewed AI interpretations must not silently become conclusions about understanding. Conversation continuation is independent of recap review.
- **Q26 accepted:** Deleting a disposable conversation removes its transcript and tentative contributions but preserves previously accepted learning observations. Retained observations identify that the source conversation was deleted; do not secretly retain the transcript. The deletion confirmation must disclose retained understanding. The learner must separately be able to remove retained observations or reset the Subject's understanding record. Exact correction/reset interactions remain to be agreed.

### Round 8 — ongoing recaps, correction, adaptive assessment and deletion

- **Q27 accepted:** Recaps are incremental checkpoints, available on request or offered at meaningful points such as after an assessment, not triggered by an arbitrary message count. Later proposals focus on changes since the last reviewed recap and cannot overwrite accepted observations without review. Ignoring a proposal never blocks conversation.
- **Q28 accepted:** From the understanding view, learners can correct/save or remove observations and reset the Subject's understanding with confirmation. Removed observations stop informing practice. Reset leaves documents and conversations intact; existing conversations do not automatically rebuild deliberately removed observations, although newly reviewed recaps may contribute again.
- **Q29 accepted with refinement:** Same-chat assessment is resumable, one question at a time, with optional recorded hint requests, skipping as not-assessed rather than failure, and an inline correctable recap. Three questions must NOT be a hard limit. AI can choose the number and each question's difficulty, considering the learner's available time. Support easy/medium/hard questions; explicit natural-language instructions can request a level, topic or time budget (e.g. easy recap of X, a hard question about Y, or 15 minutes on Z). When difficulty is unspecified, AI may vary it per question. No mastery score or forced timed-exam behaviour was accepted. Exact time-budget handling and evidence interpretation remain to be settled.
- **Q30 accepted:** Permanent live-app conversation deletion after confirmation, with individual, selected-group, all-in-Subject and all-in-account scope. Show scope/count across unloaded pages; require typing DELETE for account-wide deletion. No first-release trash/restore feature. Disclose retained reviewed understanding and distinguish live-data deletion from provider/back-up retention.

### Round 9 — time budgets, qualified evidence and deletion boundaries

- **Q31 accepted:** Time is a soft assessment budget. Plan/adapt a reasonable sequence and offer a recap near the end, without cutting off answers, auto-submitting or preventing continuation. On returning after the time window, acknowledge expiry and allow continuing or setting a new budget. Do not promise exact timing predictions.
- **Q32 accepted:** Reviewed observations retain the context of intended question difficulty and requested hints/scaffolding. Easy/medium/hard are AI-estimated task labels, not calibrated ability measurements. A single successful hard answer does not establish mastery; a single struggle does not erase earlier demonstrated understanding.
- **Q33 accepted:** Learning Document deletion removes its Draft and approved Practice version and excludes it from future source selection, but leaves conversations resumable and reviewed observations intact. Historical references identify the deleted source. Existing messages may retain quotes/discussion; the confirmation explains separate conversation/understanding removal.
- **Q34 accepted:** Subject deletion removes all its documents/Practice versions, conversations/pending recaps and understanding, including observations retained from previously deleted conversations. Show consequences and require the exact Subject name. Other Subjects, account-level Reference notes, Personal profile and API settings remain intact.

### Round 10 — terminology and state boundaries

- **Q35 accepted:** Canonical term is **Subject understanding**, with **Explore understanding** as the UI entry and the connected-concepts map as its visual representation. Distinct from source-document collections and Personal profile; no separate management workspace. Updated the glossary accordingly.
- **Q36 accepted:** With no approved study material, chat remains available for goals, organisation and explicitly requested authoring assistance, but do not invent an assessment syllabus or treat that discussion as demonstrated understanding of approved material. Explain how to create/approve a Learning Document. Previously reviewed understanding remains visible even when no current sources remain.
- **Q37 accepted:** Require saving or discarding outstanding document edits before approving/updating a Practice version. Snapshot the complete successfully saved document, not mixed saved/unsaved state. Draft save and approval remain separate; the existing Practice version remains usable during editing.
- **Q38 accepted:** Stale corrections, resets and recap applications must not silently overwrite newer Subject understanding or restore removed observations. Retain the proposed text, explain the conflict and require refresh/review against current state; do not silently merge.

### Round 11 — operational boundaries

- **Q39 decided: no backups for the first version.** After clarification, the user explicitly declined backups. Do not build an account-backup export/restore feature, owner backup command, scheduled backup job or backup-management runbook for this release. This does not withdraw ordinary Learning Document copy/download behaviour. Normal durable saves and cross-device continuity remain required. No app-provided disaster recovery is promised; if the live data is damaged or lost, recovery may be impossible. Any incidental provider recovery capability is not an app guarantee. Revisit backups in a later version.
- **Q40 accepted:** API-key settings are write-only, with replace/remove controls and server-only use after account authorisation. Never return the full stored key or put it in browser storage, prompts, exports or logs. Removal stops future requests without deleting saved work. These minimum safeguards do not make plaintext secure or resolve deferred Q9.
- **Q41 accepted:** Bound AI work to user-initiated workflows and their associated recap proposals; no scheduled generation, idle analysis or automatic whole-history reprocessing. Apply request/output limits. Do not blindly retry possibly charged interrupted requests in the background; offer explicit retry with a possible additional-charge warning. No guaranteed monthly OpenAI spending cap.
- **Q42 accepted:** Minimal operational application logging only, without a separate product-analytics service. Request/status/timing/model/usage metadata may be logged; exclude raw conversations, documents, bios, API keys and login codes. Sanitise errors. Do not imply providers retain no metadata.
- **Q43 accepted:** Prefer compatible European application/database regions where feasible within selected free plans, subject to setup verification. Strict EU-only processing is not required or promised; other providers have their own data handling.
- **Q44 accepted:** Release requires a real deployed phone walkthrough through OTP login, durable document save/approval, real AI practice, recap review and return continuity. Require regression checks for account isolation, excluded Drafts/Reference notes, stale saves, interrupted replies/retries and deletion/retained-understanding rules. Privacy failures, saved-data loss and broken core flows block release; nonblocking polish may wait.

## Spec synthesis and testing checkpoint

After the planning checkpoint and agent-instruction commits, the user explicitly requested `/to-spec`. They confirmed the proposed primary test seam: the running application's public boundary, using browser workflows and direct public application/data requests, with real test persistence/auth/storage and controlled OpenAI/email effects. The deployed real-email/OpenAI phone walkthrough remains a separate release gate. Full testing decisions are recorded in the [published first-release spec](spec.md), marked `ready-for-agent`.

All currently identified product/operational interview decisions are settled or explicitly deferred. The published spec is the synthesis for ticketing; this planning document retains the decision history. No implementation or provisioning has started or been authorised by spec publication. No first-version backup feature or app-provided disaster-recovery guarantee. Normal durable saving remains a release requirement. Exact model IDs/API compatibility, region availability and platform limits remain implementation verification work, not facts for the user to research.

Q9 remains explicitly deferred, with the plaintext exception restricted to the owner pilot; revisit before admitting other real users. Server-only credential use, write-only settings, authorisation and exclusion from prompts/logs/browser storage are accepted minimum safeguards under Q40, not evidence that plaintext storage is secure.

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
