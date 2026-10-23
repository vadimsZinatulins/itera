begin;
create table public.chat_assessments (
  conversation_id uuid primary key references public.conversations(id) on delete cascade,
  account_id uuid not null references public.learner_accounts(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  revision integer not null default 0,
  topic text not null,
  requested_difficulty text check(requested_difficulty in ('easy','medium','hard')),
  current_question uuid
);
create table public.assessment_questions (
  id uuid primary key references public.conversation_turns(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  account_id uuid not null references public.learner_accounts(id) on delete cascade,
  number integer not null,
  question text not null,
  difficulty text not null check(difficulty in ('easy','medium','hard')),
  status text not null default 'open' check(status in ('open','answered','skipped')),
  unique(conversation_id,number)
);
create table public.assessment_responses (
  turn_id uuid primary key references public.conversation_turns(id) on delete cascade,
  account_id uuid not null references public.learner_accounts(id) on delete cascade,
  question_id uuid not null references public.assessment_questions(id) on delete cascade,
  action text not null check(action in ('answer','hint','explanation','skip'))
);
alter table public.chat_assessments enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_responses enable row level security;
revoke all on public.chat_assessments,public.assessment_questions,public.assessment_responses from anon,authenticated;
grant select on public.chat_assessments,public.assessment_questions,public.assessment_responses to authenticated;
create policy assessment_read on public.chat_assessments for select to authenticated using(account_id=(select auth.uid()) and (select public.has_active_session()));
create policy questions_read on public.assessment_questions for select to authenticated using(account_id=(select auth.uid()) and (select public.has_active_session()));
create policy responses_read on public.assessment_responses for select to authenticated using(account_id=(select auth.uid()) and (select public.has_active_session()));
alter table public.conversation_turns add column assessment jsonb;
alter table public.conversation_turns add column assessment_context jsonb;
alter table public.conversation_turns add column assessment_revision integer;

-- Internal snapshot: only called within owned send/finalisation functions.
create function public.assessment_snapshot(p_conversation uuid) returns jsonb language sql stable set search_path='' as $$
  select to_jsonb(a) || jsonb_build_object('current_question',(select to_jsonb(q) || jsonb_build_object('assistance',(select coalesce(jsonb_agg(r.action),'[]') from public.assessment_responses r where r.question_id=q.id and r.action in ('hint','explanation'))) from public.assessment_questions q where q.id=a.current_question),
    'opened',(select count(*) from public.assessment_questions where conversation_id=a.conversation_id),
    'answered',(select count(*) from public.assessment_questions where conversation_id=a.conversation_id and status='answered'),
    'skipped',(select count(*) from public.assessment_questions where conversation_id=a.conversation_id and status='skipped'))
  from public.chat_assessments a where a.conversation_id=p_conversation;
$$;
revoke all on function public.assessment_snapshot(uuid) from public,anon,authenticated;
alter function public.send_conversation_message(uuid,uuid,uuid,text,boolean) rename to save_practice_message;
revoke all on function public.save_practice_message(uuid,uuid,uuid,text,boolean) from authenticated;
create function public.send_conversation_message(p_subject uuid,p_conversation uuid,p_operation uuid,p_text text,p_practice boolean default false,p_assessment_revision integer default null)
returns boolean language plpgsql security definer set search_path='' as $$
declare inserted boolean; snapshot jsonb;
begin
  inserted := public.save_practice_message(p_subject,p_conversation,p_operation,p_text,p_practice);
  if not inserted then
    if exists(select 1 from public.conversation_turns where id=p_operation and assessment_revision is distinct from p_assessment_revision) then raise sqlstate '22023'; end if;
    return false;
  end if;
  snapshot := public.assessment_snapshot(p_conversation);
  if p_assessment_revision is not null and p_assessment_revision<>coalesce((snapshot->>'revision')::integer,0) then raise sqlstate '40001' using message='Assessment changed; reload before answering'; end if;
  update public.conversation_turns set assessment_revision=p_assessment_revision,assessment_context=coalesce(snapshot,'{}') where id=p_operation;
  return true;
end; $$;
revoke all on function public.send_conversation_message(uuid,uuid,uuid,text,boolean,integer) from public,anon;
grant execute on function public.send_conversation_message(uuid,uuid,uuid,text,boolean,integer) to authenticated;

-- Commit question progress and the completed human-readable reply together.
-- No incomplete model JSON is exposed or treated as a completed question.
create function public.server_assessment_reply(p_owner uuid,p_subject uuid,p_conversation uuid,p_operation uuid,p_text text,p_topic text,p_requested_difficulty text,p_action text,p_question text,p_difficulty text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.conversation_turns; a public.chat_assessments; q public.assessment_questions; snapshot jsonb; n integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_conversation::text,0));
  select * into t from public.conversation_turns where id=p_operation and conversation_id=p_conversation and account_id=p_owner and practice and pending_until>now() for update;
  if t.id is null or jsonb_array_length(t.sources)=0 or not exists(select 1 from public.conversations where id=p_conversation and account_id=p_owner and subject_id=p_subject) then raise sqlstate '42501'; end if;
  select * into a from public.chat_assessments where conversation_id=p_conversation for update;
  if coalesce(a.revision,0)<>coalesce((t.assessment_context->>'revision')::integer,0) then raise sqlstate '40001'; end if;
  if p_topic is null or length(btrim(p_topic))=0 or octet_length(p_topic)>300 or octet_length(p_text)>16000 or p_action not in ('answer','hint','explanation','skip','chat','resume') or (p_question is not null and (length(btrim(p_question))=0 or octet_length(p_question)>6000 or p_difficulty is null or p_difficulty not in ('easy','medium','hard'))) then raise sqlstate '22023'; end if;
  if a.conversation_id is null then
    insert into public.chat_assessments(conversation_id,account_id,subject_id,topic,requested_difficulty) values(p_conversation,p_owner,p_subject,p_topic,p_requested_difficulty) returning * into a;
  end if;
  select * into q from public.assessment_questions where id=a.current_question;
  if q.id is not null and q.status='open' and p_action in ('answer','hint','explanation','skip') then
    insert into public.assessment_responses(turn_id,account_id,question_id,action) values(p_operation,p_owner,q.id,p_action);
    if p_action in ('answer','skip') then
      update public.assessment_questions set status=case when p_action='skip' then 'skipped' else 'answered' end where id=q.id;
      a.current_question := null;
    end if;
  end if;
  if p_question is not null then
    -- A hint/chat/resume must never silently replace an unanswered question.
    if a.current_question is not null then raise sqlstate '22023'; end if;
    select count(*)+1 into n from public.assessment_questions where conversation_id=p_conversation;
    insert into public.assessment_questions(id,conversation_id,account_id,number,question,difficulty) values(p_operation,p_conversation,p_owner,n,p_question,p_difficulty);
    a.current_question := p_operation;
  end if;
  update public.chat_assessments set topic=p_topic,requested_difficulty=p_requested_difficulty,current_question=a.current_question,revision=revision+1 where conversation_id=p_conversation;
  snapshot := public.assessment_snapshot(p_conversation);
  update public.conversation_turns set assistant_text=p_text,status='complete',pending_until=now(),assessment=snapshot where id=p_operation;
  return snapshot;
end; $$;
revoke all on function public.server_assessment_reply(uuid,uuid,uuid,uuid,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.server_assessment_reply(uuid,uuid,uuid,uuid,text,text,text,text,text,text) to service_role;
commit;
notify pgrst, 'reload schema';
