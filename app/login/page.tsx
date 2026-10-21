import { redirect } from 'next/navigation';
import { currentAccount } from '@/lib/auth/server';
import SignIn from './sign-in';

export const instant = false;

export default async function LoginPage() {
  if (await currentAccount()) redirect('/');
  return <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12"><SignIn /></main>;
}
