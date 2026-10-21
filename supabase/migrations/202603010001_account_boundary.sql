-- Apply with a trusted migration role. No service-role key belongs in the app.
begin;

-- Supabase JWTs can outlive logout. Check the live session for immediate denial.
create or replace function public.has_active_session()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.sessions
    where id = (auth.jwt()->>'session_id')::uuid
      and user_id = auth.uid()
  );
$$;
revoke all on function public.has_active_session() from public, anon;
grant execute on function public.has_active_session() to authenticated;

create table public.learner_accounts (
  id uuid primary key references auth.users(id) on delete cascade
);
alter table public.learner_accounts enable row level security;
revoke all on public.learner_accounts from anon, authenticated;
grant select on public.learner_accounts to authenticated;
create policy account_private_read on public.learner_accounts
  for select to authenticated
  using (id = (select auth.uid()) and (select public.has_active_session()));

create function public.create_learner_account()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.learner_accounts(id) values (new.id);
  return new;
end;
$$;
revoke all on function public.create_learner_account() from public, anon, authenticated;
create trigger provision_learner_account after insert on auth.users
  for each row execute function public.create_learner_account();
insert into public.learner_accounts(id) select id from auth.users;

commit;
notify pgrst, 'reload schema';
