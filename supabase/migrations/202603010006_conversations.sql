begin;
create table public.conversations (
  id uuid primary key,
  account_id uuid not null references public.learner_accounts(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);
-- Each turn atomically saves the user message and a durable reply outcome.
create table public.conversation_turns (
  id uuid primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  account_id uuid not null references public.learner_accounts(id) on delete cascade,
  ordinal integer not null,
  user_text text not null,
  assistant_text text not null default '',
  status text not null default 'incomplete' check (status in ('incomplete','complete')),
  pending_until timestamptz not null default now() + interval '90 seconds',
  unique(conversation_id, ordinal)
);
alter table public.conversations enable row level security;
alter table public.conversation_turns enable row level security;
revoke all on public.conversations, public.conversation_turns from anon, authenticated;
grant select on public.conversations, public.conversation_turns to authenticated;
create policy conversations_read on public.conversations for select to authenticated using (account_id = (select auth.uid()) and (select public.has_active_session()));
create policy turns_read on public.conversation_turns for select to authenticated using (account_id = (select auth.uid()) and (select public.has_active_session()));

create function public.send_conversation_message(p_subject uuid, p_conversation uuid, p_operation uuid, p_text text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare c public.conversations; t public.conversation_turns; n integer;
begin
  if auth.uid() is null or not public.has_active_session() or not exists(select 1 from public.subjects where id=p_subject and account_id=auth.uid()) then
    raise sqlstate '42501' using message='Subject unavailable';
  end if;
  -- Serialise first sends as well as continuations, including across devices.
  perform pg_advisory_xact_lock(hashtextextended(p_conversation::text, 0));
  select * into c from public.conversations where id=p_conversation;
  if c.id is not null and (c.account_id<>auth.uid() or c.subject_id<>p_subject) then
    raise sqlstate '42501' using message='Conversation unavailable';
  end if;
  select * into t from public.conversation_turns where id=p_operation;
  if t.id is not null then
    if t.account_id<>auth.uid() or t.conversation_id<>p_conversation or t.user_text<>p_text then
      raise sqlstate '22023' using message='Operation identity conflict';
    end if;
    return false; -- Never replay a possibly charged generation.
  end if;
  if p_text is null or length(btrim(p_text))=0 or octet_length(p_text)>8000 then
    raise sqlstate '22023' using message='Message limit exceeded';
  end if;
  select count(*) into n from public.conversation_turns where conversation_id=p_conversation;
  if n>=100 or (select coalesce(sum(octet_length(user_text)+octet_length(assistant_text)),0) from public.conversation_turns where conversation_id=p_conversation)+octet_length(p_text)>28000 then
    raise sqlstate '22023' using message='Conversation context limit reached; use a new thread';
  end if;
  if exists(select 1 from public.conversation_turns where conversation_id=p_conversation and pending_until>now()) then
    raise sqlstate '40001' using message='Reply already in progress';
  end if;
  if c.id is null then
    insert into public.conversations(id,account_id,subject_id,title) values(p_conversation,auth.uid(),p_subject,left(p_text,80));
  end if;
  insert into public.conversation_turns(id,conversation_id,account_id,ordinal,user_text) values(p_operation,p_conversation,auth.uid(),n+1,p_text);
  return true;
end; $$;

-- Only trusted server output can become an assistant message. Updates never insert
-- missing rows: late provider work cannot resurrect deleted Subjects/history.
create function public.server_conversation_reply(p_owner uuid,p_subject uuid,p_conversation uuid,p_operation uuid,p_text text,p_complete boolean,p_final boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if octet_length(p_text)>16000 then raise sqlstate '22023'; end if;
  update public.conversation_turns t set assistant_text=p_text,
    status=case when p_complete then 'complete' else 'incomplete' end,
    pending_until=case when p_final then now() else t.pending_until end
    where t.id=p_operation and t.conversation_id=p_conversation and t.account_id=p_owner
      and t.pending_until>now() and exists(select 1 from public.conversations c where c.id=t.conversation_id and c.account_id=p_owner and c.subject_id=p_subject);
  return found;
end; $$;
revoke all on function public.send_conversation_message(uuid,uuid,uuid,text) from public,anon;
grant execute on function public.send_conversation_message(uuid,uuid,uuid,text) to authenticated;
revoke all on function public.server_conversation_reply(uuid,uuid,uuid,uuid,text,boolean,boolean) from public,anon,authenticated;
grant execute on function public.server_conversation_reply(uuid,uuid,uuid,uuid,text,boolean,boolean) to service_role;
commit;
notify pgrst, 'reload schema';
