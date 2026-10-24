'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { codeRequestSubmissionSchema } from '@/lib/auth/request-code/helpers/validation';
import type { CodeRequestSubmission, CodeRequestSubmissionInput } from '@/lib/auth/request-code/types';
import { submitCodeRequest } from './actions/submit-code-request';
import { Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignIn() {
  const { register, handleSubmit, clearErrors, setFocus, setError, formState: { errors, isSubmitting } } = useForm<CodeRequestSubmissionInput, unknown, CodeRequestSubmission>({
    resolver: zodResolver(codeRequestSubmissionSchema),
    defaultValues: { email: '' },
  });
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [operationError, setOperationError] = useState('');
  const [notice, setNotice] = useState('');
  const codeInput = useRef<HTMLInputElement>(null);
  const busy = isSubmitting || verifying;
  const error = errors.email?.message ?? operationError;

  async function requestCode(submission: CodeRequestSubmission) {
    setOperationError('');
    setNotice('');
    const address = sentTo ?? submission.email;
    const [error, requested] = await submitCodeRequest({ email: address });
    if (error !== null) {
      if (error.code === 'correction' && sentTo === null) {
        setError('email', { type: error.code, message: error.message }, { shouldFocus: true });
      } else {
        setOperationError(error.message);
      }
      return;
    }
    setSentTo(requested.email);
    setCode('');
    setNotice('If this email has a provisioned account, a code is on its way. Check your inbox and spam folder.');
    requestAnimationFrame(() => codeInput.current?.focus());
  }

  async function verifyCode() {
    setVerifying(true);
    setOperationError('');
    setNotice('');
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sentTo, code }),
      });
      const result = await response.json();
      if (!response.ok) {
        setOperationError(result.error);
        return;
      }
      setCode('');
      window.location.replace('/'); // Full navigation discards the login form and router cache.
    } catch {
      setOperationError('Could not connect. Check your connection and try again.');
    } finally {
      setVerifying(false);
    }
  }

  function changeEmail() {
    setSentTo(null);
    setCode('');
    setOperationError('');
    setNotice('');
    clearErrors();
    requestAnimationFrame(() => setFocus('email'));
  }

  const submitRequest = handleSubmit(requestCode, () => {
    setOperationError('');
    setNotice('');
  });

  return <>
    <p className="mb-6 flex items-center gap-2 text-sm font-medium"><Leaf aria-hidden="true" className="size-5" />Learning Companion</p>
    <Card>
      <CardHeader><CardTitle className="text-2xl"><h1>Sign in</h1></CardTitle><CardDescription className="leading-6">A little practice, a little clearer. Use your provisioned learner account.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" noValidate={!sentTo} aria-busy={busy} onSubmit={sentTo ? event => {
          event.preventDefault();
          void verifyCode();
        } : submitRequest}>
          {sentTo ? <>
            <p className="break-words text-sm">Enter the email code for <strong>{sentTo}</strong>.</p>
            <label className="block text-sm" htmlFor="code">Email code</label>
            <Input ref={codeInput} id="code" name="code" value={code} onChange={event => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" minLength={6} maxLength={10} required className="min-h-11" aria-describedby="sign-in-status" />
          </> : <>
            <label className="block text-sm" htmlFor="email">Email address</label>
            <Input id="email" {...register('email')} type="email" autoComplete="email" maxLength={254} required className="min-h-11" aria-invalid={!!errors.email} aria-describedby={error ? 'sign-in-message' : undefined} />
          </>}
          <Button type="submit" disabled={busy} className="min-h-11 w-full">{busy ? 'Please wait…' : sentTo ? 'Verify code' : 'Send code'}</Button>
        </form>
        <div id="sign-in-status" aria-label="Sign-in status" role={error ? 'alert' : 'status'} className="text-sm leading-6"><span id="sign-in-message">{error || notice}</span></div>
        {sentTo && <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-11" disabled={busy} onClick={() => void submitRequest()}>Send another code</Button>
          <Button variant="ghost" className="min-h-11" disabled={busy} onClick={changeEmail}>Change email</Button>
        </div>}
        <p className="text-xs leading-5 text-muted-foreground">Account access is set up outside this application. Public signup is not available.</p>
      </CardContent>
    </Card>
  </>;
}
