'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { composerSchema } from '@/lib/conversations/helpers/submission-validation';
import type { ComposerFields } from '@/lib/conversations/types/submission';
import { submitMessage } from './actions/submit-message';
import { History, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { documentId as operationId } from '@/lib/document-id';
import { readChatRecovery, saveChatRecovery } from '@/lib/chat-recovery';
import type { ChatOperation } from '@/lib/chat-recovery/types';
import styles from './conversations.module.css';
import PracticeRecaps from '@/components/practice-recaps';
import AssessmentBudgetStatus from '@/components/assessment-budget';
import { readHistory, readTrail } from './actions/read-history';
import ConversationThreads from './components/conversation-threads';
import TranscriptTurn from './components/transcript-turn';
import type { ConversationsProps, ReadStatus, RecoveryDeletedDetail, Thread, TrailReadResult, Turn } from './types';

export default function Conversations({ accountId, subjectId, initialConversation }: ConversationsProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [trailStatus, setTrailStatus] = useState<ReadStatus>('loading');
  const [selected, setSelected] = useState(initialConversation ?? '');
  const [turns, setTurns] = useState<Turn[]>([]);
  const { register, control, getValues, setValue, reset, handleSubmit, formState: { errors } } = useForm<ComposerFields>({
    resolver: zodResolver(composerSchema),
    defaultValues: { text: '', practice: false },
  });
  const draft = useWatch({ control, name: 'text' });
  const practice = useWatch({ control, name: 'practice' });
  const [busy, setBusy] = useState(false);
  const [historyStatus, setHistoryStatus] = useState<ReadStatus>(initialConversation ? 'loading' : 'ready');
  const loading = historyStatus === 'loading';
  const [notice, setNotice] = useState('');
  const [mobile, setMobile] = useState<'threads' | 'chat'>('chat');
  const [retry, setRetry] = useState<ChatOperation | null>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const active = useRef(true);
  const [localSaved, setLocalSaved] = useState(false);

  const assessment = turns.filter(turn => turn.assessment).at(-1)?.assessment ?? null;

  function prepareAssessment(text: string) {
    if (busy || loading || retry || draft.trim()) {
      return;
    }
    reset({ text, practice: true });
    retain(text, true, null);
    setNotice('Assessment request prepared. Edit topic, difficulty or available time, then Send message.');
  }
  function retain(text: string, mode: boolean, operation: ChatOperation | null, scope = selected) {
    if (active.current) {
      const [error] = saveChatRecovery(accountId, subjectId, scope, { text, practice: mode, operation });
      setLocalSaved(error === null);
    }
  }
  function restore(scope: string) {
    const [error, result] = readChatRecovery(accountId, subjectId, scope);
    if (error !== null) {
      reset({ text: '', practice: false });
      setRetry(null);
      setLocalSaved(false);
      setNotice(error.message);
      return;
    }
    const recovered = result.status === 'recovered' ? result.recovery : null;
    reset({ text: recovered?.text ?? '', practice: recovered?.practice ?? false });
    setRetry(recovered?.operation ?? null);
    setLocalSaved(Boolean(recovered));
    if (recovered?.operation) {
      setNotice('Send unconfirmed. Check the same send explicitly; it may already be saved. No automatic retry was made.');
    }
  }
  useEffect(() => {
    active.current = true;
    // Read browser storage after hydration, never during the server render.
    const hydration = window.setTimeout(() => restore(initialConversation ?? ''), 0);
    const clear = () => {
      active.current = false;
      window.clearTimeout(hydration);
      abort.current?.abort();
      setBusy(true);
      reset({ text: '', practice: false });
      setRetry(null);
      setTurns([]);
      setThreads([]);
      setNotice('');
    };
    window.addEventListener('account-state-cleared', clear);
    return () => {
      active.current = false;
      window.clearTimeout(hydration);
      window.removeEventListener('account-state-cleared', clear);
    };
    // The parent keys this component by account and Subject; thread changes restore in choose().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, subjectId]);

  useEffect(() => {
    const deleted = (event: Event) => {
      const scope = (event as CustomEvent<RecoveryDeletedDetail>).detail;
      if (scope.account !== accountId || (scope.subject && scope.subject !== subjectId)) {
        return;
      }
      if (scope.conversation && scope.conversation !== selected && scope.conversation !== retry?.conversation) {
        return;
      }
      abort.current?.abort();
      setBusy(false);
      setHistoryStatus('ready');
      reset({ text: '', practice: false });
      setRetry(null);
      setTurns([]);
      setSelected('');
      setLocalSaved(false);
      setNotice('Deleted scope cleared from this device.');
      url('');
    };
    window.addEventListener('chat-recovery-deleted', deleted);
    return () => window.removeEventListener('chat-recovery-deleted', deleted);
  }, [accountId, subjectId, selected, retry, reset]);

  function url(id: string) {
    const next = new URL(window.location.href);
    if (id) {
      next.searchParams.set('conversation', id);
    } else {
      next.searchParams.delete('conversation');
    }
    window.history.replaceState(null, '', next);
  }
  function displayTrail([error, data]: TrailReadResult, signal?: AbortSignal, successNotice?: string) {
    if (!active.current || signal?.aborted) {
      return;
    }
    if (error !== null) {
      setTrailStatus('unavailable');
      setNotice(error.message);
      return;
    }
    setThreads(data);
    setTrailStatus('ready');
    if (successNotice) {
      setNotice(successNotice);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    void readTrail(subjectId, controller.signal).then(result => displayTrail(result, controller.signal));
    return () => {
      controller.abort();
      abort.current?.abort();
    };
  }, [subjectId]);
  useEffect(() => {
    if (!selected) {
      return;
    }
    const controller = new AbortController();
    void (async () => {
      const [error, data] = await readHistory(subjectId, selected, controller.signal);
      if (!active.current || controller.signal.aborted) {
        return;
      }
      if (error !== null) {
        if (error.code === 'unavailable') {
          // History has definitively rejected this scope; discard memory even if storage is unavailable.
          const [ignoredRecoveryError] = saveChatRecovery(accountId, subjectId, selected, null);
          void ignoredRecoveryError;
          setValue('text', '');
          setRetry(null);
          setLocalSaved(false);
        }
        setHistoryStatus('unavailable');
        setNotice(error.message);
        return;
      }
      setTurns(data);
      const [recoveryError, result] = readChatRecovery(accountId, subjectId, selected);
      const recovered = recoveryError === null && result.status === 'recovered' ? result.recovery : null;
      setValue('practice', recovered?.practice ?? data.at(-1)?.practice ?? false);
      setHistoryStatus('ready');
    })();
    return () => controller.abort();
  }, [selected, subjectId, accountId, setValue]);
  useEffect(() => { transcript.current?.scrollTo({ top: transcript.current.scrollHeight }); }, [turns]);

  function choose(id: string) {
    if (busy) {
      return;
    }
    if (id && id === selected) {
      setMobile('chat');
      return;
    }
    setHistoryStatus(id ? 'loading' : 'ready');
    setSelected(id);
    setTurns([]);
    setNotice('');
    restore(id);
    setMobile('chat');
    url(id);
  }
  async function send(fields: ComposerFields) {
    if (busy || loading || (!retry && !draft.trim())) {
      return;
    }
    const operation = retry ?? { subject: subjectId, conversation: selected || operationId(), operation: operationId(), text: fields.text, practice: fields.practice, ...(assessment ? { assessmentRevision: assessment.revision } : {}) };
    if (retry && !window.confirm('Check this same send? If it was saved, no generation is replayed. If it was not saved, this explicitly starts a request that may incur charges. Provider billing deduplication is not guaranteed.')) {
      return;
    }
    retain(operation.text, operation.practice, operation);
    setRetry(operation);
    setBusy(true);
    setNotice('Sending — not yet confirmed saved.');
    const controller = new AbortController();
    abort.current = controller;
    let saved = false;
    try {
      const [sendError, response] = await submitMessage(operation, controller.signal);
      if (!active.current || controller.signal.aborted) {
        return;
      }
      if (sendError !== null) {
        // Definitive rejections retain editable text; ambiguous failures retain exact identity.
        if (sendError.code === 'correction') {
          setRetry(null);
          retain(operation.text, operation.practice, null);
        }
        setNotice(`Send failed or unconfirmed. ${sendError.message}`);
        return;
      }
      if (response.headers.get('content-type')?.includes('application/json')) {
        saved = true;
        retain('', operation.practice, null);
        setSelected(operation.conversation);
        url(operation.conversation);
        setValue('text', '');
        setRetry(null);
        const [historyError, data] = await readHistory(subjectId, operation.conversation, controller.signal);
        if (!active.current || controller.signal.aborted) {
          return;
        }
        if (historyError !== null) {
          setHistoryStatus('unavailable');
          setNotice('Saved message found, but history could not be loaded. Reload to check.');
          return;
        }
        setTurns(data);
        setHistoryStatus('ready');
        const trail = await readTrail(subjectId, controller.signal);
        displayTrail(trail, controller.signal, 'Message already saved. No generation was retried.');
        return;
      }
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '', ended = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        if (!active.current || controller.signal.aborted) {
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        let end;
        while ((end = buffer.indexOf('\n')) !== -1) {
          const event = JSON.parse(buffer.slice(0, end));
          buffer = buffer.slice(end + 1);
          if (event.saved) {
            saved = true;
            retain('', operation.practice, null);
            setValue('text', '');
            setRetry(null);
            url(operation.conversation);
            setTurns(current => [...current.filter(turn => turn.id !== operation.operation), { id: operation.operation, ordinal: current.length + 1, user_text: operation.text, assistant_text: '', status: 'incomplete', pending_until: '' }]);
            setThreads(current => current.some(thread => thread.id === operation.conversation) ? current : [{ id: operation.conversation, title: operation.text.slice(0, 80) }, ...current]);
            setNotice('Message saved. Reply streaming — not complete yet.');
          }
          if (event.assessment) {
            setTurns(current => current.map(turn => turn.id === operation.operation ? { ...turn, assessment: event.assessment } : turn));
          }
          if (event.sources) {
            setTurns(current => current.map(turn => turn.id === operation.operation ? { ...turn, sources: event.sources } : turn));
          }
          if (event.delta) {
            setTurns(current => current.map(turn => turn.id === operation.operation ? { ...turn, assistant_text: turn.assistant_text + event.delta } : turn));
          }
          if (event.status) {
            ended = true;
            setTurns(current => current.map(turn => turn.id === operation.operation ? { ...turn, status: event.status } : turn));
            setNotice(event.error ?? 'Message and complete reply saved.');
          }
        }
      }
      if (!ended) {
        setNotice('Reply interrupted — incomplete. Reload to inspect saved output. No automatic generation retry was made.');
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setNotice(saved ? 'Message saved. Reply interrupted — incomplete. Reload to inspect saved output. No automatic generation retry was made.' : `Send failed or unconfirmed. ${error instanceof Error ? error.message : 'Check the same send to avoid duplication.'}`);
      }
    } finally {
      if (active.current) {
        setBusy(false);
        if (saved && !controller.signal.aborted) {
          setSelected(operation.conversation);
        }
      }
    }
  }
  return <section className="mt-8" aria-label="Learning Trail">
    <h2 className="text-xl font-semibold">Pick up a thread.</h2>
    <p className="my-3 text-sm text-muted-foreground">Talk about goals, organise your study, or explicitly ask for writing assistance. Source-based practice needs approved Learning Documents: switch on Use approved sources, then request practice, an explanation or a hint. Without approved material, write a Learning Document and choose Ready to Practice. Ordinary chat stays available with the switch off. Authored material and assisted reasoning are not independent evidence of understanding.</p>
    <nav className={styles.mobileNav} aria-label="Conversation views">
      <Button variant={mobile === 'threads' ? 'secondary' : 'ghost'} aria-pressed={mobile === 'threads'} onClick={() => setMobile('threads')}><History />Threads</Button>
      <Button variant={mobile === 'chat' ? 'secondary' : 'ghost'} aria-pressed={mobile === 'chat'} onClick={() => setMobile('chat')}><MessageCircle />Chat</Button>
    </nav>
    <div className={styles.workspace} data-view={mobile}>
      <ConversationThreads threads={threads} status={trailStatus} busy={busy} selected={selected} choose={choose} />
      <section className={styles.chat} aria-label="Subject conversation">
        <header className="border-b p-4 text-sm font-medium">{selected ? 'Continue this conversation' : 'What’s on your mind?'}</header>
        <div ref={transcript} className={styles.transcript} aria-label="Conversation messages" tabIndex={0} aria-busy={loading}>
          {loading && <p>Loading saved history…</p>}
          {historyStatus === 'unavailable' && <p>Conversation unavailable. Choose another thread or reload.</p>}
          {!turns.length && historyStatus === 'ready' && <p className="text-sm text-muted-foreground">Send a message to begin. Leaving does not finish a conversation.</p>}
          {turns.map(turn => <TranscriptTurn key={turn.id} turn={turn} />)}
          {assessment && <section aria-label="Assessment progress" className="space-y-2 rounded-xl border p-3 text-sm">
            <h3 className="font-medium">Assessment · {assessment.topic}</h3>
            <p>{assessment.opened} questions opened · {assessment.answered} answered · {assessment.skipped} skipped (not assessed)</p>
            <p>Activity progress, not a mastery score. Easy/medium/hard are AI-estimated task labels, not calibrated ability.</p>
            {assessment.current_question && <p>Current question {assessment.current_question.number} · {assessment.current_question.difficulty} · {assessment.current_question.assistance.length ? `Requested assistance: ${assessment.current_question.assistance.join(', ')}` : 'No requested assistance recorded'}</p>}
            <AssessmentBudgetStatus key={selected} budget={assessment.budget} disabled={busy || loading || Boolean(retry) || Boolean(draft.trim())} prepare={prepareAssessment} />
            <p>Unfinished activity resumes in this conversation. Conversation and recap review can continue independently.</p>
          </section>}
          {selected && <PracticeRecaps key={`${accountId}:${subjectId}:${selected}`} subject={subjectId} conversation={selected} activity={`${turns.length}:${turns.at(-1)?.status}`} checkpoint={Boolean(turns.at(-1)?.assistant_text.includes('[recap-checkpoint]'))} disabled={busy || loading} />}
        </div>
        <form className="shrink-0 border-t p-3" onSubmit={handleSubmit(send, invalid => {
          setNotice(invalid.text?.message ?? 'Invalid message.');
        })}>
          <div className="mb-2 flex flex-wrap gap-2">
            <Button type="button" className="min-h-11" variant="outline" disabled={busy || loading || Boolean(retry) || Boolean(draft.trim())} onClick={() => prepareAssessment(assessment ? 'Resume my assessment in this conversation. Keep the current question if it is unanswered.' : 'Start a quick assessment from my approved sources. Ask one question at a time.')}>{assessment ? 'Resume assessment' : 'Quick assessment'}</Button>
            {assessment?.current_question && <>
              <Button type="button" className="min-h-11" variant="ghost" disabled={busy || loading || Boolean(retry) || Boolean(draft.trim())} onClick={() => prepareAssessment('Please give a hint for the current assessment question.')}>Hint</Button>
              <Button type="button" className="min-h-11" variant="ghost" disabled={busy || loading || Boolean(retry) || Boolean(draft.trim())} onClick={() => prepareAssessment('Please explain the current assessment question before I answer.')}>Explain question</Button>
              <Button type="button" className="min-h-11" variant="ghost" disabled={busy || loading || Boolean(retry) || Boolean(draft.trim())} onClick={() => prepareAssessment('Skip the current assessment question; it is not assessed. Continue with another question if appropriate.')}>Skip question</Button>
            </>}
          </div>
          <label className="mb-3 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" {...register('practice', { onChange: () => {
            const fields = getValues();
            retain(fields.text, fields.practice, null);
          } })} disabled={busy || loading || Boolean(retry)} />Use approved sources for practice, explanations and hints</label>
          <label htmlFor="conversation-message" className="sr-only">Your message</label>
          <Textarea id="conversation-message" className="min-h-20 max-h-36 text-base" {...register('text', { onChange: () => {
            const fields = getValues();
            retain(fields.text, fields.practice, null);
          } })} aria-invalid={Boolean(errors.text)} aria-describedby={errors.text ? 'conversation-message-error' : undefined} disabled={busy || Boolean(retry)} placeholder="Bring a question…" />
          {errors.text && <p id="conversation-message-error" role="alert" className="text-sm text-destructive">{errors.text.message}</p>}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{draft || retry ? `${retry ? 'Unconfirmed send' : 'Unsent'} · ${localSaved ? 'Saved on this device' : 'Device recovery unavailable'} · ${retry ? 'server save unconfirmed' : 'not server-saved'} · device recovery does not synchronise` : 'Unsent text is not server-saved'}</span><Button type="submit" className="min-h-11" disabled={busy || loading || (!retry && !draft.trim())}><Send />{busy ? 'Sending…' : retry ? 'Retry same send' : 'Send message'}</Button></div>
        </form>
      </section>
    </div>
    {turns.at(-1)?.status === 'incomplete' && !retry && <Button variant="outline" disabled={busy || loading || Boolean(draft.trim())} onClick={() => {
      if (!window.confirm('Request another reply? The previous request may already have incurred charges. This sends a new message and may incur another charge; provider billing deduplication is not guaranteed.')) {
        return;
      }
      const text = 'Please try answering my previous message again. The previous reply was incomplete.';
      setValue('text', text);
      retain(text, practice, null);
      setNotice('New request prepared. Choose Send message to generate another reply.');
    }}>Request another reply</Button>}
    <p aria-live="polite" aria-label="Conversation status" className="mt-3 text-sm">{notice}</p>
    <p className="mt-3 text-xs leading-6 text-muted-foreground">This conversation and, only with Use approved sources enabled, current approved Practice versions and learner-reviewed provisional observations in this Subject are sent to OpenAI. Requesting a recap sends new conversation activity for a tentative interpretation; review is always explicit. Drafts and Reference notes are excluded. Sources are bounded to 20 documents / 16,000 bytes; oversized context is refused, not silently truncated. Requests use your selected key/model. History is stored in this app with optional provider response storage disabled. This does not eliminate provider retention: abuse-monitoring logs may retain content for up to 30 days, with policy exceptions. API usage may incur charges. Replies are limited to 2,048 output tokens; messages to 8,000 UTF-8 bytes and conversation context to 28,000 bytes. No automatic generation retries.</p>
  </section>;
}
