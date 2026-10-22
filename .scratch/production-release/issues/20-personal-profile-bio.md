# 20: Save a Personal profile and opt into bio framing

**What to build:** Let the learner save an optional name/bio and explicitly opt into relevant bio-based conversation framing without confusing identity with study evidence.

**Blocked by:** 06 — Start and resume durable AI conversations.

**Status:** ready-for-agent

- [ ] Offer optional name and open-ended bio with explicit Save/Cancel. Cancel leaves the saved profile unchanged; successful saves survive reload, logout/login and another session.
- [ ] Bio use is off by default and separately toggleable. Saving a bio does not automatically make it available to AI.
- [ ] With permission, relevant interests/background/goals may frame examples or small suggestions in subsequent conversations, but the current request takes priority. Do not rely on the prototype's few hard-coded keyword matches as real interpretation.
- [ ] Turning bio use off excludes it from subsequent outgoing AI context. Do not promise to rewrite prior messages or retract content already processed by a provider.
- [ ] Name can support a natural greeting without being learning evidence. Neither profile content nor AI familiarity implies knowledge, approval, Practice eligibility or mastery.
- [ ] Never rewrite the bio autonomously or add profile text to Subject understanding. The optional profile is not the Subject-understanding workspace.
- [ ] Authorise profile reads/writes by account; no profile data enters deliberate raw application logs or another account's context.
- [ ] Public-boundary tests cover save/cancel, opt-in default, controlled outgoing context with on/off changes, current-request precedence, persistence and anonymous/foreign-account denial. Extend context checks across available chat/assessment flows.
- [ ] Keep photo upload/private storage in ticket 21; this slice remains usable without a picture.
