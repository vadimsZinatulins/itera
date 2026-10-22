begin;
alter table public.conversation_turns add column practice boolean not null default false;
alter table public.conversation_turns add column sources jsonb not null default '[]';
alter function public.send_conversation_message(uuid,uuid,uuid,text) rename to save_conversation_message;
revoke all on function public.save_conversation_message(uuid,uuid,uuid,text) from authenticated;
create function public.send_conversation_message(p_subject uuid,p_conversation uuid,p_operation uuid,p_text text,p_practice boolean default false)
returns boolean language plpgsql security definer set search_path = '' as $$
declare inserted boolean;
begin
  inserted := public.save_conversation_message(p_subject,p_conversation,p_operation,p_text);
  if not inserted and exists(select 1 from public.conversation_turns where id=p_operation and practice<>p_practice) then
    raise sqlstate '22023' using message='Operation identity conflict';
  end if;
  if inserted then update public.conversation_turns set practice=p_practice where id=p_operation; end if;
  return inserted;
end; $$;
revoke all on function public.send_conversation_message(uuid,uuid,uuid,text,boolean) from public,anon;
grant execute on function public.send_conversation_message(uuid,uuid,uuid,text,boolean) to authenticated;

-- Capture coherent approved snapshots and retain only source identity/version/title.
-- No full-source archive is retained in the conversation.
create function public.server_practice_context(p_owner uuid,p_subject uuid,p_operation uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare material jsonb; provenance jsonb;
begin
  perform 1 from public.conversation_turns t join public.conversations c on c.id=t.conversation_id
    where t.id=p_operation and t.account_id=p_owner and c.account_id=p_owner
      and c.subject_id=p_subject and t.practice and t.pending_until>now() for update of t;
  if not found then raise sqlstate '42501'; end if;
  if (select count(*)>20 or coalesce(sum(octet_length(practice_version::text)),0)>16000
      from public.learning_documents where account_id=p_owner and subject_id=p_subject and practice_version is not null) then
    raise sqlstate '22023' using message='Approved source context too large';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'version',practice_version) order by id),'[]')
    into material from public.learning_documents
    where account_id=p_owner and subject_id=p_subject and practice_version is not null;
  if jsonb_array_length(material)>20 or octet_length(material::text)>16000 then
    raise sqlstate '22023' using message='Approved source context too large';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',s->>'id','revision',s->'version'->'revision','title',s->'version'->>'title')),'[]')
    into provenance from jsonb_array_elements(material) s;
  update public.conversation_turns set sources=provenance where id=p_operation;
  return material;
end; $$;
revoke all on function public.server_practice_context(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.server_practice_context(uuid,uuid,uuid) to service_role;
commit;
notify pgrst, 'reload schema';
