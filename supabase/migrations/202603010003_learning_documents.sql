begin;

-- A Draft is one atomic aggregate: JSON array order is Markdown block order.
create table public.learning_documents (
  id uuid primary key,
  account_id uuid not null references public.learner_accounts(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  revision integer not null check (revision > 0),
  title text not null,
  description text not null,
  blocks jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.learning_documents enable row level security;
revoke all on public.learning_documents from anon, authenticated;
grant select on public.learning_documents to authenticated;
create policy documents_private_read on public.learning_documents for select to authenticated
  using (account_id = (select auth.uid()) and (select public.has_active_session()));

-- Only this compare-and-swap boundary may write; direct REST writes cannot skip revisions.
create function public.save_learning_document(p_id uuid, p_subject_id uuid, p_revision integer, p_title text, p_description text, p_blocks jsonb)
returns public.learning_documents
language plpgsql security definer set search_path = ''
as $$
declare result public.learning_documents;
begin
  if auth.uid() is null or not public.has_active_session() then
    raise sqlstate '42501' using message = 'Sign in required';
  end if;
  if not exists (select 1 from public.subjects where id = p_subject_id and account_id = auth.uid()) then
    raise sqlstate '42501' using message = 'Subject unavailable';
  end if;
  if p_revision is null or p_revision < 0 or p_title is null or length(p_title) > 300
    or p_description is null or length(p_description) > 5000
    or p_blocks is null or jsonb_typeof(p_blocks) <> 'array' then
    raise sqlstate '22023' using message = 'Invalid Draft';
  end if;
  if jsonb_array_length(p_blocks) > 200 or octet_length(p_blocks::text) > 500000 then
    raise sqlstate '22023' using message = 'Draft too large';
  end if;
  if exists (select 1 from jsonb_array_elements(p_blocks) b
    where jsonb_typeof(b) <> 'object' or jsonb_typeof(b->'id') is distinct from 'string'
      or length(b->>'id') not between 1 and 80 or jsonb_typeof(b->'markdown') is distinct from 'string')
    or (select count(*) <> count(distinct b->>'id') from jsonb_array_elements(p_blocks) b) then
    raise sqlstate '22023' using message = 'Invalid blocks';
  end if;
  if p_revision = 0 then
    insert into public.learning_documents(id, account_id, subject_id, revision, title, description, blocks)
      values (p_id, auth.uid(), p_subject_id, 1, p_title, p_description, p_blocks)
      on conflict (id) do nothing returning * into result;
  else
    update public.learning_documents set title = p_title, description = p_description,
      blocks = p_blocks, revision = revision + 1, updated_at = now()
      where id = p_id and account_id = auth.uid() and subject_id = p_subject_id and revision = p_revision
      returning * into result;
  end if;
  if result.id is null then
    raise sqlstate '40001' using message = 'Draft changed; refresh and review';
  end if;
  return result;
end;
$$;
revoke all on function public.save_learning_document(uuid, uuid, integer, text, text, jsonb) from public, anon;
grant execute on function public.save_learning_document(uuid, uuid, integer, text, text, jsonb) to authenticated;
commit;
notify pgrst, 'reload schema';
