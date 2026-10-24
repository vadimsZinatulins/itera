import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import styles from '../../conversations.module.css';
import type { ConversationThreadsProps } from './types';

export default function ConversationThreads({ threads, status, busy, selected, choose }: ConversationThreadsProps) {
  return <aside className={styles.trail} aria-label="Conversation threads" tabIndex={0} aria-busy={status === 'loading'}>
    <Button className="mb-4 min-h-11 w-full" variant="outline" disabled={busy} onClick={() => choose('')}><Plus />A new thread</Button>
    {status === 'loading' && <p>Loading your trail…</p>}
    {status === 'unavailable' && <p>Could not load your trail. Try reloading.</p>}
    {status === 'ready' && !threads.length && <p className="text-sm leading-7 text-muted-foreground">Your first saved message adds a conversation here. Return whenever you like.</p>}
    {threads.map(thread => <button
      key={thread.id}
      disabled={busy}
      aria-current={selected === thread.id ? 'true' : undefined}
      className="mb-2 block min-h-11 w-full rounded-lg border p-3 text-left text-sm break-words aria-[current=true]:bg-muted"
      onClick={() => choose(thread.id)}
    >{thread.title}</button>)}
  </aside>;
}
