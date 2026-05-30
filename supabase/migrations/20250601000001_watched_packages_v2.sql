-- PkgGate v2: extend watched_packages with full safety report snapshot
alter table public.watched_packages
  drop constraint if exists watched_packages_status_check;

alter table public.watched_packages
  add column if not exists verdict text check (verdict in ('green', 'yellow', 'red')),
  add column if not exists blocked boolean not null default false,
  add column if not exists signals_json jsonb,
  add column if not exists last_checked_at timestamptz;

alter table public.watched_packages
  add constraint watched_packages_status_check
  check (status in ('pass', 'fail', 'warn'));

update public.watched_packages
set
  verdict = case status when 'pass' then 'green' else 'red' end,
  blocked = (status = 'fail'),
  last_checked_at = coalesce(last_checked_at, created_at)
where verdict is null;
