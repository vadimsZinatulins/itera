import type { TranscriptTurnProps } from './types';

export default function TranscriptTurn({ turn }: TranscriptTurnProps) {
  const sources = turn.sources ?? [];
  const reply = turn.assistant_text.replaceAll('[recap-checkpoint]', '') || 'No completed reply saved.';

  return <div className="space-y-4">
    <article className="ml-4 rounded-xl bg-muted p-4">
      <h3 className="mb-1 text-xs font-medium">You · saved</h3>
      <p className="whitespace-pre-wrap break-words text-sm leading-7">{turn.user_text}</p>
    </article>
    <article className="p-2">
      {sources.length > 0 && <details className="mb-3 text-sm">
        <summary className="min-h-11 cursor-pointer">Approved sources selected · {sources.length}</summary>
        <ul className="break-words">
          {sources.map(source => <li key={source.id}>
            {source.title} · Practice version {source.revision} <span className="break-all text-xs text-muted-foreground">({source.id})</span>
          </li>)}
        </ul>
        <p className="text-xs text-muted-foreground">Versions selected for this reply, not proof every source was used or an incomplete request reached OpenAI. Later updates do not change this record.</p>
      </details>}
      <h3 className="mb-1 text-xs font-medium">Companion · {turn.status === 'complete' ? 'complete' : 'incomplete'}</h3>
      <p className="whitespace-pre-wrap break-words text-sm leading-7">{reply}</p>
    </article>
  </div>;
}
