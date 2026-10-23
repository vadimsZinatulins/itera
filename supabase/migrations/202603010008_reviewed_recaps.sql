begin;
create table public.subject_understanding (
  subject_id uuid primary key references public.subjects(id) on delete cascade,
  account_id uuid not null references public.learner_accounts(id) on delete cascade,
  revision integer not null default 0
);
create table public.practice_recaps (
  id uuid primary key,
  account_id uuid not null references public.learner_accounts(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  revision integer not null,
  coverage_from integer not null,
  coverage_to integer not null,
  sources jsonb not null,
  proposal jsonb,
  status text not null default 'pending' check(status in ('pending','proposed','accepted','corrected','dismissed')),
  created_at timestamptz not null default now()
);
-- Observation lifetime is independent of proposal/transcript lifetime.
create table public.reviewed_observations (
  id uuid primary key,
  account_id uuid not null references public.learner_accounts(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  origin_conversation_id uuid not null,
  coverage_from integer not null,
  coverage_to integer not null,
  sources jsonb not null,
  observation jsonb not null,
  review text not null check(review in ('accepted','corrected')),
  created_at timestamptz not null default now()
);
-- Checkpoints survive observation removal/reset; old activity must not be rebuilt.
create table public.reviewed_coverage (
  conversation_id uuid primary key references public.conversations(id) on delete cascade,
  account_id uuid not null references public.learner_accounts(id) on delete cascade,
  through_ordinal integer not null
);
alter table public.subject_understanding enable row level security;
alter table public.practice_recaps enable row level security;
alter table public.reviewed_observations enable row level security;
alter table public.reviewed_coverage enable row level security;
revoke all on public.subject_understanding,public.practice_recaps,public.reviewed_observations,public.reviewed_coverage from anon,authenticated;
grant select on public.subject_understanding,public.practice_recaps,public.reviewed_observations,public.reviewed_coverage to authenticated;
create policy understanding_read on public.subject_understanding for select to authenticated using(account_id=(select auth.uid()) and (select public.has_active_session()));
create policy recaps_read on public.practice_recaps for select to authenticated using(account_id=(select auth.uid()) and (select public.has_active_session()));
create policy observations_read on public.reviewed_observations for select to authenticated using(account_id=(select auth.uid()) and (select public.has_active_session()));
create policy coverage_read on public.reviewed_coverage for select to authenticated using(account_id=(select auth.uid()) and (select public.has_active_session()));

create function public.valid_recap(p jsonb) returns boolean language sql immutable set search_path='' as $$
  select coalesce(jsonb_typeof(p)='object' and p ?& array['text','difficulty','assistance','uncertainty']
    and (select count(*)=4 from jsonb_object_keys(p))
    and not exists(select 1 from jsonb_each(p) e where jsonb_typeof(e.value)<>'string' or length(btrim(e.value#>>'{}'))=0 or octet_length(e.value#>>'{}')>1200),false);
$$;
create function public.prepare_practice_recap(p_subject uuid,p_conversation uuid,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.practice_recaps; rev integer; checkpoint integer; last_turn integer; provenance jsonb;
begin
  if auth.uid() is null or not public.has_active_session() or not exists(select 1 from public.conversations where id=p_conversation and subject_id=p_subject and account_id=auth.uid()) then raise sqlstate '42501'; end if;
  insert into public.subject_understanding(subject_id,account_id) values(p_subject,auth.uid()) on conflict do nothing;
  select revision into rev from public.subject_understanding where subject_id=p_subject for update;
  select * into r from public.practice_recaps where id=p_operation;
  if r.id is not null then
    if r.account_id<>auth.uid() or r.subject_id<>p_subject or r.conversation_id<>p_conversation then raise sqlstate '42501'; end if;
    return jsonb_build_object('duplicate',true,'id',r.id); -- Never replay provider work.
  end if;
  select coalesce(max(through_ordinal),0) into checkpoint from public.reviewed_coverage where conversation_id=p_conversation;
  select max(ordinal) into last_turn from public.conversation_turns where conversation_id=p_conversation;
  if last_turn is null or last_turn<=checkpoint or exists(select 1 from public.conversation_turns where conversation_id=p_conversation and pending_until>now()) or not exists(select 1 from public.conversation_turns where conversation_id=p_conversation and ordinal>checkpoint and practice and status='complete' and jsonb_array_length(sources)>0) then raise sqlstate '22023' using message='No new completed practice activity'; end if;
  select coalesce(jsonb_agg(distinct s),'[]') into provenance from public.conversation_turns t cross join lateral jsonb_array_elements(t.sources) s where t.conversation_id=p_conversation and t.ordinal>checkpoint;
  insert into public.practice_recaps(id,account_id,subject_id,conversation_id,revision,coverage_from,coverage_to,sources) values(p_operation,auth.uid(),p_subject,p_conversation,rev,checkpoint+1,last_turn,provenance);
  return jsonb_build_object('id',p_operation,'activity',(select jsonb_agg(jsonb_build_object('ordinal',ordinal,'learner',user_text,'companion',assistant_text,'status',status,'practice',practice) order by ordinal) from public.conversation_turns where conversation_id=p_conversation and ordinal>checkpoint and ordinal<=last_turn));
end; $$;
create function public.server_complete_recap(p_owner uuid,p_operation uuid,p_proposal jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  if not public.valid_recap(p_proposal) then raise sqlstate '22023'; end if;
  update public.practice_recaps set proposal=p_proposal,status='proposed' where id=p_operation and account_id=p_owner and status='pending';
  return found;
end; $$;
create function public.review_practice_recap(p_subject uuid,p_operation uuid,p_action text,p_observation jsonb default null)
returns boolean language plpgsql security definer set search_path='' as $$
declare r public.practice_recaps; rev integer; outcome jsonb; checkpoint integer;
begin
  if auth.uid() is null or not public.has_active_session() or not exists(select 1 from public.subjects where id=p_subject and account_id=auth.uid()) then raise sqlstate '42501'; end if;
  select revision into rev from public.subject_understanding where subject_id=p_subject for update;
  select * into r from public.practice_recaps where id=p_operation and account_id=auth.uid() and subject_id=p_subject for update;
  if r.id is null then raise sqlstate '42501'; end if;
  if p_action not in ('accepted','corrected','dismissed') then raise sqlstate '22023'; end if;
  outcome := case when p_action='corrected' then p_observation else r.proposal end;
  if r.status=p_action and (p_action<>'corrected' or exists(select 1 from public.reviewed_observations where id=r.id and observation=outcome)) then return false; end if;
  if r.status<>'proposed' then raise sqlstate '40001'; end if;
  if p_action='dismissed' then update public.practice_recaps set status=p_action where id=r.id; return true; end if;
  select coalesce(max(through_ordinal),0) into checkpoint from public.reviewed_coverage where conversation_id=r.conversation_id;
  if rev<>r.revision or checkpoint>=r.coverage_from then raise sqlstate '40001'; end if;
  if not public.valid_recap(outcome) then raise sqlstate '22023'; end if;
  insert into public.reviewed_observations(id,account_id,subject_id,conversation_id,origin_conversation_id,coverage_from,coverage_to,sources,observation,review) values(r.id,r.account_id,r.subject_id,r.conversation_id,r.conversation_id,r.coverage_from,r.coverage_to,r.sources,outcome,p_action);
  insert into public.reviewed_coverage values(r.conversation_id,r.account_id,r.coverage_to) on conflict(conversation_id) do update set through_ordinal=excluded.through_ordinal;
  update public.subject_understanding set revision=revision+1 where subject_id=p_subject;
  update public.practice_recaps set status=p_action where id=r.id;
  return true;
end; $$;
revoke all on function public.prepare_practice_recap(uuid,uuid,uuid),public.review_practice_recap(uuid,uuid,text,jsonb) from public,anon;
grant execute on function public.prepare_practice_recap(uuid,uuid,uuid),public.review_practice_recap(uuid,uuid,text,jsonb) to authenticated;
revoke all on function public.server_complete_recap(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.server_complete_recap(uuid,uuid,jsonb) to service_role;
commit;
notify pgrst, 'reload schema';
