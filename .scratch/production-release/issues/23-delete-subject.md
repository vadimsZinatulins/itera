# 23: Delete an entire Subject with exact-name confirmation

**What to build:** Let the learner deliberately remove a complete study area, including all its reviewed understanding, while preserving other Subjects and account-level material.

**Blocked by:** 13 — Correct, remove and reset reviewed understanding; 14 — Delete a conversation while retaining reviewed understanding; 16 — Delete a Learning Document without deleting learning history.

**Status:** ready-for-agent

- [ ] Place deletion behind Subject management/settings and a danger zone, away from routine switching. Show the consequences before asking for confirmation.
- [ ] Require the Subject's exact name, including case/spaces, before enabling the final action. Cancel/dismiss clears confirmation and deletes nothing.
- [ ] Remove the Subject's documents, Draft/Practice content, conversations, pending recaps, assessment continuation, tentative contributions and reviewed understanding, including observations retained after prior conversation deletions.
- [ ] Clean up local drafts and prevent stale clients, delayed provider replies, recap applications or old save requests from recreating the deleted Subject or its contents.
- [ ] Support deleting the active, an inactive or the last Subject. Select a valid remaining context or show the useful no-Subjects state rather than leaving a broken selected identity.
- [ ] Preserve other Subjects, account-level Reference notes, Personal profile/private picture and AI settings. Account/Subject checks apply at the trusted boundary, not only in the dialog.
- [ ] Persist a coherent deletion outcome and expose failures honestly. Do not retain hidden Subject transcripts/observations to keep the old map alive or imply first-version restore/backups exist.
- [ ] Public-boundary tests cover exact-name guards/cancel, active/inactive/last deletion, reviewed observations retained from previously deleted conversations, public data absence, other-account/content preservation, two-session results and late in-flight work.
