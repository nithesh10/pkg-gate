-- PkgGate v2: persistent safety report cache (service role only)
create table if not exists public.package_checks_cache (
  id uuid primary key default gen_random_uuid(),
  package_name text not null,
  package_version text not null,
  report_json jsonb not null,
  checked_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique (package_name, package_version)
);

create index if not exists package_checks_cache_expires_idx
  on public.package_checks_cache (expires_at);

alter table public.package_checks_cache enable row level security;

-- No public policies — access via service role only
