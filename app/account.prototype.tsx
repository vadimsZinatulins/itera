"use client";

// Throwaway account UI. Browser-only simulation, NOT an authentication boundary.
// No email is sent, no profile/image is uploaded, and nothing survives a reload.
import { createContext, useContext, useState, type ReactNode } from "react";
import { Leaf, LogOut, Mail, Pencil, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const prototypeEmail = "vadimz2@hotmail.com";
type PersonalProfile = { name: string; bio: string; picture: string; useBio: boolean };
type AccountState = { signedIn: boolean; setSignedIn: (value: boolean) => void; profile: PersonalProfile; setProfile: (value: PersonalProfile) => void };
const AccountContext = createContext<AccountState | null>(null);
export function AccountPrototypeProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<PersonalProfile>({ name: "", bio: "", picture: "", useBio: false });
  return <AccountContext.Provider value={{ signedIn, setSignedIn, profile, setProfile }}>{children}</AccountContext.Provider>;
}
export function useAccountPrototype() {
  const account = useContext(AccountContext);
  if (!account) throw new Error("Account prototype requires its in-memory provider.");
  return account;
}

export function AccountPrototypeGate({ children }: { children: ReactNode }) {
  const { signedIn, setSignedIn } = useAccountPrototype();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  function generateCode() {
    const generated = String(100000 + crypto.getRandomValues(new Uint32Array(1))[0] % 900000);
    setCode(generated === code ? String(100000 + (Number(generated) - 100000 + 1) % 900000) : generated);
    setEnteredCode(""); setError("");
  }
  if (signedIn) return children;
  return <div className="min-h-dvh bg-background px-5 py-8 text-foreground sm:py-14">
    <div className="mx-auto max-w-sm"><div className="mb-10 flex items-center gap-2 text-xl font-medium tracking-tight"><Leaf className="size-5" />waypoint.</div>
      <Card><CardHeader><p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{step === "email" ? "Step 1 of 2" : "Step 2 of 2"} · Prototype</p><CardTitle className="text-2xl tracking-tight">{step === "email" ? "Welcome back." : "Enter your code."}</CardTitle></CardHeader><CardContent className="space-y-5">
        {step === "email" ? <form className="space-y-4" onSubmit={e => { e.preventDefault(); const normalized = email.trim().toLowerCase(); if (normalized !== prototypeEmail) { setError("This email is not pre-approved for the prototype. Use the demo account shown below."); return; } setEmail(normalized); generateCode(); setNotice(""); setStep("code"); }}>
          <p className="text-sm leading-6 text-muted-foreground">Log in with your approved email. No password or signup.</p><div className="space-y-2"><label htmlFor="login-email" className="text-sm font-medium">Email</label><Input id="login-email" className="h-11 text-base" type="email" required autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} aria-invalid={!!error} aria-describedby={error ? "login-error" : undefined} /></div>
          {error && <p id="login-error" role="alert" className="text-sm leading-6 text-destructive">{error}</p>}<Button type="submit" className="min-h-11 w-full" disabled={!email.trim()}><Mail />Send code</Button>
          <div className="rounded-lg bg-muted p-3 text-xs leading-6"><p className="font-medium">Pre-approved demo account</p><p className="break-all">{prototypeEmail}</p></div>
        </form> : <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (email !== prototypeEmail || !code || enteredCode !== code) { setError("That code doesn’t match. Use the current simulated code below, or resend it."); return; } setCode(""); setEnteredCode(""); setStep("email"); setNotice(""); setError(""); setSignedIn(true); }}>
          <p className="text-sm leading-6 text-muted-foreground">In the real flow, we’d send a code to <strong className="break-all text-foreground">{email}</strong>. No email was sent in this prototype.</p>
          <div className="space-y-2"><label htmlFor="login-code" className="text-sm font-medium">OTP code</label><Input key={step} id="login-code" className="h-12 text-center font-mono text-xl tracking-[0.3em]" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required value={enteredCode} onChange={e => { setEnteredCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} aria-invalid={!!error} aria-describedby={error ? "otp-error" : "simulated-code"} /></div>
          {error && <p id="otp-error" role="alert" className="text-sm leading-6 text-destructive">{error}</p>}<Button type="submit" className="min-h-11 w-full" disabled={enteredCode.length !== 6}>Log in</Button>
          <div className="flex flex-wrap justify-between gap-2"><Button type="button" variant="ghost" className="min-h-11" onClick={() => { setStep("email"); setCode(""); setEnteredCode(""); setError(""); setNotice(""); }}>Change email</Button><Button type="button" variant="ghost" className="min-h-11" onClick={() => { generateCode(); setNotice("New simulated code generated. The previous code no longer works."); }}>Resend code</Button></div>
          <div id="simulated-code" className="rounded-lg border border-dashed p-3 text-sm leading-6"><p className="font-medium">Simulated email · demo code</p><output aria-label="Simulated OTP code" className="font-mono text-xl tracking-widest">{code}</output><p className="mt-1 text-xs text-muted-foreground">Use this code to continue. It is shown here only for the prototype.</p></div>{notice && <p role="status" className="text-xs leading-6 text-muted-foreground">{notice}</p>}
        </form>}
        <p className="border-t pt-4 text-xs leading-6 text-muted-foreground">Simulated login, not real account security. No email delivery, server authentication, or persistence. Reload resets the demo.</p>
      </CardContent></Card>
    </div>
  </div>;
}

// Deliberately small scripted examples, not inference over arbitrary bio text.
// This is framing only: it never changes approved sources, eligibility, or mastery.
export function bioFraming(profile: PersonalProfile, subjectId: string) {
  if (!profile.useBio || !profile.bio.trim()) return { example: "", steering: "" };
  const bio = profile.bio.toLowerCase();
  const photography = /photograph|camera/.test(bio);
  const baking = /bak(e|ing)|bread/.test(bio);
  const example = subjectId === "ai" && photography ? "For an optional photography framing, imagine the training loop belongs to an image classifier for your photos. Keep the same reasoning task; no photography knowledge is being assessed." : subjectId === "bread" && photography ? "If useful, photograph the dough at consistent intervals to make the observations in your example easier to compare." : subjectId === "ai" && baking ? "As an optional baking analogy, distinguish changing a recipe from checking whether the oven actually reaches the set temperature. Likewise, distinguish tuning a training setting from checking whether the update happens." : "";
  const steering = /deep(er|ly)?|understand|first principles/.test(bio) ? "If it serves your current question, name one assumption behind your explanation rather than only repeating a definition." : "";
  return { example, steering };
}
function Portrait({ picture, name, large = false }: { picture: string; name: string; large?: boolean }) {
  return <span role="img" aria-label={picture ? "Profile picture" : name ? `Avatar for ${name}` : "Default avatar"} className={`flex shrink-0 items-center justify-center rounded-full bg-muted bg-cover bg-center text-muted-foreground ${large ? "size-20" : "size-8"}`} style={picture ? { backgroundImage: `url("${picture}")` } : undefined}>{!picture && <UserRound className={large ? "size-8" : "size-4"} />}</span>;
}

function ProfileEditor({ close }: { close: () => void }) {
  const { profile, setProfile } = useAccountPrototype();
  const [draft, setDraft] = useState(profile);
  const [pictureError, setPictureError] = useState("");
  const [loading, setLoading] = useState(false);
  const preview = bioFraming(draft, "ai");
  return <Dialog open onOpenChange={open => { if (!open) close(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"><DialogTitle className="pr-8 text-xl">Your profile</DialogTitle><DialogDescription className="leading-6">A little context about you. All fields are optional; your email is fixed to the approved demo account.</DialogDescription>
    <form className="space-y-5" onSubmit={e => { e.preventDefault(); if (loading) return; setProfile({ ...draft, name: draft.name.trim(), bio: draft.bio.trim() }); close(); }}>
      <div className="flex flex-wrap items-center gap-4"><Portrait picture={draft.picture} name={draft.name} large /><div className="min-w-0 flex-1 space-y-2"><label htmlFor="profile-picture" className="block text-sm font-medium">Profile picture</label><Input id="profile-picture" className="max-w-full" type="file" accept="image/png,image/jpeg,image/webp" disabled={loading} onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) { setPictureError("Choose a PNG, JPEG, or WebP image up to 3 MB."); return; } setPictureError(""); setLoading(true); const reader = new FileReader(); reader.onload = () => { const picture = String(reader.result); setDraft(d => ({ ...d, picture })); setLoading(false); }; reader.onerror = () => { setPictureError("Couldn’t read that image. Try another file."); setLoading(false); }; reader.readAsDataURL(file); }} /><p className="text-xs leading-5 text-muted-foreground">PNG, JPEG, WebP · up to 3 MB · stays in this browser’s memory</p>{draft.picture && <Button type="button" variant="ghost" className="min-h-11" disabled={loading} onClick={() => setDraft({ ...draft, picture: "" })}>Remove picture</Button>}</div></div>
      {pictureError && <p role="alert" className="text-sm text-destructive">{pictureError}</p>}
      <div className="space-y-2"><label htmlFor="profile-name" className="text-sm font-medium">Name</label><Input id="profile-name" className="h-11 text-base sm:text-sm" maxLength={80} autoComplete="given-name" placeholder="What should I call you?" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /><p className="text-xs leading-5 text-muted-foreground">The companion can use your name naturally, whether or not bio personalisation is on.</p></div>
      <div className="space-y-2"><label htmlFor="profile-bio" className="text-sm font-medium">Bio</label><Textarea id="profile-bio" className="min-h-32 text-base sm:text-sm" maxLength={2000} placeholder="Your interests, goals, background, or how you like to learn…" value={draft.bio} onChange={e => setDraft({ ...draft, bio: e.target.value })} /><p className="text-xs leading-6 text-muted-foreground">For example: “I enjoy photography and baking. I’m learning AI to understand it deeply, not just memorise definitions.” Share only what you want used as context.</p></div>
      <div className="rounded-xl border p-4"><div className="flex items-start justify-between gap-4"><label htmlFor="use-profile-bio" className="text-sm font-medium leading-6">Use my bio to personalise conversations</label><Switch id="use-profile-bio" className="mt-1 shrink-0" checked={draft.useBio} onCheckedChange={checked => setDraft({ ...draft, useBio: checked })} /></div><p className="mt-2 text-xs leading-6 text-muted-foreground">When on, relevant interests may shape examples and stated goals may guide small suggestions. Your current request takes priority. This is never evidence of knowledge or mastery, and the companion never rewrites your bio automatically.</p></div>
      <details className="rounded-lg bg-muted/50 p-3 text-xs break-words leading-6 text-muted-foreground"><summary className="cursor-pointer py-1 font-medium text-foreground">Preview personalisation · scripted demo</summary><p className="mt-2">{draft.name.trim() ? `Name: “What’s on your mind, ${draft.name.trim()}?”` : "No name set: the companion uses a neutral greeting."}</p>{!draft.useBio ? <p>Bio use is off. Saving it does not make it available to the companion.</p> : !draft.bio.trim() ? <p>No bio set. Nothing is added to conversations.</p> : <><p>{preview.example || "No example matched. This demo recognises photography/baking framing in AI, and photography in bread-making; it does not interpret arbitrary biographies."}</p><p>{preview.steering || "No goal-related suggestion matched in this scripted demo."}</p></>}<p className="mt-2">Turning this off stops bio use in new replies. It does not rewrite earlier messages. Profile picture is display-only.</p></details>
      <p className="break-all text-xs text-muted-foreground">Account · {prototypeEmail}</p><p className="text-xs leading-6 text-muted-foreground">Prototype only · no upload, profile persistence, or real AI. Changes apply only after Save profile and reset on reload.</p>
      <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" className="min-h-11" onClick={close}>Cancel</Button><Button type="submit" className="min-h-11" disabled={loading}>{loading ? "Reading picture…" : "Save profile"}</Button></div>
    </form>
  </DialogContent></Dialog>;
}

export function AccountPrototypeMenu() {
  const { profile, setSignedIn } = useAccountPrototype();
  const [editing, setEditing] = useState(false);
  return <><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-10 shrink-0 rounded-full" />} aria-label="Account and profile"><Portrait picture={profile.picture} name={profile.name} /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-64"><DropdownMenuGroup><DropdownMenuLabel><span className="block truncate text-sm text-foreground">{profile.name || "Your account"}</span><span className="block break-all py-1 font-normal">{prototypeEmail}</span></DropdownMenuLabel><DropdownMenuItem className="min-h-11" onClick={() => setEditing(true)}><Pencil />Edit profile</DropdownMenuItem></DropdownMenuGroup><DropdownMenuSeparator /><DropdownMenuItem className="min-h-11" onClick={() => setSignedIn(false)}><LogOut />Log out</DropdownMenuItem><p className="px-2 py-2 text-[11px] leading-5 text-muted-foreground">Demo workspace resets on logout. Your saved profile stays in memory until reload.</p></DropdownMenuContent></DropdownMenu>{editing && <ProfileEditor close={() => setEditing(false)} />}</>;
}
