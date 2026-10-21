# Do two-step login and an optional personal profile fit the companion?

Type: prototype
Status: claimed

## Question

Does email → OTP login feel clear without signup, and does the personal profile give understandable control over lightweight conversation personalisation?

## Confirmed constraints

- Prototype only: simulated OTP, no email delivery, real account, server auth, or persistence.
- Only pre-approved email vadimz2@hotmail.com may log in. No signup.
- Two steps: enter email, then enter code. Offer change email and resend code.
- Profile includes optional picture, name, and open-ended bio.
- Name can be used naturally; bio personalisation has an explicit toggle. Interests may frame examples and stated goals may shape small suggestions, without overriding current requests.
- Bio is not a study source or evidence of mastery. Never automatically rewrite it or force irrelevant details into conversations.
- Scripted demonstrations must be disclosed as such. Shared Reference notes and Subject/draft eligibility boundaries remain unchanged.
- Await live feedback before resolving. Production provisioning/authentication/security and personalisation policy remain deferred.

## Comments

### Interactive prototype ready for reaction

- [Account simulation, profile editor, and scripted bio framing](../../../app/account.prototype.tsx) wrap the existing [main workflow](../../../app/main-workflow.prototype.tsx). Login is shown before the workspace, with no signup path.
- Email matching is trimmed/case-insensitive for the one pre-approved address. The OTP screen explicitly says no email was sent and displays a generated six-digit demo code. Wrong codes are rejected; resend changes the code and invalidates the previous one; change email returns to the first step. This is client-side simulation, NOT a security boundary.
- A header avatar opens Edit profile and Log out. Profile changes require Save profile; Cancel discards them. PNG/JPEG/WebP pictures up to 3 MB are read into browser memory only, with preview and removal. No image upload or use of the picture by AI.
- Name and bio start empty. Bio use defaults off and is controlled by an explicit switch. A preview explains the small scripted matches: photography/baking framing in AI, photography observations in bread-making, and an assumption-related suggestion for an understanding/depth goal. Arbitrary biographies are not interpreted by this prototype.
- The saved name appears in the companion greeting. Opted-in, relevant scripted framing is attached only to new chat replies or the first practice follow-up, labelled optional profile context, not study evidence. Disabling bio use affects future replies and does not rewrite history. Approved-source selection and mastery interpretations never consume the bio.
- Logout resets the in-memory workspace and shows login again; the saved personal profile remains in memory for this single demo account until reload. The account menu discloses this distinction. Reload resets everything.
- Docker lint, Next type generation, and TypeScript checks pass. Browser walkthroughs at 1440px, 390×844, and 320×667 covered allow-list enforcement, wrong OTP, resend invalidation, changing email, profile save/cancel, picture selection/removal, personalised name, bio on/off, unchanged earlier replies, logout, reload, and horizontal/viewport bounds. No browser runtime errors.
- Re-ran the existing draft/approved-snapshot and Subject-management browser walkthroughs through login; draft exclusion, stable approved revisions, subject isolation, guarded deletion, and shared Reference notes still pass. Awaiting live feedback.
