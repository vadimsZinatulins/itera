import { redirect } from 'next/navigation';
import { currentAccount } from '@/lib/auth/server';
import SignIn from './sign-in';
import AccountUnavailable from '@/components/account-unavailable';
import { AccountServiceUnavailable } from '@/lib/auth/availability';

export const instant = false;

export default async function LoginPage() {
  let account;
  try { account = await currentAccount(); }
  catch (error) {
    if (!(error instanceof AccountServiceUnavailable)) throw error;
    return <AccountUnavailable retry="/login" />;
  }
  if (account) redirect('/');
  return <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12"><SignIn /></main>;
}
