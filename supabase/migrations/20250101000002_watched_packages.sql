-- Watched npm packages for PkgGate (v1: no auth — open RLS for demo)
create table if not exists public.watched_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  version text not null,
  published_at timestamptz not null,
  status text not null check (status in ('pass', 'fail')),
  created_at timestamptz not null default now()
);

alter table public.watched_packages enable row level security;

create policy "Anyone can read watched packages"
  on public.watched_packages
  for select
  using (true);

create policy "Anyone can insert watched packages"
  on public.watched_packages
  for insert
  with check (true);

create policy "Anyone can update watched packages"
  on public.watched_packages
  for update
  using (true);

create policy "Anyone can delete watched packages"
  on public.watched_packages
  for delete
  using (true);
