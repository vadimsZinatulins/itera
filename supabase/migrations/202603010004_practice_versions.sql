begin;

-- A single snapshot belongs to the document, but never changes on Draft saves.
-- Existing SELECT-only grants/RLS also protect this column from client writes.
alter table public.learning_documents add column practice_version jsonb;

create function public.approve_learning_document(p_id uuid, p_subject_id uuid, p_revision integer)
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
  -- Serialize with Draft saves and other approvals. The revision precondition
  -- binds approval to exactly the saved aggregate the learner reviewed.
  select * into result from public.learning_documents
    where id = p_id and subject_id = p_subject_id and account_id = auth.uid() for update;
  if result.id is null then
    raise sqlstate '42501' using message = 'Document unavailable';
  end if;
  if p_revision is null or result.revision <> p_revision then
    raise sqlstate '40001' using message = 'Draft changed; refresh and review';
  end if;
  if result.title !~ '[^[:space:]]' or not exists (
    select 1 from jsonb_array_elements(result.blocks) b where b->>'markdown' ~ '[[:alnum:]]'
  ) then
    raise sqlstate '22023' using message = 'A title and substantive saved block content are required';
  end if;
  -- Repeating the same approval is a no-op, including after a lost response.
  if result.practice_version->>'revision' = p_revision::text then
    return result;
  end if;
  update public.learning_documents set practice_version = jsonb_build_object(
    'revision', revision, 'title', title, 'description', description, 'blocks', blocks
  ), updated_at = now() where id = result.id returning * into result;
  return result;
end;
$$;
revoke all on function public.approve_learning_document(uuid, uuid, integer) from public, anon;
grant execute on function public.approve_learning_document(uuid, uuid, integer) to authenticated;
commit;
notify pgrst, 'reload schema';
