import { redirect } from 'next/navigation';
import { Leaf, BookOpen } from 'lucide-react';
import { currentAccount } from '@/lib/auth/server';
import AccountSession from '@/components/account-session';
import AccountUnavailable from '@/components/account-unavailable';
import { AccountServiceUnavailable } from '@/lib/auth/availability';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Block until authorization so anonymous HTTP requests receive a real redirect.
export const instant = false;

export default async function Home() {
  let account;
  try { account = await currentAccount(); }
  catch (error) {
    if (!(error instanceof AccountServiceUnavailable)) throw error;
    return <AccountUnavailable retry="/" />;
  }
  if (!account) redirect('/login');
  return <>
    <header className="border-b"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
      <p className="flex items-center gap-2 font-medium"><Leaf aria-hidden="true" className="size-5" />Learning Companion</p>
      <AccountSession />
    </div></header>
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Your learning trail</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back.</h1>
      <p className="mt-3 break-words text-sm text-muted-foreground">Signed in as {account.email}</p>
      <Card className="mt-8 max-w-xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen aria-hidden="true" className="size-5" />A space for your learning</CardTitle></CardHeader>
        <CardContent><p className="text-sm leading-7 text-muted-foreground">Your learner account is private. Subjects, Learning Documents and practice will be available here as they are added.</p></CardContent>
      </Card>
    </main>
  </>;
}
