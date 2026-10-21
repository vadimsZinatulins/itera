'use client';

import { useRef, useState } from 'react';
import { Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const codeInput = useRef<HTMLInputElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);

  async function submit(operation: 'request' | 'verify') {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const address = sentTo ?? email.trim().toLowerCase();
      const response = await fetch(`/api/auth/${operation}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: address, ...(operation === 'verify' ? { code } : {}) }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error); return; }
      if (operation === 'verify') {
        setCode('');
        window.location.replace('/'); // Full navigation discards the login form and router cache.
      } else {
        setSentTo(address);
        setCode('');
        setNotice('If this email has a provisioned account, a code is on its way. Check your inbox and spam folder.');
        requestAnimationFrame(() => codeInput.current?.focus());
      }
    } catch {
      setError('Could not connect. Check your connection and try again.');
    } finally { setBusy(false); }
  }

  return <>
    <p className="mb-6 flex items-center gap-2 text-sm font-medium"><Leaf aria-hidden="true" className="size-5" />Learning Companion</p>
    <Card>
      <CardHeader><CardTitle className="text-2xl"><h1>Sign in</h1></CardTitle><CardDescription className="leading-6">A little practice, a little clearer. Use your provisioned learner account.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={event => { event.preventDefault(); void submit(sentTo ? 'verify' : 'request'); }}>
          {sentTo ? <>
            <p className="break-words text-sm">Enter the email code for <strong>{sentTo}</strong>.</p>
            <label className="block text-sm" htmlFor="code">Email code</label>
            <Input ref={codeInput} id="code" name="code" value={code} onChange={event => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" minLength={6} maxLength={10} required className="min-h-11" aria-describedby="sign-in-status" />
          </> : <>
            <label className="block text-sm" htmlFor="email">Email address</label>
            <Input ref={emailInput} id="email" name="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={254} required className="min-h-11" />
          </>}
          <Button type="submit" disabled={busy} className="min-h-11 w-full">{busy ? 'Please wait…' : sentTo ? 'Verify code' : 'Send code'}</Button>
        </form>
        <div id="sign-in-status" aria-label="Sign-in status" role={error ? 'alert' : 'status'} className="text-sm leading-6">{error || notice}</div>
        {sentTo && <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-11" disabled={busy} onClick={() => void submit('request')}>Send another code</Button>
          <Button variant="ghost" className="min-h-11" disabled={busy} onClick={() => {
            setSentTo(null); setCode(''); setError(''); setNotice('');
            requestAnimationFrame(() => emailInput.current?.focus());
          }}>Change email</Button>
        </div>}
        <p className="text-xs leading-5 text-muted-foreground">Account access is set up outside this application. Public signup is not available.</p>
      </CardContent>
    </Card>
  </>;
}
