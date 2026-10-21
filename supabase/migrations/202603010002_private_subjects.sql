begin;

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null default auth.uid() references public.learner_accounts(id) on delete cascade,
  -- Match JavaScript String.trim whitespace, including NBSP and BOM. Direct
  -- public data writes must not bypass the application's name normalization.
  name text not null check (
    name = btrim(name, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
    and length(name) between 1 and 80
  ),
  created_at timestamptz not null default now()
);
-- The database arbitrates concurrent duplicate creation, scoped to the account.
create unique index subjects_account_name on public.subjects(account_id, lower(name));
alter table public.subjects enable row level security;
revoke all on public.subjects from anon, authenticated;
grant select, insert on public.subjects to authenticated;
create policy subjects_private_read on public.subjects for select to authenticated
  using (account_id = (select auth.uid()) and (select public.has_active_session()));
create policy subjects_private_create on public.subjects for insert to authenticated
  with check (account_id = (select auth.uid()) and (select public.has_active_session()));

commit;
notify pgrst, 'reload schema';
