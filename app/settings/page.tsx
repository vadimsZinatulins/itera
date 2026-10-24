import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readSettingsStatus } from '@/lib/openai/settings/actions/read-settings-status';
import OpenAISettings from '@/components/openai-settings';
import AccountUnavailable from '@/components/account-unavailable';

export const instant = false;
export default async function Settings() {
  const [error, initial] = await readSettingsStatus();
  if (error !== null) {
    if (error.code === 'reauthenticate') {
      redirect('/login');
    }
    return <AccountUnavailable retry="/settings" />;
  }
  return <main className="mx-auto w-full max-w-3xl space-y-5 px-5 py-10">
    <Link href="/" className="underline">Back to learning</Link>
    <h1 className="text-3xl font-semibold">OpenAI settings</h1>
    <p>OpenAI API usage is billed to the account behind your key, separately from free application infrastructure and ChatGPT subscriptions. Check API billing and key permissions. There is no guaranteed monthly spending cap.</p>
    <p>Owner-only pilot: the saved key is temporarily stored as plaintext in the database. Database operators or a database compromise could expose it. Platform encryption at rest is not application secret encryption. This exception must be revisited before admitting other real users.</p>
    <p>Keys are write-only here. Removal blocks future initiated AI requests, not work already accepted by OpenAI, and does not delete saved content. Requests have input, output and time limits; interrupted generations are not retried automatically.</p>
    <p>Only the listed, pinned text-model snapshots are supported; refresh checks your key’s access. No silent model substitution. Optional provider response storage is disabled for AI generation, but that is not zero provider retention: OpenAI abuse-monitoring retention may still apply.</p>
    <OpenAISettings initial={{ hasKey: initial.hasKey, model: initial.model }} />
  </main>;
}
