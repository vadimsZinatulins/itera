-- Temporary owner-pilot plaintext exception. Not application secret encryption.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.openai_settings (
  account_id uuid primary key references public.learner_accounts(id) on delete cascade,
  api_key text not null,
  model text
);
alter table private.openai_settings enable row level security;
revoke all on private.openai_settings from public, anon, authenticated;

-- Only the isolated server credential client may call these functions.
-- Normal user JWTs cannot read secrets even through direct RPC calls.
create function public.server_openai_read(owner_id uuid)
returns table(api_key text, model text)
language sql security definer set search_path = '' as $$
  select s.api_key, s.model from private.openai_settings s where s.account_id = owner_id;
$$;
create function public.server_openai_write(owner_id uuid, secret text, selected_model text)
returns void language sql security definer set search_path = '' as $$
  insert into private.openai_settings(account_id, api_key, model) values (owner_id, secret, selected_model)
  on conflict(account_id) do update set api_key = excluded.api_key, model = excluded.model;
$$;
create function public.server_openai_remove(owner_id uuid)
returns void language sql security definer set search_path = '' as $$
  delete from private.openai_settings where account_id = owner_id;
$$;
revoke all on function public.server_openai_read(uuid), public.server_openai_write(uuid,text,text), public.server_openai_remove(uuid) from public, anon, authenticated;
grant execute on function public.server_openai_read(uuid), public.server_openai_write(uuid,text,text), public.server_openai_remove(uuid) to service_role;
commit;
notify pgrst, 'reload schema';
