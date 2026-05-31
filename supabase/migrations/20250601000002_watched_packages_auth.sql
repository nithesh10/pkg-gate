-- PkgGate v2: auth-scoped watchlist (replace open demo RLS)
alter table public.watched_packages
  add column if not exists user_id uuid references auth.users(id);

drop policy if exists "Anyone can read watched packages" on public.watched_packages;
drop policy if exists "Anyone can insert watched packages" on public.watched_packages;
drop policy if exists "Anyone can update watched packages" on public.watched_packages;
drop policy if exists "Anyone can delete watched packages" on public.watched_packages;

alter table public.watched_packages drop constraint if exists watched_packages_name_key;

create unique index if not exists watched_packages_user_name_idx
  on public.watched_packages (user_id, name)
  where user_id is not null;

alter table public.watched_packages
  drop constraint if exists watched_packages_user_name_key;

alter table public.watched_packages
  add constraint watched_packages_user_name_key unique (user_id, name);

create policy "Users read own watchlist"
  on public.watched_packages for select
  using (auth.uid() = user_id);

create policy "Users insert own watchlist"
  on public.watched_packages for insert
  with check (auth.uid() = user_id);

create policy "Users update own watchlist"
  on public.watched_packages for update
  using (auth.uid() = user_id);

create policy "Users delete own watchlist"
  on public.watched_packages for delete
  using (auth.uid() = user_id);
