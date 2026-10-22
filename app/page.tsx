import { redirect } from 'next/navigation';
import { Leaf, BookOpen } from 'lucide-react';
import { authClient, currentAccount } from '@/lib/auth/server';
import SubjectPicker from '@/components/subject-picker';
import LearningDocuments from '@/components/learning-documents';
import AccountSession from '@/components/account-session';
import AccountUnavailable from '@/components/account-unavailable';
import { AccountServiceUnavailable } from '@/lib/auth/availability';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Block until authorization so anonymous HTTP requests receive a real redirect.
export const instant = false;

export default async function Home({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const { subject: requestedSubject } = await searchParams;
  let account;
  let subjects: { id: string; name: string }[] = [];
  try {
    account = await currentAccount();
    if (account) {
      const client = await authClient();
      const { data, error } = await client.from('subjects').select('id,name').eq('account_id', account.id).order('created_at').order('id');
      if (error) throw new AccountServiceUnavailable();
      subjects = data;
    }
  }
  catch (error) {
    if (!(error instanceof AccountServiceUnavailable)) throw error;
    return <AccountUnavailable retry="/" />;
  }
  if (!account) redirect('/login');
  const active = requestedSubject ? subjects.find(subject => subject.id === requestedSubject) : subjects[0];
  return <>
    <header className="border-b"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
      <p className="flex items-center gap-2 font-medium"><Leaf aria-hidden="true" className="size-5" />Learning Companion</p>
      <div className="flex items-center gap-2"><SubjectPicker subjects={subjects} activeId={active?.id} /><AccountSession /></div>
    </div></header>
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Your learning trail</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back.</h1>
      <p className="mt-3 break-words text-sm text-muted-foreground">Signed in as {account.email}</p>
      <Card className="mt-8 max-w-xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen aria-hidden="true" className="size-5" /><h2 className="min-w-0 break-words">{active?.name ?? (requestedSubject ? 'Subject unavailable' : 'No Subjects yet')}</h2></CardTitle></CardHeader>
        <CardContent><p className="text-sm leading-7 text-muted-foreground">{active ? 'Capture study material in Learning Documents below and save it as a Draft. Review the saved content with Ready to Practice to approve a Practice version. Later Draft changes stay excluded until you explicitly update it. Approval means material encountered, not demonstrated understanding. Conversations and practice activities are not available yet.' : requestedSubject ? 'This Subject is not available to your account. Choose another Subject from the picker.' : 'Your learner account is private. Open the Subjects picker above and choose Add subject to create your first area of study. Then add a Learning Document and approve its material for practice.'}</p></CardContent>
      </Card>
      {active && <LearningDocuments key={account.id} subjectId={active.id} />}
    </main>
  </>;
}
